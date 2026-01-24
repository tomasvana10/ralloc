import type { WebSocket } from "uWebSockets.js";
import { redisPub, redisSub } from "@core/db";
import {
  doesGroupSessionExist,
  type GroupSessionData,
  getHostId,
  pubsub as groupSessionPubsub,
} from "@core/db/group-session";
import { pubsub as roomPubsub } from "@core/db/group-session-room";
import {
  addTenant,
  getTenantCount,
  removeTenant,
} from "@core/db/group-session-room/helpers";
import type * as GSServer from "@core/lib/group-session/proto/server";
import type { UserData } from ".";
import { closeDeleted, sendPreStringified } from "./utils";

const rooms = new Map<string, Promise<Room | null> | Room | null>();
const killers = new Map<string, Promise<any>>();

export type Cache = Pick<GroupSessionData, "frozen" | "groupSize">;
export type Client = WebSocket<UserData>;

export class Room {
  public hostId: string;
  public code: string;
  public tenants: number;
  public cache: Cache;
  public clients: Set<Client>;

  private constructor(
    hostId: string,
    code: string,
    tenants: number,
    cache: Cache,
  ) {
    this.hostId = hostId;
    this.code = code;
    this.tenants = tenants;
    this.cache = cache;
    this.clients = new Set<Client>();
  }

  public static async get(code: string) {
    const resolving = rooms.get(code);
    if (resolving) return resolving;

    const toResolve = Room.resolve(code);
    toResolve.catch(() => rooms.delete(code));
    rooms.set(code, toResolve);

    const room = await toResolve;
    if (room) rooms.set(code, room);

    return room;
  }

  public updateCache(delta: Partial<Cache>) {
    if (delta.frozen !== undefined) this.cache.frozen = delta.frozen;
    if (delta.groupSize !== undefined) this.cache.groupSize = delta.groupSize;
  }

  public broadcastToAllClients(data: string | GSServer.Payload.PayloadType) {
    const message = typeof data === "string" ? data : JSON.stringify(data);

    redisPub.publish(roomPubsub.message(this.code), message);
  }

  public kill() {
    rooms.delete(this.code);

    const toKill = Promise.all([
      redisSub.unsubscribe(groupSessionPubsub.partialData(this.code)),
      redisSub.unsubscribe(groupSessionPubsub.deleted(this.code)),
      redisSub.unsubscribe(roomPubsub.message(this.code)),
      redisSub.unsubscribe(roomPubsub.tenantCount(this.code)),
    ]).finally(() => killers.delete(this.code));
    killers.set(this.code, toKill);
  }

  public async onClientClose(client: Client) {
    this.clients.delete(client);
    const tenants = await removeTenant(this.code);
    redisPub.publish(roomPubsub.tenantCount(this.code), tenants.toString());
  }

  public async onClientOpen(client: Client) {
    this.clients.add(client);
    const tenants = await addTenant(this.code);
    redisPub.publish(roomPubsub.tenantCount(this.code), tenants.toString());
  }

  public isEmpty() {
    return this.tenants === 0;
  }

  // idk
  private static async resolve(code: string) {
    const killing = killers.get(code);
    if (killing) await killing;

    const hostId = await getHostId(code);
    if (!hostId) return null;

    const tenants = await getTenantCount(code);

    const room = new Room(hostId, code, tenants ?? 0, {
      frozen: true,
      groupSize: 1,
    });
    await Room.registerSubscriptions(room);

    if (!(await doesGroupSessionExist(code))) {
      room.kill();
      return null;
    }

    return room;
  }

  private static async registerSubscriptions(room: Room) {
    await redisSub.subscribe(
      groupSessionPubsub.partialData(room.code),
      (message: string) => {
        const payload: GSServer.Payload.PartialSynchronise =
          JSON.parse(message);
        room.updateCache({
          frozen: payload.data?.frozen,
          groupSize: payload.data?.groupSize,
        });

        for (const client of room.clients) {
          sendPreStringified(client, message);
        }
      },
    );

    await redisSub.subscribe(groupSessionPubsub.deleted(room.code), () => {
      for (const client of room.clients) {
        closeDeleted(client);
      }
    });

    await redisSub.subscribe(
      roomPubsub.message(room.code),
      (message: string) => {
        for (const client of room.clients) {
          sendPreStringified(client, message);
        }
      },
    );

    await redisSub.subscribe(
      roomPubsub.tenantCount(room.code),
      (message: string) => {
        room.tenants = parseInt(message, 10);

        if (room.isEmpty()) {
          room.kill();
        }
      },
    );
  }
}
