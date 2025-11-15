import type { ProxyConfig } from "next/server";

export { auth as proxy } from "@/auth";

export const config: ProxyConfig = {
  matcher: [
    "/",
    "/sessions",
    "/api/(host|session-ws|sessions)/:path*",
    "/s/:path*",
  ],
};
