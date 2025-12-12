import { randomBytes } from "node:crypto";
import { z } from "zod";
import { seed } from "@/lib/group-session";

/**
 * Client library for a group session websockets
 */
export namespace GSClient {
  const _codes = {
    JoinGroup: "Join",
    LeaveGroup: "Leave",
    AddGroup: "AddGroup",
    RemoveGroup: "RemGroup",
    ClearGroupMembers: "ClearGroupMem",
    ClearAllGroupMembers: "ClearAllGroupMem",
  } as const;
  export const code = z.enum(_codes);
  export type CodeEnumType = typeof code.enum;
  export const Code = code.enum;
  export type Code = z.infer<typeof code>;

  export const PAYLOAD_ID_BYTES = 9;
  export const PAYLOAD_ID_LENGTH = (PAYLOAD_ID_BYTES / 3) * 4;

  export namespace Payloads {
    const _groupName = z.string().min(1).max(seed.MAX_PART_LENGTH);
    const _compressedUser = z.string().min(1);
    const _id = z.base64().length(GSClient.PAYLOAD_ID_LENGTH);

    export const updateGroupMembership = z.discriminatedUnion("code", [
      z.object({
        code: z.literal(code.enum.JoinGroup),
        id: _id,
        compressedUser: _compressedUser,
        groupName: _groupName,
      }),
      z.object({
        code: z.literal(code.enum.LeaveGroup),
        id: _id,
        compressedUser: _compressedUser,
      }),
    ]);
    export type UpdateGroupMembership = z.infer<typeof updateGroupMembership>;

    // note: discriminate if i add group metadata
    export const mutateGroup = z.object({
      code: z.union([
        z.literal(code.enum.AddGroup),
        z.literal(code.enum.RemoveGroup),
      ]),
      id: _id,
      groupName: _groupName,
    });
    export type MutateGroup = z.infer<typeof mutateGroup>;

    export const clearGroupMembers = z.discriminatedUnion("code", [
      z.object({
        code: z.literal(code.enum.ClearGroupMembers),
        id: _id,
        groupName: _groupName,
      }),
      z.object({
        code: z.literal(code.enum.ClearAllGroupMembers),
        id: _id,
      }),
    ]);
    export type ClearGroupMembers = z.infer<typeof clearGroupMembers>;
  }

  export const payload = z.discriminatedUnion("code", [
    Payloads.updateGroupMembership,
    Payloads.mutateGroup,
    Payloads.clearGroupMembers,
  ]);
  export type Payload = z.infer<typeof payload>;

  export const createPayloadId = () =>
    randomBytes(PAYLOAD_ID_BYTES).toString("base64");
}
