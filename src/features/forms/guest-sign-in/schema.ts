import z from "zod";

export const guestSignInSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(5, "Nickname must be at least 5 characters")
    .max(40, "Nickname must be at most 40 characters"),
});

export type GuestSIgnInSchemaType = z.infer<typeof guestSignInSchema>;
