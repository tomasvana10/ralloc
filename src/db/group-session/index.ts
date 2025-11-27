import { redisKey } from "../redis";

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
  patterns: {
    allHostMetadataKeys: (hostId: string) =>
      redisKey("host", hostId, "session", "*", "metadata"),
    allHostSessionKeys: (hostId: string, code: string) =>
      redisKey("host", hostId, "session", code, "*"),
    allGroupNames: (hostId: string, code: string) =>
      redisKey("host", hostId, "session", code, "group", "*", "gmetadata"),
  },
  pubsub: {
    newData: (code: string) => redisKey("gnewdata", code),
    deleted: (code: string) => redisKey("gdeleted", code),
  },
};

export * from "./actions";
export * from "./helpers";
export * from "./scripting";
