import type { ProxyConfig } from "next/server";

export { auth as proxy } from "@/auth";

export const config: ProxyConfig = {
  matcher: [
    "/",
    "/sessions",
    // allow everything except /auth i don't think negative
    // expressions work but regardless the more verbose method is better
    "/api/(host|session-ws|sessions)/:path*",
    "/s/:path*",
  ],
};
