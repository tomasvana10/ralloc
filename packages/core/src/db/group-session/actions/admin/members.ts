import redis from "@core/db";
import { getKeys } from "@core/db/utils";
import { UserRepresentation } from "@core/lib/group-session";
import { type GroupSessionData, paths, patterns } from "../..";
import {
  ActionErrorMessage,
  ActionStatus,
  type BaseActionFailure,
  type BaseActionSuccess,
} from "../types";

export type GroupMembersClearErrorMessage = ActionErrorMessage.Nonexistent;
export type GroupMembersClearResult =
  | BaseActionSuccess
  | BaseActionFailure<GroupMembersClearErrorMessage>;

export type GroupClearAllMembersResult = BaseActionSuccess;

export async function clearGroupMembers({
  hostId,
  code,
  groupName,
}: Pick<GroupSessionData, "hostId" | "code"> & {
  groupName: string;
}): Promise<GroupMembersClearResult> {
  const groupMembersKey = paths.groupMembers(hostId, code, groupName);
  if (!(await redis.exists(paths.groupMetadata(hostId, code, groupName))))
    return {
      status: ActionStatus.Failure,
      message: ActionErrorMessage.Nonexistent,
    };

  const members = (await redis.sMembers(groupMembersKey)) as string[];

  const keys = [
    groupMembersKey,
    ...members.map((member) => {
      const userId = member.split(UserRepresentation.UNIT_SEPARATOR)[0];
      return paths.userGroup(hostId, code, userId);
    }),
  ];

  await redis.del(keys);
  return {
    status: ActionStatus.Success,
  };
}

export async function clearAllGroupMembers({
  hostId,
  code,
}: Pick<
  GroupSessionData,
  "hostId" | "code"
>): Promise<GroupClearAllMembersResult> {
  const [memberKeys, userGroupKeys] = await Promise.all([
    getKeys(patterns.allGroupMembers(hostId, code)),
    getKeys(patterns.allUserGroups(hostId, code)),
  ]);

  const keys = [...memberKeys, ...userGroupKeys];

  if (keys.length) await redis.del(keys);

  return { status: ActionStatus.Success };
}
