import type { SessionCreateSchemaType } from "@/features/forms/session-create";
import { redisKey } from "..";

export type GroupSessionMetadata = {
  createdOn: number;
  frozen: boolean;
  compressedHost: string;
} & SessionCreateSchemaType;

export type GroupSessionData = {
  code: string;
  hostId: string;
  groups: GroupSessionGroupData[];
} & GroupSessionMetadata;

/* biome-ignore lint/complexity/noBannedTypes: intended as a placeholder
since Record<string, never> messes up GroupSessionGroupData
*/
export type GroupSessionGroupMetadata = {};

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
    //newData: (code: string) => redisKey("gnewdata", code),
    partialData: (code: string) => redisKey("gpartialdata", code),
    deleted: (code: string) => redisKey("gdeleted", code),
  },
};

export * from "./crud";
export * from "./helpers";
