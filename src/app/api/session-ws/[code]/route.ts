import type { NextRequest } from "next/server";
import type { RouteContext } from "next-ws/server";
import type { WebSocket, WebSocketServer } from "ws";
import { auth } from "@/auth";
import {
  doesGroupSessionExist,
  getGroupSessionByCode,
  getHostId,
  joinGroup,
  leaveGroup,
} from "@/db/group-session";
import { GroupSessionC2S, GroupSessionS2C } from "@/lib/group-session";
import { UserRepresentation } from "@/lib/group-session/user-representation";

export function GET() {
  const headers = new Headers();
  headers.set("Connection", "Upgrade");
  headers.set("Upgrade", "websocket");
  return new Response("Upgrade Required", { status: 426, headers });
}

interface State {
  cachedGroupSize: number;
  lastSynchroniseDueToGroupUpdateError: number;
  synchroniseCounter: number;
}

async function resynchronise(ws: WebSocket, state: State, code: string) {
  const newData = (await getGroupSessionByCode(code))!;
  state.cachedGroupSize = newData.groupSize;

  const syncPayload: GroupSessionS2C.Payloads.Synchronise = {
    code: GroupSessionS2C.Code.Synchronise,
    data: newData,
  };
  send(ws, syncPayload);
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

  const initialData = (await getGroupSessionByCode(code))!;
  const initialSyncPayload: GroupSessionS2C.Payloads.Synchronise = {
    code: GroupSessionS2C.Code.Synchronise,
    data: initialData,
  };
  send(client, initialSyncPayload);

  const state: State = {
    cachedGroupSize: initialData.groupSize,
    lastSynchroniseDueToGroupUpdateError: 0,
    synchroniseCounter: 0,
  };

  client.on("message", async (rawPayload: any) => {
    console.debug("new message");

    // IMPORTANT! Implement pub/sub to close the websocket as the group session is deleted
    // instead of checking if it exists for every message (also to reflect changes made
    // throught the api)

    if (!(await doesGroupSessionExist(code)))
      return client.close(
        GroupSessionS2C.CloseEventCodes.GroupSessionWasDeleted,
        "The group session was deleted",
      );

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

    switch (payload.code) {
      case "JoinGroup": {
        const result = await joinGroup(
          code,
          hostId,
          payload.groupName,
          session.user.id,
          UserRepresentation.from(session).toCompressedString(),
          state.cachedGroupSize,
        );

        if (!result.error) {
          responsePayload = {
            status: "success",
            code: GroupSessionS2C.Code.GroupUpdateStatus,
            action: payload.code,
            context: {
              groupName: payload.groupName,
              userId: session.user.id,
            },
          };
        } else {
          responsePayload = {
            status: "failure",
            code: GroupSessionS2C.Code.GroupUpdateStatus,
            action: payload.code,
            error: result.error,
          };
        }
        break;
      }

      case "LeaveGroup": {
        const result = await leaveGroup(code, hostId, session.user.id);

        if (!result.error) {
          responsePayload = {
            status: "success",
            code: GroupSessionS2C.Code.GroupUpdateStatus,
            action: payload.code,
            context: {
              groupName: result.groupName!,
              userId: session.user.id,
            },
          };
        } else {
          responsePayload = {
            status: "failure",
            code: GroupSessionS2C.Code.GroupUpdateStatus,
            action: payload.code,
            error: result.error,
          };
        }
        break;
      }
    }

    if (responsePayload.status === "failure") {
      // first send the error payload so the client can inform the user
      send(client, responsePayload);

      const now = Date.now();
      const timeout = now - state.lastSynchroniseDueToGroupUpdateError;
      // it has been long enough since the last synchronisation due to error
      // that we can send another synchronise payload
      if (timeout > GroupSessionS2C.GroupUpdateFailureSynchroniseTimeoutMS) {
        state.lastSynchroniseDueToGroupUpdateError = now;
        await resynchronise(client, state, code);
      }
    } else {
      // successful response will be sent, thus increment the counter
      // and become closer to sending a new payload for synchronisation
      state.synchroniseCounter++;

      // broadcast the successful update to all clients (including this one)
      const stringifiedPayload = JSON.stringify(responsePayload);
      for (const c of server.clients) {
        if (c.readyState === c.OPEN) sendStringified(c, stringifiedPayload);
      }

      if (
        state.synchroniseCounter ===
        GroupSessionS2C.SuccessfulResponsesBeforeResynchronise
      ) {
        // the client has received enough group update responses that
        // a full re-synchronisation should occur to ensure the client's data
        // is up to date
        state.synchroniseCounter = 0;
        await resynchronise(client, state, code);
      }
    }
  });
}
