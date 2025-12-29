import {
  addGroup,
  clearAllGroupMembers,
  clearGroupMembers,
  removeGroup,
} from "@core/db/group-session/actions/admin";
import {
  joinGroup,
  leaveGroup,
} from "@core/db/group-session/actions/membership";
import { ActionStatus } from "@core/db/group-session/actions/types";
import { rateLimit } from "@core/db/rate-limit";
import { UserRepresentation } from "@core/lib/group-session";
import { GSClient, GSServer } from "@core/lib/group-session/proto";
import { auth } from "@web/auth";
import type { NextRequest } from "next/server";
import type { RouteContext } from "next-ws/server";
import type { WebSocket, WebSocketServer } from "ws";
import { RoomManager } from "./room";
import { closeForbidden, doSafeSync, send, sendPreStringified } from "./utils";

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
  lastSync: number;
  successfulResponses: number;
  isPonging: boolean;
  rateLimits: number;
}

function createClientState(): ClientState {
  return {
    lastSync: 0,
    successfulResponses: 0,
    isPonging: true,
    rateLimits: 0,
  };
}

function setupHeartbeat(client: WebSocket, state: ClientState) {
  return setInterval(() => {
    if (client.readyState !== client.OPEN) return;

    if (!state.isPonging) {
      client.terminate();
      return;
    }

    state.isPonging = false;
    client.ping();
  }, GSServer.PING_INTERVAL_MS);
}

