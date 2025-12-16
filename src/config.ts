function numericLiteralToBoolean(literal?: string) {
  return !!+(literal ?? 1);
}

export const config = {
  isGuestAuthEnabled: numericLiteralToBoolean(process.env.ENABLE_GUEST_AUTH),
  isRateLimitingEnabled: numericLiteralToBoolean(
    process.env.ENABLE_RATELIMITING,
  ),
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
  isTesting: process.env.NODE_ENV === "test",
} as const;
