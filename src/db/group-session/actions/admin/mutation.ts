import redis, { REDIS } from "@/db";
import { getLuaScriptSha, loadLuaScript } from "@/db/lua-script";
import {
  MAX_GROUPS,
  MIN_GROUPS,
  UserRepresentation,
} from "@/lib/group-session";
import { type GroupSessionData, paths } from "../..";
import {
  type ActionErrorMessage,
  ActionStatus,
  type BaseActionFailure,
  type BaseActionSuccess,
} from "../types";

function _parseScriptResult(result: string[]) {
  const status = result[0] as ActionStatus.Success | ActionStatus.Failure;
  const message = result[1];

  return { status, message };
}

export type GroupMutationErrorMessage =
  | ActionErrorMessage.Existent
  | ActionErrorMessage.Nonexistent
  | ActionErrorMessage.MaximumGroupsReached
  | ActionErrorMessage.MinimumGroupsReached;
export type GroupMutationResult =
  | BaseActionSuccess
  | BaseActionFailure<GroupMutationErrorMessage>;

async function _mutateGroup(
  scriptSha: string,
  keys: string[],
  argv?: string[],
): Promise<GroupMutationResult> {
  const result = (await redis.evalSha(scriptSha, {
    keys: keys,
    arguments: argv,
  })) as string[];

  const { status, message } = _parseScriptResult(result);

  return status === ActionStatus.Failure
    ? {
        status,
        message: message as GroupMutationErrorMessage,
      }
    : { status };
}

const addGroupScript = await loadLuaScript("add-group");
export async function addGroup({
  hostId,
  code,
  groupName,
}: Pick<GroupSessionData, "hostId" | "code"> & {
  groupName: string;
}) {
  return await _mutateGroup(
    await getLuaScriptSha(addGroupScript),
    [
      paths.metadata(hostId, code),
      paths.groupMetadata(hostId, code, groupName),
    ],
    ["groupCount", MAX_GROUPS.toString()],
  );
}

const removeGroupScript = await loadLuaScript("remove-group");
export async function removeGroup({
  hostId,
  code,
  groupName,
}: Pick<GroupSessionData, "hostId" | "code"> & {
  groupName: string;
}): Promise<GroupMutationResult> {
  return await _mutateGroup(
    await getLuaScriptSha(removeGroupScript),
    [
      paths.metadata(hostId, code),
      paths.groupMetadata(hostId, code, groupName),
      paths.groupMembers(hostId, code, groupName),
    ],
    [
      "groupCount",
      MIN_GROUPS.toString(),
      paths.userGroupTemplate(hostId, code),
      UserRepresentation.UNIT_SEPARATOR,
      REDIS.SEP,
    ],
  );
}