export async function UPGRADE(
  client: WebSocket,
  _server: WebSocketServer,
  _request: NextRequest,
  ctx: RouteContext<"/api/session-ws/[code]">,
) {
  const { code } = ctx.params;

  const session = (await auth())!;
  const userId = session.user.id;

  const room = await RoomManager.get(code);
  if (!room || !room.data) {
    console.log(`[ws:${code}] client rejected - no room`);
    return;
  }

  console.log(
    `[ws:${code}] client connected (host: ${room.data.hostId === userId})`,
  );

  const { hostId, clients, cache } = room.data;
  if (!hostId) return;

  const rl = await rateLimit({
    id: userId,
    categories: ["sessions-ws/[code]", "UPGRADE"],
    requestsPerMinute: 12,
    burst: 5,
  });
  if (rl.res)
    return client.close(
      GSServer.CloseEventCodes.RateLimited,
      rl.retryAfter.toString(),
    );

  if (!(await doSafeSync(cache, code, client))) return;
  room.setClient(client);
  room.registerClient();

  const state = createClientState();
  const pingInt = setupHeartbeat(client, state);
  const isHost = userId === hostId;

  client.on("pong", () => {
    state.isPonging = true;
  });

  client.on("close", () => {
    console.log(`[ws:${code}] client disconnected`);
    room.unregisterClient();
    clearInterval(pingInt);
    void room.deleteIfEmpty();
  });

  client.on("message", async (rawData) => {
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

    const rl = await rateLimit({
      id: userId,
      categories: ["sessions-ws/[code]", "MESSAGE"],
      requestsPerMinute: 35,
      burst: 15,
    });
    if (rl.res) {
      const rateLimitPayload: GSServer.Payloads.MessageRateLimit = {
        code: GSServer.Code.MessageRateLimit,
        id: parseResult.data.id,
        retryAfter: rl.retryAfter,
      };
      state.rateLimits++;
      if (state.rateLimits >= GSServer.MIN_RATELIMITS_CONSIDERED_SUSPICIOUS)
        return client.close(
          GSServer.CloseEventCodes.PotentialAbuse,
          "potential abuse detected",
        );
      return send(client, rateLimitPayload);
    }

    const { data: received } = parseResult;
    if (!GSServer.isAuthorisedToUsePayload(isHost, received.code))
      return closeForbidden(client);
    let reply: GSServer.Payload;

    switch (received.code) {
      //#region join/leave
      case GSClient.Code.JoinGroup:
      case GSClient.Code.LeaveGroup: {
        let userRepresentation: UserRepresentation;
        try {
          userRepresentation = UserRepresentation.fromCompressedString(
            received.compressedUser,
          );
        } catch {
          return client.close(1007, "invalid json field value");
        }

        if (userRepresentation.userId !== userId && !isHost)
          return closeForbidden(client);

        // join group
        if (received.code === GSClient.Code.JoinGroup) {
          const result = await joinGroup({
            code,
            hostId,
            groupName: received.groupName,
            userId: userRepresentation.userId,
            compressedUser: received.compressedUser,
            groupSize: cache.groupSize,
            frozen: isHost ? false : cache.frozen,
          });

          if (result.status === ActionStatus.Success) {
            reply = {
              code: GSServer.Code.GroupMembership,
              ok: 1,
              id: received.id,
              context: {
                action: received.code,
                compressedUser: received.compressedUser,
                groupName: result.newGroupName,
              },
            };
          } else {
            reply = {
              code: GSServer.Code.GroupMembership,
              ok: 0,
              id: received.id,
              error: result.message,
              willSync: false,
            };
          }
          // leave group
        } else {
          const result = await leaveGroup({
            code,
            hostId,
            userId: userRepresentation.userId,
            frozen: isHost ? false : cache.frozen,
          });

          if (result.status === ActionStatus.Success) {
            reply = {
              code: GSServer.Code.GroupMembership,
              ok: 1,
              id: received.id,
              context: {
                action: received.code,
                compressedUser: received.compressedUser,
                groupName: result.originalGroupName,
              },
            };
          } else {
            reply = {
              code: GSServer.Code.GroupMembership,
              ok: 0,
              id: received.id,
              error: result.message,
              willSync: false,
            };
          }
        }
        break;
      }
      //#region add group
      case GSClient.Code.AddGroup: {
        const result = await addGroup({
          code,
          hostId,
          groupName: received.groupName,
        });

        if (result.status === ActionStatus.Success) {
          reply = {
            code: GSServer.Code.GroupMutation,
            ok: 1,
            id: received.id,
            context: {
              action: received.code,
              group: { name: received.groupName },
            },
          };
        } else {
          reply = {
            code: GSServer.Code.GroupMutation,
            ok: 0,
            id: received.id,
            error: result.message,
            willSync: false,
          };
        }
        break;
      }
      //#region remove group
      case GSClient.Code.RemoveGroup: {
        const result = await removeGroup({
          code,
          hostId,
          groupName: received.groupName,
        });

        if (result.status === ActionStatus.Success) {
          reply = {
            code: GSServer.Code.GroupMutation,
            ok: 1,
            id: received.id,
            context: {
              action: received.code,
              groupName: received.groupName,
            },
          };
        } else {
          reply = {
            code: GSServer.Code.GroupMutation,
            ok: 0,
            id: received.id,
            error: result.message,
            willSync: false,
          };
        }
        break;
      }
      //#region clear mem
      case GSClient.Code.ClearGroupMembers: {
        const result = await clearGroupMembers({
          code,
          hostId,
          groupName: received.groupName,
        });

        if (result.status === ActionStatus.Success) {
          reply = {
            code: GSServer.Code.GroupMembersClear,
            ok: 1,
            id: received.id,
            context: {
              action: received.code,
              groupName: received.groupName,
            },
          };
        } else {
          reply = {
            code: GSServer.Code.GroupMembersClear,
            ok: 0,
            id: received.id,
            error: result.message,
            willSync: false,
          };
        }

        break;
      }
      //#region clear all mem
      case GSClient.Code.ClearAllGroupMembers: {
        await clearAllGroupMembers({
          code,
          hostId,
        });

        reply = {
          code: GSServer.Code.GroupMembersClear,
          ok: 1,
          id: received.id,
          context: {
            action: received.code,
          },
        };
        break;
      }
    }

    if (!reply.ok) {
      const now = Date.now();
      const timeout = now - state.lastSync;
      const shouldSync = timeout > GSServer.FAILURE_RESYNC_TIMEOUT;
      send(client, reply);

      if (shouldSync) {
        // it has been long enough since the last synchronisation due to error
        // that we can send another synchronise payload
        reply.willSync = true;
        state.lastSync = now;
        if (!(await doSafeSync(cache, code, client))) return;
      }
    } else {
      // successful response will be sent, thus increment the counter
      // and become closer to sending a new payload for synchronisation
      state.successfulResponses++;
      let resynced = false;

      if (
        state.successfulResponses >= GSServer.SUCCESSFUL_RESPONSES_BEFORE_RESYNC
      ) {
        // the client has received enough group update responses that
        // a full re-synchronisation should occur to ensure the client's data
        // is up to date
        if (!(await doSafeSync(cache, code, client))) return;
        state.successfulResponses = 0;
        resynced = true;
      }

      const replyPayload = JSON.stringify(reply);
      for (const c of clients) {
        // the original client already got a sync payload so they don't need the reply payload
        if (c === client && resynced) continue;
        sendPreStringified(c, replyPayload);
      }
    }
  });
}
