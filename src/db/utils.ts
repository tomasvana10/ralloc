import redis from ".";

export async function getKeys(match: string, count: number = 10) {
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
