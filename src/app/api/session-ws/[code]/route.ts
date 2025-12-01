import type { NextRequest } from "next/server";
import type { RouteContext } from "next-ws/server";
import type { WebSocket, WebSocketServer } from "ws";
import { auth } from "@/auth";
import { joinGroup, leaveGroup } from "@/db/group-session";
import { UserRepresentation } from "@/lib/group-session";
import { GSClient, GSServer } from "@/lib/group-session/proto";
import {
  deleteGroupSessionRoom,
  doSafeSync,
  groupSessionRoomFactory,
  send,
  sendPreStringified,
} from "./utils";

const getHeaders = new Headers();
getHeaders.set("Connection", "Upgrade");
getHeaders.set("Upgrade", "websocket");
const getResponse = new Response("Upgrade Required", {
  status: 426,
  headers: getHeaders,
});

export function GET() {
  return getResponse;
}

interface ClientState {
  lastSynchroniseDueToGroupUpdateError: number;
  synchroniseCounter: number;
  isAlive: boolean;
}

export async function UPGRADE(
  client: WebSocket,
  _server: WebSocketServer,
  _request: NextRequest,
  ctx: RouteContext<"/api/session-ws/[code]">,
) {
  const { code } = ctx.params;

  //console.log("client connected");
  const session = (await auth())!;
  const userId = session.user.id;

  const gs = await groupSessionRoomFactory(code, client);
  if (!gs) return;
  const { hostId, clients, cache } = gs;

  clients.add(client);

  /*
  const { res } = await rateLimit({
    id: userId,
    categories: ["sessions-ws/[code]", "UPGRADE"],
    requestsPerMinute: 12,
    burst: 5,
  });
  if (res)
    client.close(
      GSServer.CloseEventCodes.RateLimited,
      "rate limit exceeded",
    );
  */

  const state: ClientState = {
    lastSynchroniseDueToGroupUpdateError: 0,
    synchroniseCounter: 0,
    isAlive: true,
  };

  const pingInt = setInterval(() => {
    //console.log("ping");
    if (client.readyState !== client.OPEN) return;

    if (!state.isAlive) {
      client.terminate();
      return;
    }

    state.isAlive = false;
    client.ping();
  }, GSServer.PING_INTERVAL_MS);

  if (!(await doSafeSync(cache, code, client))) return;

  client.on("pong", () => {
    //console.log("pong");
    state.isAlive = true;
  });

  client.on("close", () => {
    //console.log("onclose");
    clients.delete(client);
    clearInterval(pingInt);
    //console.log(`client amount: ${clients.size.toString()}`);
    if (clients.size === 0) {
      deleteGroupSessionRoom(code);
      //console.log(
      //  `deleting room, total rooms are now: ${groupSessionRooms.size}`,
      //);
    }
  });

  client.on("message", async (rawData) => {
    /*
    const { res } = await rateLimit({
      id: userId,
      categories: ["sessions-ws/[code]", "MESSAGE"],
      requestsPerMinute: 12,
      burst: 5,
    });
    if (res) {
      const rateLimitPayload: GSServer.Payloads.MessageRateLimit = {
        code: GSServer.Code.MessageRateLimit,
      };
      return send(client, rateLimitPayload);
    }
    */

    //@ts-expect-error intended usage according to https://websocket.org/guides/security/
    if (rawData.length > GSServer.MSG_SIZE_LIMIT)
      return client.close(1009, "message too large");

    let serialisedData: Record<string, any>;
    try {
      serialisedData = JSON.parse(rawData.toString());
    } catch {
      return client.close(1007, "unparsable json payload");
    }

    const parseResult = GSClient.payload.safeParse(serialisedData);
    if (parseResult.error) return client.close(1008, "malformed json payload");

    const { data: payload } = parseResult;

    let userRepresentation: UserRepresentation;
    try {
      userRepresentation = UserRepresentation.fromCompressedString(
        payload.compressedUser,
      );
    } catch {
      return client.close(1007, "invalid json field value");
    }

    // ensure that non-hosts can only perform join/leave actions for themselves
    if (userRepresentation.userId !== userId && userId !== hostId)
      return client.close(GSServer.CloseEventCodes.Forbidden, "forbidden");
    let responsePayload: GSServer.Payloads.GroupUpdateStatus;

    switch (payload.code) {
      case "Join": {
        const result = await joinGroup({
          code,
          hostId: hostId!,
          groupName: payload.groupName,
          userId: userRepresentation.userId,
          compressedUser: payload.compressedUser,
          groupSize: cache.groupSize,
          frozen: cache.frozen,
        });

        const g0 = payload.groupName;
        const { originalGroupName: g1, newGroupName: g2 } = result;

        if (result.status === "success") {
          responsePayload = {
            isReply: 0,
            ok: 1,
            code: GSServer.Code.GroupUpdateStatus,
            action: payload.code,
            context: {
              g0,
              g1,
              g2,
              compressedUser: payload.compressedUser,
            },
          };
        } else {
          responsePayload = {
            ok: 0,
            code: GSServer.Code.GroupUpdateStatus,
            action: payload.code,
            context: {
              g0,
              g1,
              g2,
              compressedUser: payload.compressedUser,
            },
            willSync: false,
            error: result.message,
          };
        }
        break;
      }

      case "Leave": {
        const result = await leaveGroup({
          code,
          hostId: hostId!,
          userId: userRepresentation.userId,
          frozen: cache.frozen,
        });

        const { originalGroupName: g1, newGroupName: g2 } = result;

        if (result.status === "success") {
          responsePayload = {
            isReply: 0,
            ok: 1,
            code: GSServer.Code.GroupUpdateStatus,
            action: payload.code,
            context: {
              g1,
              g2,
              compressedUser: payload.compressedUser,
            },
          };
        } else {
          responsePayload = {
            ok: 0,
            code: GSServer.Code.GroupUpdateStatus,
            action: payload.code,
            context: {
              g1,
              g2,
              compressedUser: payload.compressedUser,
            },
            willSync: false,
            error: result.message,
          };
        }
        break;
      }
    }

    if (!responsePayload.ok) {
      // first send the error payload so the client can inform the user

      const now = Date.now();
      const timeout = now - state.lastSynchroniseDueToGroupUpdateError;
      const shouldSync = timeout > GSServer.GUPDATE_FAILURE_SYNC_TIMEOUT;

      if (shouldSync) responsePayload.willSync = true;
      send(client, responsePayload);
      // it has been long enough since the last synchronisation due to error
      // that we can send another synchronise payload
      if (shouldSync) {
        state.lastSynchroniseDueToGroupUpdateError = now;
        if (!(await doSafeSync(cache, code, client))) return;
      }
    } else {
      // successful response will be sent, thus increment the counter
      // and become closer to sending a new payload for synchronisation
      state.synchroniseCounter++;

      const broadcastPayload = JSON.stringify(responsePayload);
      // perfectly safe since isReply is the first property in the payload
      const replyPayload = broadcastPayload.replace(
        '"isReply":0',
        '"isReply":1',
      );
      for (const c of clients) {
        if (c === client) sendPreStringified(c, replyPayload);
        else sendPreStringified(c, broadcastPayload);
      }

      if (
        state.synchroniseCounter === GSServer.SUCCESSFUL_RESPONSES_BEFORE_RESYNC
      ) {
        // the client has received enough group update responses that
        // a full re-synchronisation should occur to ensure the client's data
        // is up to date
        state.synchroniseCounter = 0;
        if (!(await doSafeSync(cache, code, client))) return;
      }
    }
  });
}
