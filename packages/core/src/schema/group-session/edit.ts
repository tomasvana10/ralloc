import type z from "zod";
import { sessionCreateSchema } from "./create";

export const baseSessionEditSchema = sessionCreateSchema.pick({
  name: true,
  description: true,
  groupSize: true,
  frozen: true,
});

export const sessionEditSchemaFactory = (
  currentGroupSize: number,
  forServerSideValidation = false,
) => {
  const schema = forServerSideValidation
    ? baseSessionEditSchema.partial().strict()
    : baseSessionEditSchema;
  return schema.refine(
    (data) => {
      if (data.groupSize === undefined) return true;
      return data.groupSize >= currentGroupSize;
    },
    {
      message: "You can't decrease the group size below its current value.",
      path: ["groupSize"],
    },
  );
};

export type SessionEditSchema = z.infer<typeof baseSessionEditSchema>;
