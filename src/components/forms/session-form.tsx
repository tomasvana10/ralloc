import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const createSessionSchema = z.object({
  groupSeed: z
    .string()
    .min(5, "Group seed must be at least 5 characters")
    .max(150, "Group seed must be at most 150 characters"),
  groupMembers: z.number().min(1, "Groups must have at least 1 member"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be at most 500 characters")
    .or(z.null()),
});

type CreateSessionSchemaType = z.infer<typeof createSessionSchema>;

export function CreateSessionForm() {
  const form = useForm<CreateSessionSchemaType>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      groupSeed: "",
      groupMembers: 1,
      description: "",
    },
    mode: "onChange",
  });

  function onSubmit(data: CreateSessionSchemaType) {
    console.log(data);
  }

  return <div>hello</div>;
}
