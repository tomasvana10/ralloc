import { redisKey } from "..";

export const paths = {
  tenants: (code: string) => redisKey("room", code, "tenants"),
};

export const pubsub = {
  message: (code: string) => redisKey("room", code, "message"),
  tenantCount: (code: string) => redisKey("room", code, "tenantCount"),
};
