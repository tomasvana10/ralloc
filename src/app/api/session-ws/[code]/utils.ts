// warning: this module is horrible

import type WebSocket from "ws";
import redis, { createSubClient } from "@/db";
import { getGroupSessionByCode, getHostId, paths } from "@/db/group-session";
import { GSServer } from "@/lib/group-session/proto";
import { type GroupSessionRoom, groupSessionRooms } from "./room";

function updateCache(
  cache: GroupSessionRoom["cache"],
  args: Partial<GroupSessionRoom["cache"]>,
) {
  for (const [key, value] of Object.entries(args)) {
    if (value !== undefined) {
      (cache as any)[key] = value;
    }
  }
}

function deleteGroupSessionRoom(code: string) {
  //console.log("deleting via func");
  const gs = groupSessionRooms.get(code);
  if (!gs) return;

  gs.subClient?.unsubscribe();
  gs.subClient?.quit();
  groupSessionRooms.delete(code);
  //console.log(
  //  `deleting via func - room total is now ${groupSessionRooms.size}`,
  //);
}

async function doSafeSync(
  cache: GroupSessionRoom["cache"],
  code: string,
  ws: WebSocket,
) {
  const payload = await prepareSyncPayload(cache, code);
  if (payload) {
    send(ws, payload);
    return true;
  } else {
    closeDeleted(ws);
    return false;
  }
}

function closeDeleted(ws: WebSocket) {
  ws.close(
    GSServer.CloseEventCodes.GroupSessionWasDeleted,
    "The group session was deleted",
  );
}

function closeForbidden(ws: WebSocket) {
  ws.close(
    GSServer.CloseEventCodes.Forbidden,
    "You are not allowed to perform this action",
  );
}

async function prepareSyncPayload(
  cache: GroupSessionRoom["cache"],
  code: string,
) {
  const data = await getGroupSessionByCode(code);
  if (!data) return null;
  updateCache(cache, { groupSize: data.groupSize, frozen: data.frozen });

  const payload: GSServer.Payloads.Synchronise = {
    code: GSServer.Code.Synchronise,
    data,
  };

  return payload;
}

function send(ws: WebSocket, payload: GSServer.Payload) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(payload));
}

function sendPreStringified(ws: WebSocket, payload: string) {
  if (ws.readyState === ws.OPEN) ws.send(payload);
}

async function createSubscriptions(gs: GroupSessionRoom, code: string) {
  await gs.subClient?.subscribe(paths.pubsub.partialData(code), async (msg) => {
    if (!groupSessionRooms.has(code)) return;

    const payload: GSServer.Payloads.PartialSynchronise = JSON.parse(msg);
    updateCache(gs.cache, {
      frozen: payload.data?.frozen,
      groupSize: payload.data?.groupSize,
    });

    for (const c of gs.clients) sendPreStringified(c, msg);
  });

  await gs.subClient?.subscribe(paths.pubsub.deleted(code), () => {
    if (!groupSessionRooms.has(code)) return;

    for (const c of gs.clients) closeDeleted(c);
  });
}

async function waitForGroupSessionRoom(code: string) {
  //console.log("client waiting for room");
  await new Promise<void>((resolve, reject) => {
    const start = Date.now();

    function check() {
      const current = groupSessionRooms.get(code);

      if (!current || current.stale) return reject();
      if (current.ready) return resolve();

      if (Date.now() - start > 1000) {
        return reject();
      }

      setTimeout(check, 2);
    }

    check();
  });
}

async function groupSessionRoomFactory(code: string, ws: WebSocket) {
  let gs = groupSessionRooms.get(code);
  if (gs?.ready && !gs.stale) return gs;
  if (gs?.stale) return null;

  if (!gs) {
    gs = {
      ready: false,
      clients: new Set<WebSocket>(),
      subClient: null,
      hostId: null,
      cache: {
        frozen: false,
        groupSize: 0,
      },
      stale: false,
    };
    groupSessionRooms.set(code, gs);
    //console.log("creating room");
    //console.log(`total rooms: ${groupSessionRooms.size}`);

    try {
      const hostId = await getHostId(code);
      if (!hostId || gs.stale) throw new Error();
      gs.hostId = hostId;

      gs.subClient = await createSubClient(redis);
      if (gs.stale) throw new Error();

      await createSubscriptions(gs, code);
      if (gs.stale) throw new Error();

      gs.ready = true;
    } catch {
      deleteGroupSessionRoom(code);
      closeDeleted(ws);
      return null;
    }
    return gs;
  }

  try {
    //console.log("waiting for room");
    await waitForGroupSessionRoom(code);
  } catch {
    closeDeleted(ws);
    return null;
  }

  const current = groupSessionRooms.get(code);
  if (!current || current.stale) {
    closeDeleted(ws);
    return null;
  }

  return current;
}

export {
  groupSessionRoomFactory,
  deleteGroupSessionRoom,
  waitForGroupSessionRoom,
  doSafeSync,
  send,
  sendPreStringified,
  closeForbidden,
};
