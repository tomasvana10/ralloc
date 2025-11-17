import { k } from "../redis";

export const paths = {
  sessionHost: (code: string) => k("session", code, "host"),
  metadata: (hostId: string, code: string) =>
    k("host", hostId, "session", code, "metadata"),
  groupMetadata: (hostId: string, code: string, groupName: string) =>
    k("host", hostId, "session", code, "group", groupName, "gmetadata"),
  groupMembers: (hostId: string, code: string, groupName: string) =>
    k("host", hostId, "session", code, "group", groupName, "members"),
  userGroup: (hostId: string, code: string, userId: string) =>
    k("host", hostId, "session", code, "userGroup", userId),
  patterns: {
    allHostMetadataKeys: (hostId: string) =>
      k("host", hostId, "session", "*", "metadata"),
    allHostSessionKeys: (hostId: string, code: string) =>
      k("host", hostId, "session", code, "*"),
    allGroupNames: (hostId: string, code: string) =>
      k("host", hostId, "session", code, "group", "*", "gmetadata"),
  },
};

export * from "./actions";
export * from "./helpers";
export * from "./scripting";
