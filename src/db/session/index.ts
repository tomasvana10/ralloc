import { sessionCreateSchema } from "@/components/forms/session-create";
import type { SessionCreateSchemaType } from "@/components/forms/session-create";
import z from "zod";
import redis, { k, REDIS_SEP } from "../redis";
import { Seed } from "@/lib/seed";
import { getHostId } from "./helpers";
import { generateSessionCode } from "@/lib/session";
import { SESSION_CODE_LENGTH } from "@/lib/constants";

export type GroupSessionMetadata = {
  createdOn: number;
  /**
   * The group names obtained from the initial seed expansion
   */
  groupNames: string[];
} & SessionCreateSchemaType;

/**
 * Nested array that represents groups and their members.
 * Indices of this array are synchronised with {@link GroupSessionMetadata.groupNames}
 *
 * @example [["user1", "user2"], ["user3", "user4"]]
 */
export type GroupSessionGroups = string[][];

export type GroupSessionData = GroupSessionMetadata & {
  code: string;
  hostId: string;
  groups: GroupSessionGroups;
};

export const paths = {
  // reverse mapping to determine host id from a session code
  sessionHost: (code: string) => k("session", code, "host"),
  // single metadata
  metadata: (hostId: string, code: string) =>
    k("host", hostId, "session", code, "metadata"),
  // single group
  group: (hostId: string, code: string, index: number) =>
    k("host", hostId, "session", code, "group", index),
  // all metadata keys for a particular host
  patternAllHostMetadataKeys: (hostId: string) =>
    k("host", hostId, "session", "*", "metadata"),
  // metadata key, as well as group:0, group:1, etc for a particular host and session
  patternAllHostSessionKeys: (hostId: string, code: string) =>
    k("host", hostId, "session", code, "*"),
};

export async function getGroups(
  groupCount: number,
  hostId: string,
  code: string
) {
  const tx = redis.multi();

  for (let i = 0; i < groupCount; i++) {
    tx.sMembers(paths.group(hostId, code, i));
  }

  return (await tx.exec()) as unknown as GroupSessionGroups;
}

export async function getGroupSession(
  metadata: Record<string, string>,
  code: string,
  hostId: string
) {
  const parsedMetadata: GroupSessionMetadata = {
    ...metadata,
    createdOn: Number(metadata.createdOn),
    groupNames: JSON.parse(metadata.groupNames || "[]"),
    groupSeed: metadata.groupSeed,
    groupSize: Number(metadata.groupSize),
    name: metadata.name,
    description: metadata.description,
  };

  const session: GroupSessionData = {
    ...parsedMetadata,
    code,
    hostId,
    groups: await getGroups(parsedMetadata.groupNames.length, hostId, code),
  };

  return session;
}

export async function getGroupSessionByCode(code: string) {
  const hostId = await getHostId(code);
  if (!hostId) return null;

  const metadata = await redis.hGetAll(paths.metadata(hostId, code));
  if (!metadata) return null;

  return await getGroupSession(metadata, code, hostId);
}

export async function getGroupSessionsOfHost(hostId: string) {
  const sessions: GroupSessionData[] = [];

  for await (const batch of redis.scanIterator({
    MATCH: paths.patternAllHostMetadataKeys(hostId),
  })) {
    for (const key of batch) {
      const parts = key.split(REDIS_SEP);
      const code = parts[5];

      sessions.push(
        await getGroupSession(await redis.hGetAll(key), code, hostId)
      );
    }
  }

  return sessions;
}

export async function setGroupSession(
  data: z.output<typeof sessionCreateSchema>,
  hostId: string
) {
  const code = generateSessionCode(SESSION_CODE_LENGTH);
  const metadata: GroupSessionMetadata = {
    createdOn: Date.now(),
    groupNames: Seed.expand(data.groupSeed).values,
    ...data,
  };

  await redis.hSet(paths.metadata(hostId, code), {
    ...metadata,
    groupNames: JSON.stringify(metadata.groupNames),
  });
  await redis.set(paths.sessionHost(code), hostId);
}

export async function deleteGroupSession(hostId: string, code: string) {
  const keys: string[] = [];

  for await (const key of redis.scanIterator({
    MATCH: paths.patternAllHostSessionKeys(hostId, code),
  })) {
    keys.push(...key);
  }

  if (keys.length > 0) {
    await redis.del(keys);
  }
  await redis.del(paths.sessionHost(code));
}

export async function joinGroup(code: string, index: number, userId: string) {
  const hostId = await getHostId(code);
  await redis.sAdd(paths.group(hostId, code, index), userId);
}

export async function leaveGroup(code: string, index: number, userId: string) {
  const hostId = await getHostId(code);
  await redis.sRem(paths.group(hostId, code, index), userId);
}
