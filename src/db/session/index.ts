import {
  sessionCreateSchema,
  SessionCreateSchemaType,
} from "@/components/forms/session-create";
import z from "zod";
import redis, { k } from "../redis";
import { Seed } from "@/lib/seed";
import { getHostId } from "./helpers";
import { generateSessionCode } from "@/lib/session";
import { SESSION_CODE_LENGTH } from "@/lib/constants";

export type GroupSessionMetadata = {
  createdOn: number;
  // i figure it's better to hard-store the group names themselves,
  // as the alternative would be computing them from the seed each time
  // a user wants to join a group (for validation reasons)
  groupNames: string[];
} & SessionCreateSchemaType;

export type GroupSessionGroups = string[][];

export type GroupSessionData = GroupSessionMetadata & {
  code: string;
  hostId: string;
  groups: GroupSessionGroups;
};

export async function getGroups(
  groupCount: number,
  hostId: string,
  code: string
): Promise<GroupSessionGroups> {
  const groups: GroupSessionGroups = [];
  for (let i = 0; i < groupCount; i++) {
    const members = await redis.sMembers(
      k("host", hostId, "session", code, "group", i)
    );
    groups.push(members);
  }

  return groups;
}

async function getSession(
  metadata: Record<string, string>,
  code: string,
  hostId: string
): Promise<GroupSessionData> {
  const parsedMetadata: GroupSessionMetadata = {
    ...metadata,
    createdOn: Number(metadata.createdOn),
    groupNames: JSON.parse(metadata.groupNames || "[]"),
    groupSeed: metadata.groupSeed,
    groupSize: Number(metadata.groupSize),
    name: metadata.name,
    description: metadata.description,
  };

  return {
    ...parsedMetadata,
    code,
    hostId,
    groups: await getGroups(parsedMetadata.groupNames.length, hostId, code),
  };
}

export async function getSessionByCode(
  code: string
): Promise<GroupSessionData | null> {
  const hostId = await getHostId(code);
  if (!hostId) return null;

  const metadata = await redis.hGetAll(
    k("host", hostId, "session", code, "metadata")
  );
  if (!metadata) return null;

  return await getSession(metadata, code, hostId);
}

export async function getHostSessions(hostId: string) {
  const sessions: GroupSessionData[] = [];

  for await (const batch of redis.scanIterator({
    MATCH: k("host", hostId, "session", "*", "metadata"),
  })) {
    for (const key of batch) {
      const parts = key.split(":");
      const code = parts[5];

      sessions.push(await getSession(await redis.hGetAll(key), code, hostId));
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

  await redis.hSet(k("host", hostId, "session", code, "metadata"), {
    ...metadata,
    groupNames: JSON.stringify(metadata.groupNames),
  });
  await redis.set(k("session", code, "host"), hostId);
}

export async function deleteGroupSession(hostId: string, code: string) {
  const keys: string[] = [];

  for await (const key of redis.scanIterator({
    MATCH: k("host", hostId, "session", code, "*"),
  })) {
    keys.push(...key);
  }

  if (keys.length > 0) {
    await redis.del(keys);
  }
  await redis.del(k("session", code, "host"));
}

export async function joinGroup(code: string, index: number, userId: string) {
  await redis.sAdd(
    k("host", await getHostId(code), "session", code, "group", index),
    userId
  );
}

export async function leaveGroup(code: string, index: number, userId: string) {
  await redis.sRem(
    k("host", await getHostId(code), "session", code, "group", index),
    userId
  );
}
