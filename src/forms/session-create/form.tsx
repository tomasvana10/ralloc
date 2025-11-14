"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { InfoIcon } from "lucide-react";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { useCreateGroupSessionSWRMutation } from "@/lib/hooks/swr/group-sessions";
import { Seed } from "@/lib/seed";
import { SimpleTooltip } from "../../components/tooltip";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "../../components/ui/field";
import { Input } from "../../components/ui/input";
import { Spinner } from "../../components/ui/spinner";
import { Textarea } from "../../components/ui/textarea";
import {
  type SessionCreateSchemaType,
  sessionCreateSchema,
  useSessionCreateStore,
} from ".";

export function SessionCreateForm() {
  const state = useSessionCreateStore();
  const creator = useCreateGroupSessionSWRMutation({
    onSuccess: () => {
      toast.success("Created a new group session");
      reset();
    },
    onError: (err) => toast.error(err.message),
  });

  const form = useForm<
    z.input<typeof sessionCreateSchema>,
    unknown,
    z.output<typeof sessionCreateSchema>
  >({
    resolver: zodResolver(sessionCreateSchema),
    defaultValues: state.data,
    mode: "all",
  });

  const reset = () => {
    state.reset();
    form.reset(state.defaultData);
  };

  // update zustand state when form is modified
  React.useEffect(() => {
    const sub = form.watch((data) =>
      state.setData(data as Partial<SessionCreateSchemaType>),
    );
    return () => sub.unsubscribe();
  }, [form, state.setData]);

  // prompt browser to ask user to confirm page reload (as data will be lost)
  React.useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (form.formState.isDirty) event.preventDefault();
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [form.formState.isDirty]);

  async function onSubmit(data: z.output<SessionCreateSchemaType>) {
    await creator.trigger(data).catch(() => null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a Group Session</CardTitle>
        <CardDescription>Create and open a group session.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="form-create-session" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <div className="flex flex-row gap-2 max-[350px]:flex-col max-[350px]:gap-7">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="flex-[0.7]">
                    <FieldLabel htmlFor="form-create-session-name" required>
                      Name
                    </FieldLabel>
                    <Input
                      {...field}
                      type="text"
                      autoComplete="off"
                      placeholder="CyberSec Lab 9 Week 8"
                      id="form-create-session-title"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="groupSize"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="flex-[0.3]">
                    <FieldLabel
                      className="text-nowrap"
                      htmlFor="form-create-session-group-size"
                      required>
                      Group Size
                    </FieldLabel>
                    <Input
                      {...field}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={String(field.value)}
                      onChange={field.onChange}
                      onKeyDown={(e) => {
                        if (!/[0-9]|Backspace|Arrow|Tab/.test(e.key))
                          e.preventDefault();
                      }}
                      id="form-create-session-group-size"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-create-session-description">
                    Description
                  </FieldLabel>
                  <Textarea
                    {...field}
                    placeholder="Juniper router allocation for this week's lab."
                    id="form-create-session-title"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="groupSeed"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="flex-[0.7]">
                  <FieldLabel htmlFor="form-create-session-group-seed" required>
                    <SimpleTooltip
                      tip={
                        <>
                          <p>
                            An comma-separated list of regex-like expressions or
                            plain text to generate a set of group names.
                          </p>
                          <br />
                          <p>
                            The amount of expanded values must not exceed{" "}
                            {Seed.MAX_PARTS}. Any expanded values greater than{" "}
                            {Seed.MAX_PART_LENGTH} characters in length will be
                            truncated.
                          </p>
                          <br />
                          <p>
                            <b>Example 1:</b> <code>table [b-a]</code> yields{" "}
                            <code>table b</code>, <code>table a</code>
                            <br />
                            <b>Example 2:</b> <code>a,b,[1-2]</code> yields{" "}
                            <code>a</code>, <code>b</code>, <code>1</code>,{" "}
                            <code>2</code>
                          </p>
                        </>
                      }
                    />
                    Group Seed
                  </FieldLabel>
                  <Input
                    {...field}
                    type="text"
                    autoComplete="off"
                    placeholder="Group [1-10], Group [a-c], Group [z-t]"
                    id="form-create-session-group-seed"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                  {!fieldState.invalid &&
                    form.getValues("groupSeed").length > 1 && (
                      <div className="text-sm text-muted-foreground whitespace-nowrap flex items-center">
                        <InfoIcon className="size-4 min-w-4 min-h-4" />
                        <span className="pr-1.5 pl-1">Expands to: </span>
                        <p className="text-ellipsis overflow-hidden">
                          {Seed.expand(form.getValues("groupSeed"))
                            .values.join(", ")
                            .slice(0, 150)}
                        </p>
                      </div>
                    )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Button
          type="submit"
          form="form-create-session"
          className="transition-none"
          disabled={creator.isMutating}>
          {creator.isMutating ? <Spinner /> : null}Create
        </Button>
      </CardFooter>
    </Card>
  );
}
