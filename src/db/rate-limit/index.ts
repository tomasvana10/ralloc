import redis, { redisKey } from "@/db/redis";
import { getLuaScriptSha, loadLuaScript } from "../lua-script";

const tokenBucketScript = await loadLuaScript("token-bucket");

export interface RateLimitResult {
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

  const result: RateLimitResult = {
    allowed: allowed === 1,
    remaining: tokens,
    limit,
  };
  return result;
}

/**
 * Process a rate limit
 *
 * @param id Identifier for the rate limit key.
 * @param categories A set of labels to create the rate limit under.
 * @param requestsPerMinute How many requests can be made per minute.
 * @param burst How much instantaneous traffic can be processed at a time.
 *
 * @returns The `{ infoHeaders }` callback if a rate limit wasn't applied,
 * allowing the handler to apply rate-limit related information their
 * existing response. Otherwise, {@link rateLimit} returns `{ res }`
 * for the caller to immediately return due to a rate-limit being applied.
 *
 */
export async function rateLimit({
  id,
  categories,
  requestsPerMinute,
  burst,
}: {
  id: string;
  categories: string[];
  requestsPerMinute: number;
  burst: number;
}) {
  const result = await applyRateLimit(
    redisKey("rl", ...categories, id),
    requestsPerMinute / 60,
    burst,
  );

  function infoHeaders(res: Response) {
    res.headers.set("X-Rate-Limit-Limit", result.limit.toString());
    res.headers.set("X-Rate-Limit-Remaining", result.remaining.toString());
    return res;
  }

  if (!result.allowed) {
    return {
      res: infoHeaders(
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

  return { infoHeaders };
}
