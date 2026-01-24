import type { WebSocket } from "uWebSockets.js";
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
import * as GSClient from "@core/lib/group-session/proto/client";
import * as GSServer from "@core/lib/group-session/proto/server";
import type { Cache, Client } from "@ws/room";
import type { UserData } from "../index";
import { closeForbidden, doSafeSync, send, sendPreStringified } from "../utils";

export async function handleMessage(
  ws: WebSocket<UserData>,
  message: ArrayBuffer,
) {
  const userData = ws.getUserData();
  const { code, userId, isHost, room, state } = userData;

  if (!room || !room.data) {
    ws.close();
    return;
  }

  const { hostId, clients, cache } = room.data;
  if (!hostId) return;

  let serialisedData: Record<string, any>;
  try {
    serialisedData = JSON.parse(Buffer.from(message).toString());
  } catch {
    ws.end(1007, "unparsable json payload");
    return;
  }

  const parseResult = GSClient.Payload.payload.safeParse(serialisedData);
  if (parseResult.error) {
    ws.end(1008, "malformed json payload");
    return;
  }

  // Rate limiting
  const rl = await rateLimit({
    id: userId,
    categories: ["sessions-ws/[code]", "MESSAGE"],
    requestsPerMinute: 35,
    burst: 15,
  });

  if (rl.res) {
    const rateLimitPayload: GSServer.Payload.MessageRateLimit = {
      code: GSServer.Code.MessageRateLimit,
      id: parseResult.data.id,
      retryAfter: rl.retryAfter,
    };
    state.rateLimits++;
    if (state.rateLimits >= GSServer.MIN_RATELIMITS_CONSIDERED_SUSPICIOUS) {
      ws.end(
        GSServer.CloseEventCodes.PotentialAbuse,
        "potential abuse detected",
      );
      return;
    }
    return send(ws, rateLimitPayload);
  }

  const { data: received } = parseResult;
  if (!GSServer.isAuthorisedToUsePayload(isHost, received.code)) {
    return closeForbidden(ws);
  }

  const reply = await createReplyPayload(
    received,
    ws,
    userId,
    isHost,
    code,
    hostId,
    cache,
  );
  if (!reply) return;

  if (!reply.ok) {
    const now = Date.now();
    const timeout = now - state.lastSync;
    const shouldSync = timeout > GSServer.FAILURE_RESYNC_TIMEOUT;
    send(ws, reply);

    if (shouldSync) {
      // it has been long enough since the last synchronisation due to error
      // that we can send another synchronise payload
      reply.willSync = true;
      state.lastSync = now;
      if (!(await doSafeSync(cache, code, ws))) return;
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
      if (!(await doSafeSync(cache, code, ws))) return;
      state.successfulResponses = 0;
      resynced = true;
    }

    const replyPayload = JSON.stringify(reply);
    for (const c of clients) {
      // the original client already got a sync payload so they don't need the reply payload
      if (c === ws && resynced) continue;
      sendPreStringified(c, replyPayload);
    }
  }
}

async function createReplyPayload(
  received: GSClient.Payload.PayloadType,
  ws: Client,
  userId: string,
  isHost: boolean,
  code: string,
  hostId: string,
  cache: Cache,
) {
  let reply: GSServer.Payload.PayloadType;

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
        ws.end(1007, "invalid json field value");
        return null;
      }

      if (userRepresentation.userId !== userId && !isHost) {
        closeForbidden(ws);
        return null;
      }

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

  return reply;
}
