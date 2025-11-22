// warning: this module is horrible

import type WebSocket from "ws";
import {
  type GroupSessionData,
  getGroupSessionByCode,
  getHostId,
  paths,
} from "@/db/group-session";
import redis, { createSubClient } from "@/db/redis";
import { GroupSessionS2C } from "./messaging";

export const groupSessionRooms: Map<string, GroupSessionRoom> = new Map();

interface ClientState {
  lastSynchroniseDueToGroupUpdateError: number;
  synchroniseCounter: number;
  isAlive: boolean;
}

type GroupSessionRoom = {
  ready: boolean;
  stale: boolean;
  hostId: string | null;
  subClient: Awaited<ReturnType<typeof createSubClient>> | null;
  clients: Set<WebSocket>;
  cache: Pick<GroupSessionData, "groupSize" | "frozen">;
};

function updateCache(
  cache: GroupSessionRoom["cache"],
  args: GroupSessionRoom["cache"],
) {
  Object.assign(cache, args);
}

function deleteGroupSessionRoom(code: string) {
  const gs = groupSessionRooms.get(code);
  if (!gs) return;

  gs.subClient?.unsubscribe();
  gs.subClient?.quit();
  groupSessionRooms.delete(code);
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
    GroupSessionS2C.CloseEventCodes.GroupSessionWasDeleted,
    "The group session was deleted",
  );
}

async function prepareSyncPayload(
  cache: GroupSessionRoom["cache"],
  code: string,
) {
  const data = await getGroupSessionByCode(code);
  if (!data) return null;
  updateCache(cache, { groupSize: data.groupSize, frozen: data.frozen });

  const syncPayload: GroupSessionS2C.Payloads.Synchronise = {
    code: GroupSessionS2C.Code.Synchronise,
    data,
  };

  return syncPayload;
}

function send(ws: WebSocket, payload: GroupSessionS2C.Payload) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(payload));
}

function sendPreStringified(ws: WebSocket, payload: string) {
  if (ws.readyState === ws.OPEN) ws.send(payload);
}

async function createSubscriptions(gs: GroupSessionRoom, code: string) {
  console.log("creating subscriptions");
  await gs.subClient!.subscribe(paths.pubsub.patched(code), async (msg) => {
    if (!groupSessionRooms.has(code)) return;

    const payload: GroupSessionS2C.Payloads.Synchronise = JSON.parse(msg);
    updateCache(gs.cache, {
      groupSize: payload.data.groupSize,
      frozen: payload.data.frozen,
    });

    for (const c of gs.clients) sendPreStringified(c, msg);
  });

  await gs.subClient!.subscribe(paths.pubsub.deleted(code), () => {
    if (!groupSessionRooms.has(code)) return;

    for (const c of gs.clients) closeDeleted(c);
  });
}

async function waitForGroupSessionRoom(code: string) {
  console.log("client waiting for room");
  await new Promise<void>((resolve, reject) => {
    const start = Date.now();

    const check = () => {
      const current = groupSessionRooms.get(code);

      if (!current || current.stale) return reject(new Error());
      if (current.ready) return resolve();

      if (Date.now() - start > 1000) {
        return reject(new Error());
      }

      setTimeout(check, 2);
    };

    check();
  });
}

async function groupSessionRoomFactory(code: string, ws: WebSocket) {
  let gs = groupSessionRooms.get(code);
  if (gs?.ready && !gs.stale) return gs;

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
    console.log("creating room");

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
    console.log("waiting for room");
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
  type ClientState,
  type GroupSessionRoom,
  groupSessionRoomFactory,
  deleteGroupSessionRoom,
  waitForGroupSessionRoom,
  doSafeSync,
  send,
  sendPreStringified,
};
