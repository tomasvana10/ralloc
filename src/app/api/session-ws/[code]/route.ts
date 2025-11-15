import type { NextRequest } from "next/server";
import type { RouteContext } from "next-ws/server";
import type { WebSocket, WebSocketServer } from "ws";

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

  console.log(`client conencted to session ${code}`);
  client.on("close", async () => {});
}
