import z from "zod";
import { groupName } from "@/lib/group-session/group-seed";

export const sessionGroupAddSchema = z.object({
  groupName,
});

export type SessionGroupAddSchema = z.infer<typeof sessionGroupAddSchema>;
