import { useEffect, useRef, useState } from "react";

export function useWebSocket(url: () => string) {
  const ref = useRef<WebSocket | null>(null);
  const target = useRef(url);
  const [, update] = useState(0);

  useEffect(() => {
    const socket = new WebSocket(target.current());
    ref.current = socket;
    update((p) => p + 1);

    return () => {
      if (
        socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING
      )
        socket.close();

      ref.current = null;
    };
  }, []);

  return ref.current;
}
