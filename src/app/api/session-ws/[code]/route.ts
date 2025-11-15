import type { NextRequest } from "next/server";
import type { RouteContext } from "next-ws/server";
import type { WebSocket, WebSocketServer } from "ws";
import { auth } from "@/auth";
import { groupSessionC2SPayload } from "@/lib/group-session/c2s-messaging";

export function GET() {
  const headers = new Headers();
  headers.set("Connection", "Upgrade");
  headers.set("Upgrade", "websocket");
  return new Response("Upgrade Required", { status: 426, headers });
}

export async function UPGRADE(
  client: WebSocket,
  _server: WebSocketServer,
  _request: NextRequest,
  ctx: RouteContext<"/api/session-ws/[code]">,
) {
  const { code } = ctx.params;
  const session = await auth();

  // server does not respond to faulty messages!
  client.on("message", (data: any) => {
    console.debug("new connection");
    let rawPayload: Record<string, any>;
    try {
      rawPayload = JSON.parse(data);
    } catch {
      return;
    }

    const parseResult = groupSessionC2SPayload.safeParse(rawPayload);
    // invalid payload
    if (parseResult.error) return;

    const { data: payload } = parseResult;

    // process payload
    if (payload.code === "JoinGroup") {
    } else if (payload.code === "LeaveGroup") {
    }
  });
}
