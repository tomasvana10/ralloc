import { UserRepresentation } from "@/lib/group-session";
import { getLuaScriptSha, loadLuaScript } from "../lua-script";
import redis from "../redis";
import { paths } from ".";

function parseScriptResult(result: string[]) {
  const status = result[0] as "failure" | "success";
  const message = result[1];
  const originalGroupName = result[2] || undefined;
  const newGroupName = result[3] || undefined;

  return { status, message, originalGroupName, newGroupName };
}

type BaseGroupResultErrorMessage = "frozen";

type BaseGroupResult = {
  originalGroupName: string | null;
  newGroupName: string | null;
};

export type GroupResult =
  | ({
      status: "success";
    } & BaseGroupResult)
  | ({
      status: "joinFailure";
      message:
        | BaseGroupResultErrorMessage
        | "full"
        | "alreadyAllocated"
        | "nonexistent";
    } & BaseGroupResult)
  | ({
      status: "leaveFailure";
      message: BaseGroupResultErrorMessage | "notInGroup";
    } & BaseGroupResult);

export type JoinGroupError = Extract<
  GroupResult,
  { status: "joinFailure" }
>["message"];
export type LeaveGroupError = Extract<
  GroupResult,
  { status: "leaveFailure" }
>["message"];

const joinGroupScript = await loadLuaScript("join-group");

export async function joinGroup(
  code: string,
  hostId: string,
  groupName: string,
  userId: string,
  compressedUser: string,
  groupSize: number,
  frozen: boolean,
): Promise<Extract<GroupResult, { status: "success" | "joinFailure" }>> {
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

  const shared = {
    newGroupName: newGroupName || null,
    originalGroupName: originalGroupName || null,
  };

  if (status === "failure")
    return {
      status: "joinFailure",
      message: message as Extract<
        GroupResult,
        { status: "joinFailure" }
      >["message"],
      ...shared,
    };

  return {
    status: "success",
    ...shared,
  };
}

const leaveGroupScript = await loadLuaScript("leave-group");

export async function leaveGroup(
  code: string,
  hostId: string,
  userId: string,
  frozen: boolean,
): Promise<Extract<GroupResult, { status: "success" | "leaveFailure" }>> {
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

  const shared = {
    newGroupName: newGroupName || null,
    originalGroupName: originalGroupName || null,
  };

  if (status === "failure")
    return {
      status: "leaveFailure",
      message: message as Extract<
        GroupResult,
        { status: "leaveFailure" }
      >["message"],
      ...shared,
    };

  return {
    status: "success",
    ...shared,
  };
}
