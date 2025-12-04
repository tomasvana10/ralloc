import { createClient } from "redis";

const redisClientSingleton = () => {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL not set in environment");
  const password = process.env.REDIS_PASSWORD;

  const client = createClient({
    url: process.env.REDIS_URL,
    ...(password ? { password } : {}),
  });
  client.on("error", console.error);
  client.connect().catch(console.error);
  return client;
};

type Client = ReturnType<typeof redisClientSingleton>;

const createPubClient = (client: Client) => {
  const pubsub = client.duplicate();
  pubsub.on("error", console.error);
  pubsub.connect().catch(console.error);
  return pubsub;
};

const createSubClient = async (client: Client) => {
  const pubsub = client.duplicate();
  pubsub.on("error", console.error);
  await pubsub.connect();
  return pubsub;
};

// biome-ignore lint/suspicious/noShadowRestrictedNames: intended usage
declare const globalThis: {
  redisGlobal: Client;
  redisPub: Client;
} & typeof global;

const redis = globalThis.redisGlobal ?? redisClientSingleton();
const redisPub = globalThis.redisPub ?? createPubClient(redis);

export const REDIS = {
  NAMESPACE: "rlc",
  VERSION: "v1",
  SEP: ":",
  PREFIX_PARTS: 2,
};

export const redisKey = (...parts: (string | number)[]) =>
  [REDIS.NAMESPACE, REDIS.VERSION, ...parts].join(REDIS.SEP);

export default redis;
export { redisPub, createSubClient };

if (process.env.NODE_ENV !== "production") {
  globalThis.redisGlobal = redis;
  globalThis.redisPub = redisPub;
}
