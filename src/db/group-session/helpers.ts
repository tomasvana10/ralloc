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
  return await redis.hGet(paths.metadata(hostId, code), "groupSize");
}

export async function clearGroupMembers(
  hostId: string,
  code: string,
  groupName: string,
) {
  await redis.del(paths.groupMembers(hostId, code, groupName));
}

export async function clearAllGroupMembers(hostId: string, code: string) {
  const memberKeys = new Set<string>();
  for await (const batch of redis.scanIterator({
    MATCH: paths.patterns.allGroupMembers(hostId, code),
    COUNT: 50,
  })) {
    batch.forEach((key) => {
      memberKeys.add(key);
      return;
    });
  }

  if (!memberKeys.size) return;

  await redis.del([...memberKeys]);
}
