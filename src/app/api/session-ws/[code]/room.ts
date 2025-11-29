import type WebSocket from "ws";
import type { createSubClient } from "@/db";
import type { GroupSessionData } from "@/db/group-session";

export interface GroupSessionRoom {
  ready: boolean;
  stale: boolean;
  hostId: string | null;
  subClient: Awaited<ReturnType<typeof createSubClient>> | null;
  clients: Set<WebSocket>;
  cache: Pick<GroupSessionData, "groupSize" | "frozen">;
}

export const groupSessionRooms: Map<string, GroupSessionRoom> = new Map();
