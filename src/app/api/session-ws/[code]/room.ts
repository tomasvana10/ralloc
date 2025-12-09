import type WebSocket from "ws";
import redis, { createSubClient } from "@/db";
import { type GroupSessionData, getHostId, paths } from "@/db/group-session";
import type { GSServer } from "@/lib/group-session/proto";
import { closeDeleted, sendPreStringified, updateCache } from "./utils";

export type Client = WebSocket;

export interface Room {
  ready: boolean;
  stale: boolean;
  hostId: string | null;
  subClient: Awaited<ReturnType<typeof createSubClient>> | null;
  clients: Set<Client>;
  cache: Pick<GroupSessionData, "groupSize" | "frozen">;
}

export class RoomManager {
  private static rooms = new Map<string, Room>();
  private static locks = new Map<string, Promise<Room | null>>();

  private static WAIT_TIMEOUT = 1000;
  private static WAIT_POLLING_INTERVAL = 2;

  public code: string;
  private client: Client | null = null;
  private room: Room | null = null;

  private constructor(code: string) {
    this.code = code;
  }

  get data() {
    return this.room;
  }

  static async get(code: string) {
    const manager = new RoomManager(code);

    const existingRoom = RoomManager.rooms.get(code);
    if (existingRoom?.ready && !existingRoom.stale) {
      manager.room = existingRoom;
      return manager;
    }
    if (existingRoom?.stale) return null;

    // a different client has begun creating this room, so wait for them
    const lock = RoomManager.locks.get(code);
    if (lock) {
      console.log(`[room:${code}] client waiting for existing lock`);
      await lock;
      return manager.acquire();
    }

    // room exists but lock isn't created
    if (existingRoom) {
      console.log(`[room:${code}] room exists but no lock - waiting for ready`);
      return manager.acquire();
    }

    // room doesn't exist yet, so create it
    console.log(`[room:${code}] creating new room`);
    const creation = manager.create();
    RoomManager.locks.set(code, creation);

    try {
      const room = await creation;
      if (!room) return null;
      manager.room = room;
      console.log(`[room:${code}] room created successfully`);
      return manager;
    } finally {
      RoomManager.locks.delete(code);
    }
  }

  static markAsStale(code: string) {
    const room = RoomManager.rooms.get(code);
    if (room) room.stale = true;
  }

  setClient(client: Client) {
    this.client = client;
  }

  registerClient() {
    if (!this.client || !this.room) return;
    this.room.clients.add(this.client);
    console.log(
      `[room:${this.code}] client registered (total: ${this.room.clients.size})`,
    );
  }

  unregisterClient() {
    if (!this.client || !this.room) return;
    this.room.clients.delete(this.client);
    console.log(
      `[room:${this.code}] client unregistered (total: ${this.room.clients.size})`,
    );
  }

  async deleteIfEmpty() {
    const room = RoomManager.rooms.get(this.code);
    if (!room || room.clients.size !== 0) return;

    console.log(`[room:${this.code}] deleting empty room`);

    room.stale = true;
    RoomManager.rooms.delete(this.code);

    try {
      await room.subClient?.unsubscribe();
      await room.subClient?.quit();
    } catch {}
  }

  private async acquire() {
    try {
      await this.waitForRoom();
    } catch {
      if (this.client) closeDeleted(this.client);
      return null;
    }

    const current = RoomManager.rooms.get(this.code);
    if (!current || current.stale) {
      if (this.client) closeDeleted(this.client);
      return null;
    }

    this.room = current;
    return this;
  }

  private waitForRoom() {
    return new Promise<void>((resolve, reject) => {
      const startTime = Date.now();

      const check = () => {
        const current = RoomManager.rooms.get(this.code);

        if (!current || current.stale) return reject();
        if (current.ready) return resolve();
        if (Date.now() - startTime > RoomManager.WAIT_TIMEOUT) return reject();

        setTimeout(check, RoomManager.WAIT_POLLING_INTERVAL);
      };

      check();
    });
  }

  private async create() {
    const room: Room = {
      ready: false,
      stale: false,
      hostId: null,
      subClient: null,
      clients: new Set<Client>(),
      cache: {
        frozen: false,
        groupSize: 0,
      },
    };
    RoomManager.rooms.set(this.code, room);

    const initialised = await this.prepareAsyncComponents(room);
    if (initialised) return room;

    await this.deleteIfEmpty();
    if (this.client) closeDeleted(this.client);
    return null;
  }

  private async prepareAsyncComponents(room: Room) {
    const hostId = await getHostId(this.code);
    if (!hostId || room.stale) return false;
    room.hostId = hostId;

    room.subClient = await createSubClient(redis);
    if (room.stale) return false;

    await this.registerSubscriptions(room);
    if (room.stale) return false;

    room.ready = true;
    return true;
  }

  private async registerSubscriptions(room: Room) {
    await room.subClient?.subscribe(
      paths.pubsub.partialData(this.code),
      (msg: string) => {
        if (!RoomManager.rooms.has(this.code) || room.stale) return;

        const payload: GSServer.Payloads.PartialSynchronise = JSON.parse(msg);
        updateCache(room.cache, {
          frozen: payload.data?.frozen,
          groupSize: payload.data?.groupSize,
        });

        for (const client of room.clients) {
          sendPreStringified(client, msg);
        }
      },
    );

    await room.subClient?.subscribe(paths.pubsub.deleted(this.code), () => {
      if (!RoomManager.rooms.has(this.code) || room.stale) return;

      for (const client of room.clients) {
        closeDeleted(client);
      }
    });
  }
}
