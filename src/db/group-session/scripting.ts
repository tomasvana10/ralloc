import { UserRepresentation } from "@/lib/group-session/user-representation";
import { getLuaScriptSha, loadLuaScript } from "../lua-script";
import redis from "../redis";
import { paths } from ".";

type GroupResultStatus = "success" | "failure";
type BaseGroupResultError = "frozen";

const joinGroupScript = await loadLuaScript("join-group", "group-session");
export interface JoinGroupResult {
  error?: BaseGroupResultError | "full" | "alreadyAllocated" | "nonexistent";
}

export async function joinGroup(
  code: string,
  hostId: string,
  groupName: string,
  userId: string,
  userRepresentation: string,
  groupSize: number,
  frozen: boolean,
): Promise<JoinGroupResult> {
  if (frozen)
    return {
      error: "frozen",
    };

  const membersKey = paths.groupMembers(hostId, code, groupName);
  const userGroupKey = paths.userGroup(hostId, code, userId);
  const groupMetadataKey = paths.groupMetadata(hostId, code, groupName);

  const sha = await getLuaScriptSha(joinGroupScript);

  const result = (await redis.evalSha(sha, {
    keys: [membersKey, userGroupKey, groupMetadataKey],
    arguments: [userRepresentation, groupSize.toString(), groupName],
  })) as string[];

  const status: GroupResultStatus = result[0] as GroupResultStatus;
  const message: string = result[1];

  return {
    error:
      status === "failure" ? (message as JoinGroupResult["error"]) : undefined,
  };
}

const leaveGroupScript = await loadLuaScript("leave-group", "group-session");
export interface LeaveGroupResult {
  groupName?: string;
  error?: BaseGroupResultError | "notInGroup";
}

export async function leaveGroup(
  code: string,
  hostId: string,
  userId: string,
  frozen: boolean,
): Promise<LeaveGroupResult> {
  if (frozen)
    return {
      error: "frozen",
    };

  const userGroupKey = paths.userGroup(hostId, code, userId);

  const sha = await getLuaScriptSha(leaveGroupScript);
  const result = (await redis.evalSha(sha, {
    keys: [userGroupKey],
    arguments: [
      userId + UserRepresentation.UNIT_SEPARATOR,
      paths.groupMembers(hostId, code, "<groupName>"),
    ],
  })) as string[];

  const status: GroupResultStatus = result[0] as GroupResultStatus;
  const message: string = result[1];

  return {
    groupName: status === "success" ? message : undefined,
    error:
      status === "failure" ? (message as LeaveGroupResult["error"]) : undefined,
  };
}
