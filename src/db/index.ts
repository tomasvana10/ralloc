import { createClient } from "redis";
import { config } from "@/config";

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
  redisSub: Client;
} & typeof global;

const redis = globalThis.redisGlobal ?? redisClientSingleton();
const redisPub = globalThis.redisPub ?? createPubClient(redis);
const redisSub = globalThis.redisSub ?? (await createSubClient(redis));

const prefixes = ["rlc"];

export const REDIS = {
  NAMESPACE: prefixes[0],
  SEP: ":",
  PREFIX_PARTS: prefixes.length,
  DEFAULT_BATCH_COUNT: 1000,
};

export const redisKey = (...parts: (string | number)[]) =>
  [REDIS.NAMESPACE, ...parts].join(REDIS.SEP);

export default redis;
export { redisPub, redisSub, createSubClient };

if (config.isDevelopment) {
  globalThis.redisGlobal = redis;
  globalThis.redisPub = redisPub;
  globalThis.redisSub = redisSub;
}
