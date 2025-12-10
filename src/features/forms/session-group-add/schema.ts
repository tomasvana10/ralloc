import z from "zod";
import { seed } from "@/lib/group-session";

export const sessionGroupAddSchema = z.object({
  groupName: z.string().min(1).max(seed.MAX_PART_LENGTH),
});

export type SessionGroupAddSchemaType = z.infer<typeof sessionGroupAddSchema>;
