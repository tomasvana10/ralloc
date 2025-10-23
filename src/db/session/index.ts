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
