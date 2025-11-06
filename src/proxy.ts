import type { ProxyConfig } from "next/server";

export { auth as proxy } from "@/auth";

export const config: ProxyConfig = {
  matcher: [
    "/",
    "/sessions",
    "/api/ws/:path*",
    "/api/sessions/:path*",
    "/api/host/:path*",
  ],
};
