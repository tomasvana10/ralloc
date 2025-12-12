import type { GroupSessionData } from "@/db/group-session";
import { ActionErrorMessage } from "@/db/group-session/actions/types";
import { UserRepresentation } from "@/lib/group-session";

export function getErrorMessage(error: ActionErrorMessage) {
  switch (error) {
    case ActionErrorMessage.AlreadyAllocated:
      return "You're already allocated to a group.";
    case ActionErrorMessage.Frozen:
      return "The group session is locked.";
    case ActionErrorMessage.Full:
      return "This group is full.";
    case ActionErrorMessage.Nonexistent:
      return "This group doesn't exist.";
    case ActionErrorMessage.NotInGroup:
      return "You aren't in this group.";
    case ActionErrorMessage.Existent:
      return "This group already exists.";
    case ActionErrorMessage.MaximumGroupsReached:
      return "You can't add any more groups.";
    case ActionErrorMessage.MinimumGroupsReached:
      return "You can't remove any more groups.";
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
