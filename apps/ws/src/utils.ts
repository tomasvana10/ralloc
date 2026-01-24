import { getGroupSessionByCode } from "@core/db/group-session";
import * as GSServer from "@core/lib/group-session/proto/server";
import type { Client, Room } from "./room";

export async function prepareSyncPayload(room: Room, code: string) {
  const data = await getGroupSessionByCode(code);
  if (!data) return null;

  room.updateCache({ groupSize: data.groupSize, frozen: data.frozen });

  const payload: GSServer.Payload.Synchronise = {
    code: GSServer.Code.Synchronise,
    data,
  };
  return payload;
}

export async function doSafeSync(room: Room, code: string, client: Client) {
  const payload = await prepareSyncPayload(room, code);
  if (payload) {
    send(client, payload);
    return true;
  }
  closeDeleted(client);
  return false;
}

export function closeDeleted(client: Client) {
  client.end(
    GSServer.CloseEventCodes.GroupSessionWasDeleted,
    "The group session was deleted",
  );
}

export function closeForbidden(client: Client) {
  client.end(
    GSServer.CloseEventCodes.Forbidden,
    "You are not allowed to perform this action",
  );
}

export function send(client: Client, payload: GSServer.Payload.PayloadType) {
  try {
    client.send(JSON.stringify(payload));
  } catch {}
}

export function sendPreStringified(client: Client, payload: string) {
  try {
    client.send(payload);
  } catch {}
}
