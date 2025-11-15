import { z } from "zod";
import { GroupSeed } from "../seed";

export const GroupSessionC2SCode = z.enum(["JoinGroup", "LeaveGroup"]);
export type GroupSessionC2SCode = z.infer<typeof GroupSessionC2SCode>;

export const GroupSessionC2SJoinGroupPayload = z.object({
  type: z.literal(GroupSessionC2SCode.enum.JoinGroup),
  groupName: z.string().min(1).max(GroupSeed.MAX_PART_LENGTH),
});

export const GroupSessionC2SLeaveGroupPayload = z.object({
  type: z.literal(GroupSessionC2SCode.enum.LeaveGroup),
});

export const GroupSessionC2SPayload = z.discriminatedUnion("type", [
  GroupSessionC2SJoinGroupPayload,
  GroupSessionC2SLeaveGroupPayload,
]);
export type GroupSessionC2SPayload = z.infer<typeof GroupSessionC2SPayload>;
