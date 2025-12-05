import { UserRepresentation } from "@/lib/group-session";
import redis from "../..";
import { getLuaScriptSha, loadLuaScript } from "../../lua-script";
import { paths } from "..";
import {
  type ActionErrorMessage,
  ActionStatus,
  type BaseActionFailure,
  type BaseActionSuccess,
} from "./types";

function parseScriptResult(result: string[]) {
  const status = result[0] as ActionStatus.Success | ActionStatus.Failure;
  const message = result[1];
  const originalGroupName = result[2] || undefined;
  const newGroupName = result[3] || undefined;

  return { status, message, originalGroupName, newGroupName };
}

type BaseGroupResult<
  Original extends string | null,
  New extends string | null,
> = {
  originalGroupName: Original;
  newGroupName: New;
};

type BaseGroupMembershipErrorMessage = ActionErrorMessage.Frozen;

export type GroupJoinErrorMessage =
  | BaseGroupMembershipErrorMessage
  | ActionErrorMessage.Full
  | ActionErrorMessage.AlreadyAllocated
  | ActionErrorMessage.Nonexistent;
export type GroupJoinSuccess = BaseActionSuccess &
  BaseGroupResult<null, string>;
export type GroupJoinFailure = BaseActionFailure<GroupJoinErrorMessage> &
  BaseGroupResult<string | null, string | null>;

export type GroupLeaveErrorMessage =
  | BaseGroupMembershipErrorMessage
  | ActionErrorMessage.NotInGroup;
export type GroupLeaveSuccess = BaseActionSuccess &
  BaseGroupResult<string, null>;
export type GroupLeaveFailure = BaseActionFailure<GroupLeaveErrorMessage> &
  BaseGroupResult<string | null, string | null>;

const joinGroupScript = await loadLuaScript("join-group");
export async function joinGroup({
  code,
  hostId,
  groupName,
  userId,
  compressedUser,
  groupSize,
  frozen,
}: {
  code: string;
  hostId: string;
  groupName: string;
  userId: string;
  compressedUser: string;
  groupSize: number;
  frozen: boolean;
}): Promise<GroupJoinSuccess | GroupJoinFailure> {
  const membersKey = paths.groupMembers(hostId, code, groupName);
  const userGroupKey = paths.userGroup(hostId, code, userId);
  const groupMetadataKey = paths.groupMetadata(hostId, code, groupName);

  const sha = await getLuaScriptSha(joinGroupScript);

  const result = (await redis.evalSha(sha, {
    keys: [membersKey, userGroupKey, groupMetadataKey],
    arguments: [
      compressedUser,
      groupSize.toString(),
      groupName,
      (+frozen).toString(),
    ],
  })) as string[];

  const { status, message, newGroupName, originalGroupName } =
    parseScriptResult(result);

  return status === ActionStatus.Success
    ? {
        status,
        newGroupName: newGroupName as string,
        originalGroupName: null,
      }
    : {
        status,
        message: message as GroupJoinErrorMessage,
        newGroupName: newGroupName ?? null,
        originalGroupName: originalGroupName ?? null,
      };
}

const leaveGroupScript = await loadLuaScript("leave-group");
export async function leaveGroup({
  code,
  hostId,
  userId,
  frozen,
}: {
  code: string;
  hostId: string;
  userId: string;
  frozen: boolean;
}): Promise<GroupLeaveSuccess | GroupLeaveFailure> {
  const userGroupKey = paths.userGroup(hostId, code, userId);

  const sha = await getLuaScriptSha(leaveGroupScript);
  const result = (await redis.evalSha(sha, {
    keys: [userGroupKey],
    arguments: [
      userId + UserRepresentation.UNIT_SEPARATOR,
      paths.groupMembers(hostId, code, "<groupName>"),
      (+frozen).toString(),
    ],
  })) as string[];

  const { status, message, newGroupName, originalGroupName } =
    parseScriptResult(result);

  return status === ActionStatus.Success
    ? {
        status,
        newGroupName: null,
        originalGroupName: originalGroupName as string,
      }
    : {
        status,
        message: message as GroupLeaveErrorMessage,
        newGroupName: newGroupName ?? null,
        originalGroupName: originalGroupName ?? null,
      };
}
