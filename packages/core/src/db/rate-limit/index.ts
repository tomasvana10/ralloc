import { config } from "@core/config";
import redis, { redisKey } from "@core/db";
import { getLuaScriptSha, loadLuaScript } from "../lua-script";

export interface AppliedRateLimitDetails {
  allowed: boolean;
  remaining: number;
  limit: number;
  reset: number;
}

const tokenBucketScript = await loadLuaScript("tb-ratelimit");
async function applyRateLimit(
  key: string,
  refillsPerSecond: number,
  burst: number,
  cost: number = 1,
): Promise<AppliedRateLimitDetails> {
  const now = Math.floor(Date.now() / 1000);

  const sha = await getLuaScriptSha(tokenBucketScript);

  const [allowed, tokens, limit, reset] = (await redis.evalSha(sha, {
    keys: [key],
    arguments: [
      now.toString(),
      refillsPerSecond.toString(),
      burst.toString(),
      cost.toString(),
    ],
  })) as [number, number, number, number];

  return {
    allowed: allowed === 1,
    remaining: Math.floor(tokens),
    limit,
    reset,
  };
}

/**
 * Process a rate limit
 *
 * @param id Identifier for the rate limit key.
 * @param categories A set of labels to create the rate limit under.
 * @param requestsPerMinute How many requests can be made per minute.
 * @param burst How much instantaneous traffic can be processed at a time.
 *
 * @returns The `{ rlHeaders }` callback if a rate limit wasn't applied,
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
  if (!config.isRateLimitingEnabled)
    return { rlHeaders: (res: Response) => res };

  const result = await applyRateLimit(
    redisKey("rl", ...categories, id),
    requestsPerMinute / 60,
    burst,
  );

  function rlHeaders(res: Response) {
    res.headers.set("RateLimit-Limit", result.limit.toString());
    res.headers.set("RateLimit-Remaining", result.remaining.toString());
    res.headers.set("RateLimit-Reset", result.reset.toString());
    return res;
  }

  if (!result.allowed) {
    const response = new Response(null, { status: 429 });
    const retryAfter = Math.max(
      1,
      result.reset - Math.floor(Date.now() / 1000),
    );
    response.headers.set("Retry-After", retryAfter.toString());
    return { res: rlHeaders(response), retryAfter };
  }

  return { rlHeaders };
}
