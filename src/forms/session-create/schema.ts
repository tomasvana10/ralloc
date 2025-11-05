import { Seed } from "@/lib/seed";
import z from "zod";

export const sessionCreateSchema = z.object({
  groupSeed: z
    .string()
    .min(5, "Seed must be at least 5 characters")
    .max(150, "Seed must be at most 150 characters")
    .superRefine((val, ctx) => {
      const result = Seed.expand(val);
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
            maximum: Seed.MAX_PARTS,
            origin: "array",
            message: "Seed expansion yields too many values",
          });
        case "too_short":
          return ctx.addIssue({
            code: "too_small",
            minimum: Seed.MIN_PARTS,
            origin: "array",
            message: `Seed expansion yields too little values`,
          });
        case "too_many_char_ranges":
          return ctx.addIssue({
            code: "custom",
            message: `You provided too many character ranges for a seed part`,
          });
        case "too_many_num_ranges":
          return ctx.addIssue({
            code: "custom",
            message: `You provided too many numerical ranges for a seed part`,
          });
        case "duplicate_values":
          return ctx.addIssue({
            code: "custom",
            message: "Seed expansion yields one or more duplicate values",
          });
      }
    }),
  groupSize: z.coerce.number().min(1, "Groups must have at least 1 member"),
  name: z
    .string()
    .min(5, "Name must be at least 5 characters")
    .max(50, "Name must be at most 50 characters"),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional()
    .refine(
      val => !val || val.length >= 10,
      "Description must be at least 10 characters"
    ),
});

export type SessionCreateSchemaType = z.infer<typeof sessionCreateSchema>;
