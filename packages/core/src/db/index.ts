import { config } from "@core/config";
import { getLogger } from "@core/lib/logger";
import { createClient, type RedisClientType } from "redis";

type Client = RedisClientType;

const isBuilding = process.env.NEXT_PHASE === "phase-production-build";
const log = getLogger("db");

const redisClientSingleton = () => {
  if (isBuilding) return null;

  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL not set in environment");
  const password = process.env.REDIS_PASSWORD;

  const client = createClient({
    url,
    ...(password ? { password } : {}),
  });
  client.on("error", log.error);
  client.connect().catch(log.error);
  return client;
};

const createPubClient = (client: Client) => {
  if (isBuilding) return null;

  const pubsub = client.duplicate();
  pubsub.on("error", log.error);
  pubsub.connect().catch(log.error);
  return pubsub;
};

const createSubClient = async (client: Client): Promise<Client> => {
  if (isBuilding) return null as any;

  const pubsub = client.duplicate();
  pubsub.on("error", log.error);
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
const redisSub =
  globalThis.redisSub ?? (isBuilding ? null : await createSubClient(redis));

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
