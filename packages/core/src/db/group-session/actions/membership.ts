import { UserRepresentation } from "@core/lib/group-session";
import redis from "../..";
import { getLuaScriptSha, loadLuaScript } from "../../lua-script";
import { type GroupSessionData, paths } from "..";
import {
  type ActionErrorMessage,
  ActionStatus,
  type BaseActionFailure,
  type BaseActionSuccess,
} from "./types";

function _parseScriptResult(result: string[]) {
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

type GroupJoinErrorMessage =
  | BaseGroupMembershipErrorMessage
  | ActionErrorMessage.Full
  | ActionErrorMessage.AlreadyAllocated
  | ActionErrorMessage.Nonexistent;
type GroupJoinSuccess = BaseActionSuccess & BaseGroupResult<null, string>;
type GroupJoinFailure = BaseActionFailure<GroupJoinErrorMessage> &
  BaseGroupResult<string | null, string | null>;

type GroupLeaveErrorMessage =
  | BaseGroupMembershipErrorMessage
  | ActionErrorMessage.NotInGroup;
type GroupLeaveSuccess = BaseActionSuccess & BaseGroupResult<string, null>;
type GroupLeaveFailure = BaseActionFailure<GroupLeaveErrorMessage> &
  BaseGroupResult<string | null, string | null>;

export type GroupMembershipErrorMessage =
  | GroupJoinErrorMessage
  | GroupLeaveErrorMessage;

const joinGroupScript = await loadLuaScript("join-group");
export async function joinGroup({
  code,
  hostId,
  groupName,
  userId,
  compressedUser,
  groupSize,
  frozen,
}: Pick<GroupSessionData, "code" | "hostId" | "groupSize" | "frozen"> & {
  groupName: string;
  userId: string;
  compressedUser: string;
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
    _parseScriptResult(result);

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
}: Pick<GroupSessionData, "code" | "hostId" | "frozen"> & {
  userId: string;
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
    _parseScriptResult(result);

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
