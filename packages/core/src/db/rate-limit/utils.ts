export function getRateLimitMessage(res?: Response, retryAfter?: number) {
  let retry = res
    ? (retryAfter ?? res.headers.get("Retry-After"))
    : (retryAfter ?? null);
  const baseMessage = "You're sending too many requests";
  if (retry === null) return `${baseMessage}. Try again soon`;
  if (typeof retry === "string") retry = +retry;

  return `${baseMessage}. Try again in ${retry} ${retry === 1 ? "second" : "seconds"}`;
}
