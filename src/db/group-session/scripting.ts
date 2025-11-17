import { UserRepresentation } from "@/lib/group-session/user-representation";
import { getLuaScriptSha, loadLuaScript } from "../lua-script";
import redis from "../redis";
import { paths } from ".";

type BaseGroupResult = "success" | "failure";

const joinGroupScript = await loadLuaScript("join-group.lua", "group-session");
export interface JoinGroupResult {
  error?: "full" | "alreadyAllocated" | "nonexistent";
}

export async function joinGroup(
  code: string,
  hostId: string,
  groupName: string,
  userId: string,
  userRepresentation: string,
  groupSize: number,
): Promise<JoinGroupResult> {
  const membersKey = paths.groupMembers(hostId, code, groupName);
  const userGroupKey = paths.userGroup(hostId, code, userId);
  const groupMetadataKey = paths.groupMetadata(hostId, code, groupName);

  const sha = await getLuaScriptSha(joinGroupScript);

  const result = (await redis.evalSha(sha, {
    keys: [membersKey, userGroupKey, groupMetadataKey],
    arguments: [userRepresentation, groupSize.toString(), groupName],
  })) as string[];

  const status: BaseGroupResult = result[0] as BaseGroupResult;
  const message: string = result[1];

  return {
    error:
      status === "failure" ? (message as JoinGroupResult["error"]) : undefined,
  };
}

const leaveGroupScript = await loadLuaScript(
  "leave-group.lua",
  "group-session",
);
export interface LeaveGroupResult {
  groupName?: string;
  error?: "notInGroup";
}

export async function leaveGroup(
  code: string,
  hostId: string,
  userId: string,
): Promise<LeaveGroupResult> {
  const userGroupKey = paths.userGroup(hostId, code, userId);

  const sha = await getLuaScriptSha(leaveGroupScript);

  const result = (await redis.evalSha(sha, {
    keys: [userGroupKey],
    arguments: [
      userId + UserRepresentation.UNIT_SEPARATOR,
      paths.groupMembers(hostId, code, "<groupName>"),
    ],
  })) as string[];

  const status: BaseGroupResult = result[0] as BaseGroupResult;
  const message: string = result[1];

  return {
    groupName: status === "success" ? message : undefined,
    error:
      status === "failure" ? (message as LeaveGroupResult["error"]) : undefined,
  };
}
