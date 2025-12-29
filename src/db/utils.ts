import redis, { REDIS } from ".";

export async function getKeys(
  match: string,
  count: number = REDIS.DEFAULT_BATCH_COUNT,
) {
  const keys = new Set<string>();
  for await (const batch of redis.scanIterator({
    MATCH: match,
    COUNT: count,
  })) {
    batch.forEach((key) => {
      keys.add(key);
      return;
    });
  }

  return keys;
}
