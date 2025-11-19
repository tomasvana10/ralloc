import type { GroupSessionS2C } from "@/lib/group-session/messaging";

export function getFullGroupUpdateErrorMessage(
  error: Extract<
    GroupSessionS2C.Payloads.GroupUpdateStatus,
    { ok: 0 }
  >["error"],
) {
  switch (error) {
    case "alreadyAllocated":
      return "You are already allocated to this group";
    case "frozen":
      return "This group is locked";
    case "full":
      return "This group is full";
    case "nonexistent":
      return "This group doesn't exist";
    case "notInGroup":
      return "You are not in this group";
  }
}

export function canSend(ws: WebSocket | null): ws is WebSocket {
  return !!ws && ws.readyState === ws.OPEN;
}
