import { expandGroupSeed, GROUP_SEED } from "@core/lib/group-session";
import { ExpansionResultIssue } from "@core/lib/group-session/group-seed";
import z from "zod";

export const sessionCreateSchema = z.object({
  groupSeed: z
    .string()
    .trim()
    .min(5, "Seed must be at least 5 characters")
    .max(250, "Seed must be at most 250 characters")
    .superRefine((val, ctx) => {
      const result = expandGroupSeed(val);
      if (result.issue === undefined) return;

      switch (result.issue) {
        case ExpansionResultIssue.InvalidRange:
          return ctx.addIssue({
            code: "custom",
            message: "Seed has invalid ranges",
          });
        case ExpansionResultIssue.TooBig:
          return ctx.addIssue({
            code: "too_big",
            maximum: GROUP_SEED.MAX_PARTS,
            origin: "array",
            message: "Seed expansion yields too many values",
          });
        case ExpansionResultIssue.TooBigPart:
          return ctx.addIssue({
            code: "too_big",
            maximum: GROUP_SEED.MAX_PARTS,
            origin: "array",
            message: "One or more parts are too long",
          });
        case ExpansionResultIssue.TooShort:
          return ctx.addIssue({
            code: "too_small",
            minimum: GROUP_SEED.MIN_PARTS,
            origin: "array",
            message: "Seed expansion yields too little values",
          });
        case ExpansionResultIssue.TooManyCharRanges:
          return ctx.addIssue({
            code: "custom",
            message: "You provided too many character ranges for a seed part",
          });
        case ExpansionResultIssue.TooManyNumRanges:
          return ctx.addIssue({
            code: "custom",
            message: "You provided too many numerical ranges for a seed part",
          });
        case ExpansionResultIssue.DuplicateValues:
          return ctx.addIssue({
            code: "custom",
            message: "Seed expansion yields one or more duplicate values",
          });
      }
    }),
  groupSize: z.coerce
    .number()
    .int()
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

export type SessionCreateSchema = z.infer<typeof sessionCreateSchema>;
