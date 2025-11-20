import { z } from "zod";
import { seed } from "@/lib/seed";

/**
 * Client-to-server protocol library for a group session websockets
 */
export namespace GroupSessionC2S {
  const _codes = {
    JoinGroup: "J",
    LeaveGroup: "L",
  } as const;
  export const code = z.enum(_codes);
  export type Code = z.infer<typeof code>;

  export namespace Payloads {
    export const joinGroup = z.object({
      code: z.literal(code.enum.JoinGroup),
      groupName: z.string().min(1).max(seed.MAX_PART_LENGTH),
    });
    export type JoinGroup = z.infer<typeof joinGroup>;

    export const leaveGroup = z.object({
      code: z.literal(code.enum.LeaveGroup),
    });
    export type LeaveGroup = z.infer<typeof leaveGroup>;
  }

  export const payload = z.discriminatedUnion("code", [
    Payloads.joinGroup,
    Payloads.leaveGroup,
  ]);
  export type Payload = z.infer<typeof payload>;
}
