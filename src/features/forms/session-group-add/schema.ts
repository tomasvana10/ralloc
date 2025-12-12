import z from "zod";
import { groupName } from "@/lib/group-session/group-seed";

export const sessionGroupAddSchema = z.object({
  groupName,
});

export type SessionGroupAddSchemaType = z.infer<typeof sessionGroupAddSchema>;
