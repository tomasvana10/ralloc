import { createClient } from "redis";

const redisClientSingleton = () => {
  const client = createClient({ url: "redis://redis:6379" });
  client.on("error", err => console.error("redis client error", err));
  client.connect().catch(console.error);
  return client;
};

declare const globalThis: {
  redisGlobal: ReturnType<typeof redisClientSingleton>;
} & typeof global;

const redis = globalThis.redisGlobal ?? redisClientSingleton();

export const REDIS_NAMESPACE = "ralloc";
export const REDIS_DATA_VERSION = "v1";
export const REDIS_SEP = ":";

export const k = (...parts: (string | number)[]) =>
  [REDIS_NAMESPACE, REDIS_DATA_VERSION, ...parts].join(REDIS_SEP);

export default redis;

if (process.env.NODE_ENV !== "production") globalThis.redisGlobal = redis;
