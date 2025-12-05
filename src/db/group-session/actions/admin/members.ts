import redis from "@/db";
import { getKeys } from "@/db/utils";
import { seed, UserRepresentation } from "@/lib/group-session";
import { paths } from "../..";
import {
  ActionErrorMessage,
  ActionStatus,
  type BaseActionFailure,
  type BaseActionSuccess,
} from "../types";

const GROUP_MEMBER_SCAN_COUNT = Math.floor(seed.MAX_PARTS * 0.7) * 1.5;

export type GroupMembersClearErrorMessage = ActionErrorMessage.Nonexistent;
export type GroupMembersClearResult =
  | BaseActionSuccess
  | BaseActionFailure<GroupMembersClearErrorMessage>;

export type GroupClearAllMembersResult = BaseActionSuccess;

export async function clearGroupMembers({
  hostId,
  code,
  groupName,
}: {
  hostId: string;
  code: string;
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
}: {
  hostId: string;
  code: string;
}): Promise<GroupClearAllMembersResult> {
  const [memberKeys, userGroupKeys] = await Promise.all([
    getKeys(
      paths.patterns.allGroupMembers(hostId, code),
      GROUP_MEMBER_SCAN_COUNT,
    ),
    getKeys(
      paths.patterns.allUserGroups(hostId, code),
      GROUP_MEMBER_SCAN_COUNT,
    ),
  ]);

  const keys = [...memberKeys, ...userGroupKeys];

  if (keys.length) await redis.del(keys);

  return { status: ActionStatus.Success };
}
