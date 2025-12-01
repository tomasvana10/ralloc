import { z } from "zod";
import { seed } from "@/lib/group-session";

/**
 * Client library for a group session websockets
 */
export namespace GSClient {
  const _codes = {
    JoinGroup: "Join",
    LeaveGroup: "Leave",
  } as const;
  export const code = z.enum(_codes);
  export type Code = z.infer<typeof code>;

  export namespace Payloads {
    export const joinGroup = z.object({
      code: z.literal(code.enum.JoinGroup),
      groupName: z.string().min(1).max(seed.MAX_PART_LENGTH),
      compressedUser: z.string().min(1),
    });
    export type JoinGroup = z.infer<typeof joinGroup>;

    export const leaveGroup = z.object({
      code: z.literal(code.enum.LeaveGroup),
      compressedUser: z.string().min(1),
    });
    export type LeaveGroup = z.infer<typeof leaveGroup>;
  }

  export const payload = z.discriminatedUnion("code", [
    Payloads.joinGroup,
    Payloads.leaveGroup,
  ]);
  export type Payload = z.infer<typeof payload>;
}
