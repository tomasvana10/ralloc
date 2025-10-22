import type { MiddlewareConfig } from "next/server";

export { auth as middleware } from "@/auth";

export const config: MiddlewareConfig = { matcher: ["/session/:path*"] };
