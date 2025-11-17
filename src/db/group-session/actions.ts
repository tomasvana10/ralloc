import type z from "zod";
import type {
  SessionCreateSchemaType,
  sessionCreateSchema,
} from "@/forms/session-create";
import { SESSION_CODE_LENGTH } from "@/lib/group-session/constants";
import { GroupSeed } from "@/lib/seed";
import { generateSessionCode } from "@/lib/utils";
import redis, { REDIS } from "../redis";
import { paths } from ".";
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

export async function getGroups(hostId: string, code: string) {
  const groupKeys = new Set<string>();
  for await (const batch of redis.scanIterator({
    MATCH: paths.patterns.allGroupNames(hostId, code),
    COUNT: 1,
  })) {
    batch.forEach((key) => {
      groupKeys.add(key);
      return;
    });
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
    /*Record<string, string> | */ string[]
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
  const session: GroupSessionData = {
    createdOn: +metadata.createdOn,
    frozen: !!+metadata.frozen,
    groupSeed: metadata.groupSeed,
    groupSize: +metadata.groupSize,
    name: metadata.name,
    description: metadata.description,
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
  const metadataKeys = new Set<string>();
  for await (const batch of redis.scanIterator({
    MATCH: paths.patterns.allHostMetadataKeys(hostId),
  })) {
    batch.forEach((key) => {
      metadataKeys.add(key);
      return;
    });
  }

  if (metadataKeys.size === 0) return [];

  // record the codes during the pipeline for later assembly into a full group session
  const codes: string[] = [];
  // rule of thumb from redis docs is to use a pipeline if atomicity isn't
  // important, as it reduces network and processing overhead
  const pipeline = redis.multi();

  for (const batch of metadataKeys) {
    codes.push(batch.split(REDIS.SEP)[REDIS.PREFIX_PARTS + 3]);
    pipeline.hGetAll(batch);
  }
  const sessions: GroupSessionData[] = [];
  const pipelinedMetadata = await pipeline.execAsPipeline();

  let i = 0;
  for (const metadata of pipelinedMetadata) {
    sessions.push(
      await assembleGroupSession(
        metadata as unknown as Record<string, string>,
        hostId,
        codes[i],
      ),
    );
    i++;
  }

  return sessions;
}

export async function createGroupSession(
  data: z.output<typeof sessionCreateSchema>,
  hostId: string,
) {
  const code = generateSessionCode(SESSION_CODE_LENGTH);
  const metadata: GroupSessionMetadata = { createdOn: Date.now(), ...data };

  const tx = redis.multi();

  tx.hSet(paths.metadata(hostId, code), {
    ...metadata,
    frozen: (+metadata.frozen).toString(),
  });
  tx.set(paths.sessionHost(code), hostId);

  const groupNames = GroupSeed.expand(data.groupSeed).values;
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
          val = (+value).toString();
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
  const sessionKeys = new Set<string>();

  for await (const batch of redis.scanIterator({
    MATCH: paths.patterns.allHostSessionKeys(hostId, code),
    COUNT: 1,
  })) {
    batch.forEach((key) => {
      sessionKeys.add(key);
      return;
    });
  }

  if (!sessionKeys.size) return;

  await Promise.all([
    redis.del([...sessionKeys]),
    redis.del(paths.sessionHost(code)),
  ]);
}
