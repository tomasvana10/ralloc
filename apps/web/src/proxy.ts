import type { ProxyConfig } from "next/server";

export { auth as proxy } from "@web/auth";

export const config: ProxyConfig = {
  matcher: ["/", "/sessions", "/api/(host|sessions)/:path*", "/s/:path*"],
};
