import { getGroupSessionByCode } from "@core/db/group-session";
import * as GSServer from "@core/lib/group-session/proto/server";
import type { Client, Room } from "./room";

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

  const payload: GSServer.Payload.Synchronise = {
    code: GSServer.Code.Synchronise,
    data,
  };
  return payload;
}

export async function doSafeSync(
  cache: Room["cache"],
  code: string,
  ws: Client,
) {
  const payload = await prepareSyncPayload(cache, code);
  if (payload) {
    send(ws, payload);
    return true;
  }
  closeDeleted(ws);
  return false;
}

export function closeDeleted(ws: Client) {
  ws.end(
    GSServer.CloseEventCodes.GroupSessionWasDeleted,
    "The group session was deleted",
  );
}

export function closeForbidden(ws: Client) {
  ws.end(
    GSServer.CloseEventCodes.Forbidden,
    "You are not allowed to perform this action",
  );
}

export function send(ws: Client, payload: GSServer.Payload.PayloadType) {
  try {
    ws.send(JSON.stringify(payload));
  } catch {}
}

export function sendPreStringified(ws: Client, payload: string) {
  try {
    ws.send(payload);
  } catch {}
}
