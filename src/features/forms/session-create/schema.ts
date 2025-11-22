import z from "zod";
import { expand, seed } from "@/lib/group-session";

export const sessionCreateSchema = z.object({
  groupSeed: z
    .string()
    .trim()
    .min(5, "Seed must be at least 5 characters")
    .max(250, "Seed must be at most 250 characters")
    .superRefine((val, ctx) => {
      const result = expand(val);
      if (result.issue === undefined) return;

      switch (result.issue) {
        case "invalid_range":
          return ctx.addIssue({
            code: "custom",
            message: "Seed has invalid ranges",
          });
        case "too_big":
          return ctx.addIssue({
            code: "too_big",
            maximum: seed.MAX_PARTS,
            origin: "array",
            message: "Seed expansion yields too many values",
          });
        case "too_short":
          return ctx.addIssue({
            code: "too_small",
            minimum: seed.MIN_PARTS,
            origin: "array",
            message: "Seed expansion yields too little values",
          });
        case "too_many_char_ranges":
          return ctx.addIssue({
            code: "custom",
            message: "You provided too many character ranges for a seed part",
          });
        case "too_many_num_ranges":
          return ctx.addIssue({
            code: "custom",
            message: "You provided too many numerical ranges for a seed part",
          });
        case "duplicate_values":
          return ctx.addIssue({
            code: "custom",
            message: "Seed expansion yields one or more duplicate values",
          });
      }
    }),
  groupSize: z.coerce
    .number()
    .min(1, "Groups must have at least 1 member")
    .max(100, "Groups must have at most 100 members"),
  name: z
    .string()
    .trim()
    .min(5, "Name must be at least 5 characters")
    .max(50, "Name must be at most 50 characters"),
  description: z
    .string()
    .trim()
    .max(1000, "Description must be at most 1000 characters")
    .refine(
      (val) => !val || val.length >= 10,
      "Description must be at least 10 characters",
    ),
  frozen: z.boolean(),
});

export type SessionCreateSchemaType = z.infer<typeof sessionCreateSchema>;
