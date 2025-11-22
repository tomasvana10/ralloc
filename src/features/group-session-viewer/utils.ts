import type { GroupSessionData } from "@/db/group-session";
import { UserRepresentation } from "@/lib/group-session";
import type { GroupSessionS2C } from "@/lib/group-session/messaging";

export function getFullGroupUpdateErrorMessage(
  error: Extract<
    GroupSessionS2C.Payloads.GroupUpdateStatus,
    { ok: 0 }
  >["error"],
) {
  switch (error) {
    case "alreadyAllocated":
      return "You are already allocated a group";
    case "frozen":
      return "The group session is locked";
    case "full":
      return "This group is full";
    case "nonexistent":
      return "This group doesn't exist";
    case "notInGroup":
      return "You are not in this group";
  }
}

export function findCurrentGroup(
  data: GroupSessionData,
  compressedUser: string,
) {
  return (
    data.groups.find((group) =>
      group.members.some((member) =>
        UserRepresentation.areSameCompressedUser(compressedUser, member),
      ),
    ) ?? null
  );
}
