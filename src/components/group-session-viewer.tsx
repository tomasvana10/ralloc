"use client";

import React from "react";
import { GroupSessionC2S } from "@/lib/group-session";
import { useWebSocket } from "@/lib/hooks/websocket";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

// component is mainly for testing right now
export default function GroupSessionViewer({ code }: { code: string }) {
  const ws = useWebSocket(() => `/api/session-ws/${code}`);

  const [message, setMessage] = React.useState<string>("");
  const [input, setInput] = React.useState("");

  React.useEffect(() => {
    const controller = new AbortController();

    if (!ws) return;

    ws.addEventListener(
      "message",
      (ev) => {
        setMessage(String(ev.data));
      },
      controller,
    );

    ws.addEventListener(
      "close",
      (ev) => setMessage(`${ev.code} closed: ${ev.reason || "no message"}`),
      controller,
    );

    return () => controller.abort();
  }, [ws]);

  if (!ws) return <p>no websocket connection</p>;

  return (
    <div>
      <div>
        <label htmlFor="x">Group name: </label>
        <Input
          id="x"
          className="w-1/2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="group"
        />
      </div>

      <div>
        <Button
          type="button"
          className="mr-2"
          onClick={() => {
            const payload: GroupSessionC2S.Payloads.JoinGroup = {
              code: GroupSessionC2S.code.enum.JoinGroup,
              groupName: input,
            };
            ws?.send(JSON.stringify(payload));
          }}>
          Join
        </Button>

        <Button
          type="button"
          onClick={() => {
            const payload: GroupSessionC2S.Payloads.LeaveGroup = {
              code: GroupSessionC2S.code.enum.LeaveGroup,
            };
            ws?.send(JSON.stringify(payload));
          }}>
          Leave
        </Button>
      </div>

      <p className="break-all">{message}</p>
    </div>
  );
}
