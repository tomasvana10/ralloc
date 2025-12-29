import type { SessionCreateSchema } from "@core/schema/group-session/create";
import { redisKey } from "..";

/**
 * Metadata of the group session stored as a redis
 * hash at {@link paths.metadata}.
 */
export type GroupSessionMetadata = {
  createdOn: number;
  compressedHost: string;
  groupCount: number;
} & Omit<SessionCreateSchema, "groupSeed">;

/**
 * The complete data of a group session, compiled from
 * {@link paths.metadata}, {@link paths.groupMetadata}
 * and a `hostId` and `code`.
 */
export type GroupSessionData = {
  code: string;
  hostId: string;
  groups: GroupSessionGroupData[];
} & GroupSessionMetadata;

/* 
biome-ignore lint/complexity/noBannedTypes: intended as a placeholder
since Record<string, never> messes up GroupSessionGroupData

Metadata of a group session's group.
*/
export type GroupSessionGroupMetadata = {};

/**
 * The complete data of a group session's group.
 */
export type GroupSessionGroupData = {
  name: string;
  members: string[];
} & GroupSessionGroupMetadata;

export const paths = {
  sessionHost: (code: string) => redisKey("session", code, "host"),
  metadata: (hostId: string, code: string) =>
    redisKey("host", hostId, "session", code, "metadata"),
  groupMetadata: (hostId: string, code: string, groupName: string) =>
    redisKey("host", hostId, "session", code, "group", groupName, "gmetadata"),
  groupMembers: (hostId: string, code: string, groupName: string) =>
    redisKey("host", hostId, "session", code, "group", groupName, "members"),
  userGroup: (hostId: string, code: string, userId: string) =>
    redisKey("host", hostId, "session", code, "userGroup", userId),
  userGroupTemplate: (hostId: string, code: string) =>
    redisKey("host", hostId, "session", code, "userGroup"),
  patterns: {
    allHostMetadataKeys: (hostId: string) =>
      redisKey("host", hostId, "session", "*", "metadata"),
    allHostSessionKeys: (hostId: string, code: string) =>
      redisKey("host", hostId, "session", code, "*"),
    allGroupNames: (hostId: string, code: string) =>
      redisKey("host", hostId, "session", code, "group", "*", "gmetadata"),
    allGroupMembers: (hostId: string, code: string) =>
      redisKey("host", hostId, "session", code, "group", "*", "members"),
    allUserGroups: (hostId: string, code: string) =>
      redisKey("host", hostId, "session", code, "userGroup", "*"),
  },
  pubsub: {
    partialData: (code: string) => redisKey("gpartialdata", code),
    deleted: (code: string) => redisKey("gdeleted", code),
  },
};

export * from "./crud";
export * from "./helpers";
