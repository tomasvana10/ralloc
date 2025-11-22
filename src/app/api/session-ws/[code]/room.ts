import type WebSocket from "ws";
import type { GroupSessionData } from "@/db/group-session";
import type { createSubClient } from "@/db/redis";

export const groupSessionRooms: Map<string, GroupSessionRoom> = new Map();

export interface GroupSessionRoom {
  ready: boolean;
  stale: boolean;
  hostId: string | null;
  subClient: Awaited<ReturnType<typeof createSubClient>> | null;
  clients: Set<WebSocket>;
  cache: Pick<GroupSessionData, "groupSize" | "frozen">;
}
