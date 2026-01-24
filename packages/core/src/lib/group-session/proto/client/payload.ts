import z from "zod";
import { groupName } from "../../group-seed";
import { code } from "./code";

export const ID_BYTES = 9;
export const ID_LENGTH = (ID_BYTES / 3) * 4;

const _compressedUser = z.string().min(1);
const _id = z.base64().length(ID_LENGTH);

export const updateGroupMembership = z.discriminatedUnion("code", [
  z.object({
    code: z.literal(code.enum.JoinGroup),
    id: _id,
    compressedUser: _compressedUser,
    groupName,
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
  groupName,
});
export type MutateGroup = z.infer<typeof mutateGroup>;

export const clearGroupMembers = z.discriminatedUnion("code", [
  z.object({
    code: z.literal(code.enum.ClearGroupMembers),
    id: _id,
    groupName,
  }),
  z.object({
    code: z.literal(code.enum.ClearAllGroupMembers),
    id: _id,
  }),
]);
export type ClearGroupMembers = z.infer<typeof clearGroupMembers>;

export const payload = z.discriminatedUnion("code", [
  updateGroupMembership,
  mutateGroup,
  clearGroupMembers,
]);
export type PayloadType = z.infer<typeof payload>;
