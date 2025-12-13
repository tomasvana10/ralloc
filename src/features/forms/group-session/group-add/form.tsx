"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, UsersIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import type z from "zod";
import { Field } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { sessionGroupAddSchema } from "./schema";

export function SessionGroupAddForm({
  addGroup,
  className,
  ...props
}: {
  addGroup: (groupName: string) => void;
} & React.ComponentProps<"form">) {
  const form = useForm({
    resolver: zodResolver(sessionGroupAddSchema),
    defaultValues: { groupName: "" },
  });

  async function onSubmit(values: z.output<typeof sessionGroupAddSchema>) {
    addGroup(values.groupName);
    form.reset();
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={className}
      {...props}>
      <Controller
        name="groupName"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <InputGroup>
              <InputGroupInput
                {...field}
                type="text"
                placeholder="Add a group"
                aria-label="Group name to add"
                autoComplete="off"
                aria-invalid={fieldState.invalid}
              />
              <InputGroupAddon>
                <UsersIcon />
              </InputGroupAddon>
              <InputGroupButton
                disabled={!form.getValues("groupName").length}
                size="icon-sm"
                aria-label="Add group"
                type="submit">
                <PlusIcon />
              </InputGroupButton>
            </InputGroup>
          </Field>
        )}
      />
    </form>
  );
}
