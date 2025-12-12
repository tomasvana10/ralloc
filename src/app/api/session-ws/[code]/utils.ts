import type WebSocket from "ws";
import { getGroupSessionByCode } from "@/db/group-session";
import { GSServer } from "@/lib/group-session/proto";
import type { Room } from "./room";

export function updateCache(
  cache: Room["cache"],
  args: Partial<Room["cache"]>,
) {
  for (const [key, value] of Object.entries(args)) {
    if (value !== undefined) {
      (cache as Record<string, unknown>)[key] = value;
    }
  }
}

export async function prepareSyncPayload(cache: Room["cache"], code: string) {
  const data = await getGroupSessionByCode(code);
  if (!data) return null;

  updateCache(cache, { groupSize: data.groupSize, frozen: data.frozen });

  const payload: GSServer.Payloads.Synchronise = {
    code: GSServer.Code.Synchronise,
    data,
  };
  return payload;
}

export async function doSafeSync(
  cache: Room["cache"],
  code: string,
  ws: WebSocket,
) {
  const payload = await prepareSyncPayload(cache, code);
  if (payload) {
    send(ws, payload);
    return true;
  }
  closeDeleted(ws);
  return false;
}

export function closeDeleted(ws: WebSocket) {
  ws.close(
    GSServer.CloseEventCodes.GroupSessionWasDeleted,
    "The group session was deleted",
  );
}

export function closeForbidden(ws: WebSocket) {
  ws.close(
    GSServer.CloseEventCodes.Forbidden,
    "You are not allowed to perform this action",
  );
}

export function send(ws: WebSocket, payload: GSServer.Payload) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

export function sendPreStringified(ws: WebSocket, payload: string) {
  if (ws.readyState === ws.OPEN) {
    ws.send(payload);
  }
}
