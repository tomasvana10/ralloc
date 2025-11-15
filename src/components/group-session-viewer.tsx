"use client";

import { useWebSocket } from "@/lib/hooks/websocket";
import { Button } from "./ui/button";

export default function GroupSessionViewer({ code }: { code: string }) {
  const ws = useWebSocket(() => `/api/session-ws/${code}`);

  return <Button onClick={() => ws?.send("hello broscilloscope")}></Button>;
}
