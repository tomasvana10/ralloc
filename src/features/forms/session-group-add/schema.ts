import z from "zod";
import { GROUP_SEED } from "@/lib/group-session";

export const sessionGroupAddSchema = z.object({
  groupName: z.string().min(1).max(GROUP_SEED.MAX_PART_LENGTH),
});

export type SessionGroupAddSchemaType = z.infer<typeof sessionGroupAddSchema>;
