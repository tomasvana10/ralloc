import redis, { k } from "../redis";

export async function getHostId(code: string) {
  return (await redis.get(k("session", code, "host")))!;
}

export async function getHostedSessionCount(hostId: string) {
  let count = 0;
  const pattern = k("host", hostId, "session", "*", "metadata");

  for await (const batch of redis.scanIterator({ MATCH: pattern })) {
    count += batch.length;
  }

  return count;
}
