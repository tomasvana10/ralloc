import z from "zod";

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
