import type { MiddlewareConfig } from "next/server";

export { auth as middleware } from "@/auth";

export const config: MiddlewareConfig = {
  matcher: ["/", "/api/ws/:path*", "/api/session/:path*"],
};
