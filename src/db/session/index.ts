import type z from "zod";
import type {
  SessionCreateSchemaType,
  sessionCreateSchema,
} from "@/forms/session-create";
import { SESSION_CODE_LENGTH } from "@/lib/constants";
import { GroupSeed } from "@/lib/seed";
import { generateSessionCode } from "@/lib/utils";
import redis, { k, REDIS } from "../redis";
import { getHostId } from "./helpers";

export type GroupSessionMetadata = SessionCreateSchemaType & {
  createdOn: number;
  frozen: boolean;
};
export type GroupSessionData = GroupSessionMetadata & {
  code: string;
  hostId: string;
  groups: GroupSessionGroupData[];
};

export type GroupSessionGroupMetadata = {
  name: string;
};
export type GroupSessionGroupData = GroupSessionGroupMetadata & {
  members: string[];
};

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

export async function getGroups(hostId: string, code: string) {
  const groupKeys: string[] = [];
  for await (const key of redis.scanIterator({
    MATCH: paths.patterns.allGroupNames(hostId, code),
  })) {
    groupKeys.push(...key);
  }

  const tx = redis.multi();
  const groupNames: string[] = [];
  for (const key of groupKeys) {
    const parts = key.split(REDIS.SEP);
    const groupName = parts[REDIS.PREFIX_PARTS + 5];
    groupNames.push(groupName);
    //tx.hGetAll(paths.groupMetadata(hostId, code, groupName));
    tx.sMembers(paths.groupMembers(hostId, code, groupName));
  }

  const results = (await tx.exec()) as unknown as Array<
    Record<string, string> | string[]
  >;
  const groups: GroupSessionGroupData[] = [];
  for (let i = 0; i < groupNames.length; i++) {
    //const meta = results[i * 2] as Record<string, string>;
    const members = results[i] as string[];
    groups.push({ name: groupNames[i], members });
  }

  return groups;
}

export async function assembleGroupSession(
  metadata: Record<string, string>,
  hostId: string,
  code: string,
) {
  const parsedMetadata: GroupSessionMetadata = {
    ...metadata,
    createdOn: +metadata.createdOn,
    frozen: !!+metadata.frozen,
    groupSeed: metadata.groupSeed,
    groupSize: +metadata.groupSize,
    name: metadata.name,
    description: metadata.description,
  };
  const session: GroupSessionData = {
    ...parsedMetadata,
    code,
    hostId,
    groups: await getGroups(hostId, code),
  };
  return session;
}

export async function getGroupSessionByCode(code: string) {
  const hostId = await getHostId(code);
  if (!hostId) return null;

  const metadata = await redis.hGetAll(paths.metadata(hostId, code));
  if (!metadata) return null;

  return await assembleGroupSession(metadata, hostId, code);
}

export async function getGroupSessionsOfHost(hostId: string) {
  const sessions: GroupSessionData[] = [];

  for await (const batch of redis.scanIterator({
    MATCH: paths.patterns.allHostMetadataKeys(hostId),
  })) {
    for (const key of batch) {
      const parts = key.split(REDIS.SEP);
      const code = parts[REDIS.PREFIX_PARTS + 3];
      sessions.push(
        await assembleGroupSession(await redis.hGetAll(key), hostId, code),
      );
    }
  }

  return sessions;
}

export async function setGroupSession(
  data: z.output<typeof sessionCreateSchema>,
  hostId: string,
) {
  const code = generateSessionCode(SESSION_CODE_LENGTH);
  const metadata: GroupSessionMetadata = { createdOn: Date.now(), ...data };

  await redis.hSet(paths.metadata(hostId, code), {
    ...metadata,
    frozen: Number(metadata.frozen).toString(),
  });
  await redis.set(paths.sessionHost(code), hostId);

  const groupNames = GroupSeed.expand(data.groupSeed).values;
  const tx = redis.multi();
  for (const groupName of groupNames) {
    // placeholder (as of now) used to find all group names.
    // NOTE: modify this to add group-specific metadata in the future
    tx.hSet(paths.groupMetadata(hostId, code, groupName), { _: "_" });
  }
  await tx.exec();
}

export async function updateGroupSession(
  data: Partial<z.output<typeof sessionCreateSchema>>,
  hostId: string,
  code: string,
) {
  const _data = Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      let val: string;
      switch (typeof value) {
        case "boolean":
          val = Number(value).toString();
          break;
        case "number":
          val = value.toString();
          break;
        case "string":
          val = value;
          break;
        default:
          val = JSON.stringify(value);
      }
      return [key, val];
    }),
  );
  await redis.hSet(paths.metadata(hostId, code), _data);
}

export async function deleteGroupSession(hostId: string, code: string) {
  const keys: string[] = [];

  for await (const key of redis.scanIterator({
    MATCH: paths.patterns.allHostSessionKeys(hostId, code),
  })) {
    keys.push(...key);
  }

  if (keys.length > 0) {
    await redis.del(keys);
  }
  await redis.del(paths.sessionHost(code));
}

export async function joinGroup(
  code: string,
  groupName: string,
  userId: string,
) {
  const hostId = await getHostId(code);
  if (!hostId) return null;

  const tx = redis.multi();
  tx.sAdd(paths.groupMembers(hostId, code, groupName), userId);
  tx.set(paths.userGroup(hostId, code, userId), groupName);
  await tx.exec();
}

export async function leaveGroup(
  code: string,
  groupName: string,
  userId: string,
) {
  const hostId = await getHostId(code);
  if (!hostId) return null;

  const tx = redis.multi();
  tx.sRem(paths.groupMembers(hostId, code, groupName), userId);
  tx.del(paths.userGroup(hostId, code, userId));
  await tx.exec();
}
