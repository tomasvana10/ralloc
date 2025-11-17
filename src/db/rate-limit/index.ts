import redis, { k } from "@/db/redis";
import { getLuaScriptSha, loadLuaScript } from "../lua-script";

const tokenBucketScript = await loadLuaScript("token-bucket", "rate-limit");

export interface RateLimit {
  allowed: boolean;
  remaining: number;
  limit: number;
}

async function applyRateLimit(
  key: string,
  refillsPerSecond: number,
  burst: number,
  cost: number = 1,
) {
  const now = Math.floor(Date.now() / 1000);

  const sha = await getLuaScriptSha(tokenBucketScript);

  const [allowed, tokens, limit] = (await redis.evalSha(sha, {
    keys: [key],
    arguments: [
      now.toString(),
      refillsPerSecond.toString(),
      burst.toString(),
      cost.toString(),
    ],
  })) as [number, number, number];

  const result: RateLimit = {
    allowed: allowed === 1,
    remaining: tokens,
    limit,
  };
  return result;
}

/**
 * Process a rate limit
 *
 * @param id Identifier for the rate limit key
 * @param namespace A namespace to group the identifier under
 * (generally the route which is being rate limited)
 * @param requestsPerMinute How many requests can be made per minute
 * @param burst How much instantaneous traffic can be processed at a time
 *
 * @returns The `{ rheaders }` callback if a rate limit wasn't applied,
 * allowing the handler to apply rate-limit related information their
 * existing response. Otherwise, {@link rateLimit}
 *
 */
export async function rateLimit(
  id: string,
  namespace: string,
  requestsPerMinute: number,
  burst: number,
) {
  const key = k("rl", namespace, id);
  const result = await applyRateLimit(key, requestsPerMinute / 60, burst);

  function rheaders(res: Response) {
    res.headers.set("X-Rate-Limit-Limit", result.limit.toString());
    res.headers.set("X-Rate-Limit-Remaining", result.remaining.toString());
    return res;
  }

  if (!result.allowed) {
    return {
      res: rheaders(
        Response.json(
          {
            error: { message: "Too many requests" },
          },
          {
            status: 429,
          },
        ),
      ),
    };
  }

  return { rheaders };
}
