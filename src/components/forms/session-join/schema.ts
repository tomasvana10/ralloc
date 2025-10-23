import { SESSION_CODE_LENGTH } from "@/lib/constants";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import z from "zod";

export const sessionJoinSchema = z.object({
  code: z
    .string()
    .length(
      SESSION_CODE_LENGTH,
      `Code must be ${SESSION_CODE_LENGTH} characters`
    )
    .regex(
      new RegExp(REGEXP_ONLY_DIGITS_AND_CHARS),
      "Code must be alphanumeric"
    ),
});

export type SessionJoinSchemaType = z.infer<typeof sessionJoinSchema>;
