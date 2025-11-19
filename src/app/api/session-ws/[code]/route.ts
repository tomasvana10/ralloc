import type { NextRequest } from "next/server";
import type { RouteContext } from "next-ws/server";
import type { WebSocket, WebSocketServer } from "ws";
import { auth } from "@/auth";
import {
  type GroupSessionData,
  getGroupSessionByCode,
  getHostId,
  joinGroup,
  leaveGroup,
  paths,
} from "@/db/group-session";
import redis, { createSubClient } from "@/db/redis";
import {
  GroupSessionC2S,
  GroupSessionS2C,
} from "@/lib/group-session/messaging";
import { UserRepresentation } from "@/lib/group-session/user-representation";

export function GET() {
  const headers = new Headers();
  headers.set("Connection", "Upgrade");
  headers.set("Upgrade", "websocket");
  return new Response("Upgrade Required", { status: 426, headers });
}

interface State {
  /**
   * Store for values that are needed to join/leave groups.
   * Updated
   */
  cache: Pick<GroupSessionData, "groupSize" | "frozen">;
  lastSynchroniseDueToGroupUpdateError: number;
  synchroniseCounter: number;
}

function updateCache(cache: State["cache"], args: State["cache"]) {
  Object.assign(cache, args);
}

async function doSafeSync(state: State, code: string, ws: WebSocket) {
  const syncPayload = await prepareSyncPayload(state, code);
  if (syncPayload) {
    send(ws, syncPayload);
    return true;
  } else {
    ws.close(
      GroupSessionS2C.CloseEventCodes.GroupSessionWasDeleted,
      "The group session was deleted",
    );
    return false;
  }
}

async function prepareSyncPayload(state: State, code: string) {
  const data = await getGroupSessionByCode(code);
  if (!data) return null;
  updateCache(state.cache, { groupSize: data.groupSize, frozen: data.frozen });

  const syncPayload: GroupSessionS2C.Payloads.Synchronise = {
    code: GroupSessionS2C.Code.Synchronise,
    data,
  };

  return syncPayload;
}

function prepareSyncPayloadFromExistingData(
  state: State,
  data: GroupSessionData,
) {
  updateCache(state.cache, { groupSize: data.groupSize, frozen: data.frozen });

  const syncPayload: GroupSessionS2C.Payloads.Synchronise = {
    code: GroupSessionS2C.Code.Synchronise,
    data,
  };

  return syncPayload;
}

function send(ws: WebSocket, payload: GroupSessionS2C.Payload) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(payload));
}

function sendStringified(ws: WebSocket, payload: string) {
  if (ws.readyState === ws.OPEN) ws.send(payload);
}

