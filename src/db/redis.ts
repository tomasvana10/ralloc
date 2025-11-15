import { createClient } from "redis";

const redisClientSingleton = () => {
  const client = createClient({ url: "redis://redis:6379" });
  client.on("error", console.error);
  client.connect().catch(console.error);
  return client;
};

// biome-ignore lint/suspicious/noShadowRestrictedNames: intended usage
declare const globalThis: {
  redisGlobal: ReturnType<typeof redisClientSingleton>;
} & typeof global;

const redis = globalThis.redisGlobal ?? redisClientSingleton();

export const REDIS = {
  NAMESPACE: "ralloc",
  VERSION: "v1",
  SEP: ":",
  PREFIX_PARTS: 2,
};

export const k = (...parts: (string | number)[]) =>
  [REDIS.NAMESPACE, REDIS.VERSION, ...parts].join(REDIS.SEP);

export default redis;

if (process.env.NODE_ENV !== "production") globalThis.redisGlobal = redis;
