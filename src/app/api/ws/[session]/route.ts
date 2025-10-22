import redis from "@/lib/redis";
import type { MessageType } from "@/lib/session";
import type { RouteContext } from "next-ws/server";
import type { NextRequest } from "next/server";
import type { WebSocket, WebSocketServer } from "ws";

interface Message {
  type: MessageType;
  payload?: any;
}

export function GET() {
  const headers = new Headers();
  headers.set("Connection", "Upgrade");
  headers.set("Upgrade", "websocket");
  return new Response("Upgrade Required", { status: 426, headers });
}

export async function UPGRADE(
  client: WebSocket,
  server: WebSocketServer,
  request: NextRequest,
  ctx: RouteContext<"/api/ws/[session]">,
) {
  const { session: sessionId } = ctx.params;
  const key = `session:${sessionId}`;

  const sub = redis.duplicate();
  await sub.connect();
  await sub.subscribe(key, (msg) => {
    if (client.readyState === client.OPEN) client.send(msg);
  });

  console.log(`client conencted to session ${sessionId}`);

  client.on("close", async () => {
    await sub.unsubscribe(key);
    sub.destroy();
  });
}
