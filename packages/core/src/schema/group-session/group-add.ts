import { groupName } from "@core/lib/group-session/group-seed";
import z from "zod";

export const sessionGroupAddSchema = z.object({
  groupName,
});

export type SessionGroupAddSchema = z.infer<typeof sessionGroupAddSchema>;
