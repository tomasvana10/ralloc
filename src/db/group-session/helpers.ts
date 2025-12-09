import redis from "..";
import { paths } from ".";

export async function getHostId(code: string) {
  return await redis.get(paths.sessionHost(code));
}

export async function getHostedSessionCount(hostId: string) {
  let count = 0;
  const pattern = paths.patterns.allHostMetadataKeys(hostId);

  for await (const batch of redis.scanIterator({ MATCH: pattern })) {
    count += batch.length;
  }

  return count;
}

export async function doesGroupSessionExist(code: string) {
  return await redis.exists(paths.sessionHost(code));
}

export async function getGroupSessionGroupSize(hostId: string, code: string) {
  const size = await redis.hGet(paths.metadata(hostId, code), "groupSize");
  if (size === null) return null;
  return +size;
}
