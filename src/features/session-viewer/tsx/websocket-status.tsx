import { CheckIcon, XIcon } from "lucide-react";
import { ReadyState } from "react-use-websocket-lite";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

const statusData: Record<
  ReadyState,
  [
    string,
    React.ComponentType,
    "default" | "outline" | "secondary" | "destructive",
  ]
> = {
  [ReadyState.UNINSTANTIATED]: ["Uninstantiated", XIcon, "outline"],
  [ReadyState.CONNECTING]: ["Connecting", Spinner, "outline"],
  [ReadyState.OPEN]: ["Connected", CheckIcon, "outline"],
  [ReadyState.CLOSING]: ["Closing", Spinner, "outline"],
  [ReadyState.CLOSED]: ["Closed", XIcon, "destructive"],
};

export function WebSocketStatus({ readyState }: { readyState: ReadyState }) {
  const [text, Prefix, variant] = statusData[readyState];

  return (
    <Badge variant={variant}>
      <Prefix />
      {text}
    </Badge>
  );
}
