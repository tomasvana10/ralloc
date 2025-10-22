import { createClient } from "redis";

const redisClientSingleton = () => {
  const client = createClient({ url: "redis://localhost:6379" });
  client.on("error", (err) => console.error("redis client error", err));
  client.connect().catch(console.error);
  return client;
};

declare const globalThis: {
  redisGlobal: ReturnType<typeof redisClientSingleton>;
} & typeof global;

const redis = globalThis.redisGlobal ?? redisClientSingleton();

export default redis;

if (process.env.NODE_ENV !== "production") globalThis.redisGlobal = redis;
