import {
  SESSION_CODE_CHARACTERS,
  SESSION_CODE_CHARACTERS_EXCLUDE,
  SESSION_CODE_LENGTH,
} from "@core/lib/group-session";
import z from "zod";

const REGEXP_CODE = new RegExp(`^[${SESSION_CODE_CHARACTERS}]+$`);

export const sessionJoinSchema = z.object({
  code: z
    .string()
    .length(
      SESSION_CODE_LENGTH,
      `Code must be ${SESSION_CODE_LENGTH} characters`,
    )
    .regex(
      REGEXP_CODE,
      `Code must be alphanumeric and lowercased. The characters ${Array.from(
        SESSION_CODE_CHARACTERS_EXCLUDE,
      ).join(", ")} are never used in a code.`,
    ),
});

export type SessionJoinSchema = z.infer<typeof sessionJoinSchema>;
