import z from "zod";

export const ephemeralSignInSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(5, "Nickname must be at least 5 characters")
    .max(40, "Nickname must be at most 40 characters"),
});

export type EphemeralSignInSchemaType = z.infer<typeof ephemeralSignInSchema>;
