import { z } from "zod";

export const createRallocSessionSchema = z.object({
  groupSeed: z.string().min(1).max(500),
  groupSize: z.number().min(1).max(100),
  name: z.string().min(5).max(50),
  description: z.string().min(5).max(500)
});
