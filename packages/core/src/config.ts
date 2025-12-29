function numericStringToBoolean(
  literal: string | undefined,
  defaultValue = false,
) {
  if (literal === "1") return true;
  if (literal === "0") return false;
  return defaultValue;
}

export const config = {
  isGuestAuthEnabled: numericStringToBoolean(
    process.env.ENABLE_GUEST_AUTH,
    false,
  ),
  isRateLimitingEnabled: numericStringToBoolean(
    process.env.ENABLE_RATELIMITING,
    true,
  ),
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
  isTesting: process.env.NODE_ENV === "test",
} as const;
