import redis, { REDIS } from "@/db";
import { getLuaScriptSha, loadLuaScript } from "@/db/lua-script";
import { UserRepresentation } from "@/lib/group-session";
import { paths } from "../..";
import type {
  ActionErrorMessage,
  ActionStatus,
  BaseActionFailure,
  BaseActionSuccess,
} from "../types";

function parseScriptResult(result: string[]) {
  const status = result[0] as ActionStatus.Success | ActionStatus.Failure;
  const message = result[1];

  return { status, message };
}

export type GroupMutationErrorMessage =
  | ActionErrorMessage.Existent
  | ActionErrorMessage.Nonexistent;
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

  const { status, message } = parseScriptResult(result);

  return status === "failure"
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
}: {
  hostId: string;
  code: string;
  groupName: string;
}) {
  return await _mutateGroup(await getLuaScriptSha(addGroupScript), [
    paths.groupMetadata(hostId, code, groupName),
  ]);
}

const removeGroupScript = await loadLuaScript("remove-group");
export async function removeGroup({
  hostId,
  code,
  groupName,
}: {
  hostId: string;
  code: string;
  groupName: string;
}): Promise<GroupMutationResult> {
  return await _mutateGroup(
    await getLuaScriptSha(removeGroupScript),
    [
      paths.groupMetadata(hostId, code, groupName),
      paths.groupMembers(hostId, code, groupName),
    ],
    [
      paths.userGroupTemplate(hostId, code),
      UserRepresentation.UNIT_SEPARATOR,
      REDIS.SEP,
    ],
  );
}
