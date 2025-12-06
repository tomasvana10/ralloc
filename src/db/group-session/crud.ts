import type { Session } from "next-auth";
import type z from "zod";
import type { sessionCreateSchema } from "@/features/forms/session-create";
import {
  expand,
  generateSessionCode,
  MAX_USER_SESSIONS,
  seed,
  UserRepresentation,
} from "@/lib/group-session";
import redis, { REDIS } from "..";
import { getKeys } from "../utils";
import {
  type GroupSessionData,
  type GroupSessionGroupData,
  type GroupSessionMetadata,
  getHostId,
  paths,
} from ".";

const GROUP_SCAN_COUNT = Math.floor(seed.MAX_PARTS * 0.7);
const ALL_SESSION_KEYS_SCAN_COUNT = Math.floor(GROUP_SCAN_COUNT * 1.1);

//#region create
export async function createGroupSession(
  data: z.output<typeof sessionCreateSchema>,
  hostId: string,
  session: Session,
) {
  const code = generateSessionCode();
  const metadata: GroupSessionMetadata = {
    createdOn: Date.now(),
    compressedHost: UserRepresentation.from(session).toCompressedString(),
    ...data,
  };

  const tx = redis.multi();

  tx.hSet(paths.metadata(hostId, code), {
    ...metadata,
    frozen: (+metadata.frozen).toString(),
  });
  tx.set(paths.sessionHost(code), hostId);

  const groupNames = expand(data.groupSeed).values;
  for (const groupName of groupNames) {
    // placeholder (as of now) used to find all group names.
    // NOTE: modify this to add group-specific metadata in the future
    tx.hSet(paths.groupMetadata(hostId, code, groupName), { _: "_" });
  }

  await tx.exec();
  return code;
}

//#region read
export async function getGroupSessionsOfHost(hostId: string) {
  const metadataKeys = await getKeys(
    paths.patterns.allHostMetadataKeys(hostId),
    MAX_USER_SESSIONS,
  );
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

export async function getGroupSessionByCode(code: string) {
  const hostId = await getHostId(code);
  if (!hostId) return null;

  const metadata = await redis.hGetAll(paths.metadata(hostId, code));
  if (!metadata) return null;

  return await assembleGroupSession(metadata, hostId, code);
}

//#region update
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

//#region delete
export async function deleteGroupSession(hostId: string, code: string) {
  const sessionKeys = await getKeys(
    paths.patterns.allHostSessionKeys(hostId, code),
    ALL_SESSION_KEYS_SCAN_COUNT,
  );
  if (!sessionKeys.size) return;

  await Promise.all([
    redis.del([...sessionKeys]),
    redis.del(paths.sessionHost(code)),
  ]);
}

//#region helpers
async function getGroups(hostId: string, code: string) {
  const groupKeys = await getKeys(
    paths.patterns.allGroupNames(hostId, code),
    GROUP_SCAN_COUNT,
  );

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

async function assembleGroupSession(
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
    compressedHost: metadata.compressedHost,
    groups: await getGroups(hostId, code),
  };
  return session;
}