export async function UPGRADE(
  client: WebSocket,
  server: WebSocketServer,
  _request: NextRequest,
  ctx: RouteContext<"/api/session-ws/[code]">,
) {
  const { code } = ctx.params;

  console.debug("new client connection");
  const hostId = (await getHostId(code))!;
  const session = (await auth())!;
  const userId = session.user.id;

  /*
  const { res } = await rateLimit(
    userId,
    "UPGRADE@sessions-ws/[code]",
    12,
    5,
  );
  if (res)
    client.close(
      GroupSessionS2C.CloseEventCodes.RateLimited,
      "rate limit exceeded",
    );
    */

  const pingInt = setInterval(() => {
    if (client.readyState === client.OPEN) client.ping();
  }, GroupSessionS2C.PingFrameIntervalMS);

  const state: State = {
    cache: {
      groupSize: 0,
      frozen: false,
    },
    lastSynchroniseDueToGroupUpdateError: 0,
    synchroniseCounter: 0,
  };

  if (!(await doSafeSync(state, code, client))) return;

  const sub = await createSubClient(redis);

  await sub.subscribe(paths.pubsub.patched(code), async (msg) => {
    const replyPayload = JSON.stringify(
      prepareSyncPayloadFromExistingData(state, JSON.parse(msg)),
    );
    for (const c of server.clients) {
      sendStringified(c, replyPayload);
    }
  });

  // the JoinGroup and LeaveGroup scripts already have checks that
  // would return a fail code if the group session was deleted as
  // a message was being processed. since this is extremely unlikely,
  // an error message unindicative of what actually happened is a worthy
  // tradeoff
  await sub.subscribe(paths.pubsub.deleted(code), () =>
    client.close(
      GroupSessionS2C.CloseEventCodes.GroupSessionWasDeleted,
      "The group session was deleted",
    ),
  );

  client.on("close", () => {
    sub.unsubscribe();
    sub.quit();
    clearInterval(pingInt);
  });

  client.on("message", async (rawPayload: any) => {
    let serialisedPayload: Record<string, any>;
    try {
      serialisedPayload = JSON.parse(rawPayload);
    } catch {
      return client.close(1007, "invalid json payload");
    }

    const parseResult = GroupSessionC2S.payload.safeParse(serialisedPayload);
    if (parseResult.error) return client.close(1008, "malformed payload");

    const { data: payload } = parseResult;
    let responsePayload: GroupSessionS2C.Payloads.GroupUpdateStatus;
    const rep = UserRepresentation.from(session).toCompressedString();

    switch (payload.code) {
      case "JoinGroup": {
        const result = await joinGroup(
          code,
          hostId,
          payload.groupName,
          userId,
          rep,
          state.cache.groupSize,
          state.cache.frozen,
        );

        if (!result.error) {
          responsePayload = {
            ok: 1,
            code: GroupSessionS2C.Code.GroupUpdateStatus,
            action: payload.code,
            context: {
              groupName: payload.groupName,
              userId: rep,
            },
            asReply: 1,
          };
        } else {
          responsePayload = {
            ok: 0,
            code: GroupSessionS2C.Code.GroupUpdateStatus,
            action: payload.code,
            context: {
              groupName: payload.groupName,
              userId: rep,
            },
            error: result.error,
          };
        }
        break;
      }

      case "LeaveGroup": {
        const result = await leaveGroup(
          code,
          hostId,
          userId,
          state.cache.frozen,
        );

        if (!result.error) {
          responsePayload = {
            ok: 1,
            code: GroupSessionS2C.Code.GroupUpdateStatus,
            action: payload.code,
            context: {
              groupName: result.groupName!,
              userId: rep,
            },
            asReply: 1,
          };
        } else {
          responsePayload = {
            ok: 0,
            code: GroupSessionS2C.Code.GroupUpdateStatus,
            action: payload.code,
            context: {
              groupName: result.groupName!,
              userId: rep,
            },
            error: result.error,
          };
        }
        break;
      }
    }

    if (!responsePayload.ok) {
      // first send the error payload so the client can inform the user
      send(client, responsePayload);

      const now = Date.now();
      const timeout = now - state.lastSynchroniseDueToGroupUpdateError;
      // it has been long enough since the last synchronisation due to error
      // that we can send another synchronise payload
      if (timeout > GroupSessionS2C.GroupUpdateFailureSynchroniseTimeoutMS) {
        state.lastSynchroniseDueToGroupUpdateError = now;
        if (!(await doSafeSync(state, code, client))) return;
      }
    } else {
      // successful response will be sent, thus increment the counter
      // and become closer to sending a new payload for synchronisation
      state.synchroniseCounter++;

      const replyPayload = JSON.stringify(responsePayload);
      // all clients other than this one will have asReply set to 0, informing them
      // that no optimistic update was performed (and thus a proper update of the data
      // must occur)
      responsePayload.asReply = 0;
      const broadcastPayload = JSON.stringify(responsePayload);
      for (const c of server.clients) {
        if (c === client) sendStringified(c, replyPayload);
        else sendStringified(c, broadcastPayload);
      }

      if (
        state.synchroniseCounter ===
        GroupSessionS2C.SuccessfulResponsesBeforeResynchronise
      ) {
        // the client has received enough group update responses that
        // a full re-synchronisation should occur to ensure the client's data
        // is up to date
        state.synchroniseCounter = 0;
        if (!(await doSafeSync(state, code, client))) return;
      }
    }
  });
}
