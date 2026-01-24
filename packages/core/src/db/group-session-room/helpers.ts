import redis from "..";
import { getLuaScriptSha, loadLuaScript } from "../lua-script";
import { paths } from ".";

const TTL = 3600;

export async function getTenantCount(code: string) {
  const tenants = await redis.get(paths.tenants(code));
  if (!tenants) return null;

  return parseInt(tenants, 10);
}

export async function addTenant(code: string) {
  const key = paths.tenants(code);
  const tx = redis.multi();

  tx.incr(key);
  tx.expire(key, TTL);

  const [tenants] = await tx.exec();
  return tenants as unknown as number;
}

const removeTenantScript = await loadLuaScript("remove-tenant");
export async function removeTenant(code: string) {
  const tenantsKey = paths.tenants(code);

  const sha = await getLuaScriptSha(removeTenantScript);
  const tenants = (await redis.evalSha(sha, {
    keys: [tenantsKey],
    arguments: [TTL.toString()],
  })) as number;

  return tenants;
}

export async function ping(code: string) {
  await redis.expire(paths.tenants(code), TTL);
}
