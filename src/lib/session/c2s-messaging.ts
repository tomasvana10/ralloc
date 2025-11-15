import { z } from "zod";
import { GroupSeed } from "../seed";

export const GroupSessionC2SCode = z.enum(["JoinGroup", "LeaveGroup"]);
export type GroupSessionC2SCode = z.infer<typeof GroupSessionC2SCode>;

/**
 * Payload to join a group
 */
export const GroupSessionC2SJoinGroupPayload = z.object({
  code: z.literal(GroupSessionC2SCode.enum.JoinGroup),
  groupName: z.string().min(1).max(GroupSeed.MAX_PART_LENGTH),
});

/**
 * Payload to leave a group
 */
export const GroupSessionC2SLeaveGroupPayload = z.object({
  code: z.literal(GroupSessionC2SCode.enum.LeaveGroup),
});

export const GroupSessionC2SPayload = z.discriminatedUnion("code", [
  GroupSessionC2SJoinGroupPayload,
  GroupSessionC2SLeaveGroupPayload,
]);
export type GroupSessionC2SPayload = z.infer<typeof GroupSessionC2SPayload>;
