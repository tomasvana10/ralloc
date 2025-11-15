import { z } from "zod";
import { GroupSeed } from "../seed";

export namespace GroupSessionC2S {
  export const code = z.enum(["JoinGroup", "LeaveGroup"]);
  export type Code = z.infer<typeof code>;

  /**
   * Payload to join a group
   */
  export const JoinGroupPayload = z.object({
    code: z.literal(code.enum.JoinGroup),
    groupName: z.string().min(1).max(GroupSeed.MAX_PART_LENGTH),
  });

  /**
   * Payload to leave a group
   */
  export const LeaveGroupPayload = z.object({
    code: z.literal(code.enum.LeaveGroup),
  });

  export const payload = z.discriminatedUnion("code", [
    JoinGroupPayload,
    LeaveGroupPayload,
  ]);
  export type Payload = z.infer<typeof payload>;
}
