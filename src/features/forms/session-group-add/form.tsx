"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import type z from "zod";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { sessionGroupAddSchema } from "./schema";

export function SessionGroupAddForm({
  addGroup,
}: {
  addGroup: (groupName: string) => void;
}) {
  const form = useForm({
    resolver: zodResolver(sessionGroupAddSchema),
    defaultValues: { groupName: "" },
  });

  async function onSubmit(values: z.output<typeof sessionGroupAddSchema>) {
    addGroup(values.groupName);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <Controller
          name="groupName"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="form-group-add-session-groupname">
                Add a Group
              </FieldLabel>
              <div className="flex flex-row gap-4">
                <Input
                  {...field}
                  type="text"
                  placeholder="Name"
                  className="max-w-[250px]"
                  autoComplete="off"
                  id="form-group-add-session-groupname"
                  aria-invalid={fieldState.invalid}
                />
                <Button type="submit">Add</Button>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
    </form>
  );
}
