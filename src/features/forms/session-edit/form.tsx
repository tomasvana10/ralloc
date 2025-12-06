"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PencilIcon } from "lucide-react";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { usePatchGroupSessionSWRMutation } from "@/hooks/use-group-session";
import type { SessionEditSchemaType } from ".";
import { sessionEditSchemaFactory } from "./schema";

export function SessionEditForm({
  code,
  data,
}: {
  code: string;
  data: SessionEditSchemaType;
}) {
  const patcher = usePatchGroupSessionSWRMutation({
    onSuccess: () => toast.success("Session updated successfully."),
    onError: (err) => toast.error(err.message),
  });

  const sessionEditSchema = React.useMemo(() => {
    return sessionEditSchemaFactory(data.groupSize);
  }, [data.groupSize]);

  const form = useForm<
    z.input<typeof sessionEditSchema>,
    unknown,
    z.output<typeof sessionEditSchema>
  >({
    resolver: zodResolver(sessionEditSchema),
    mode: "all",
    defaultValues: data,
  });

  // this is generally triggered when the user updates the session.
  // without it, the form still thinks their session is frozen after they
  // unfreeze it (for example)
  React.useEffect(() => {
    form.reset(data);
  }, [data, form]);

  async function onSubmit(values: z.output<typeof sessionEditSchema>) {
    await patcher.trigger({ code, data: { ...values } }).catch(() => null);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon-lg">
          <PencilIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className="text-left">
          <DialogTitle>Edit</DialogTitle>
          <DialogDescription>Edit this group session.</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <div className="flex flex-row gap-2 max-[350px]:flex-col max-[350px]:gap-7">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="flex-[0.65]">
                    <FieldLabel htmlFor="form-edit-session-name">
                      Name
                    </FieldLabel>
                    <Input
                      {...field}
                      type="text"
                      autoComplete="off"
                      id="form-edit-session-name"
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
                    className="flex-[0.35]">
                    <FieldLabel
                      className="text-nowrap"
                      htmlFor="form-edit-session-group-size">
                      Group Size
                    </FieldLabel>
                    <Input
                      {...field}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={String(field.value)}
                      onChange={(e) => field.onChange(+e.target.value)}
                      onKeyDown={(e) => {
                        if (!/[0-9]|Backspace|Arrow|Tab/.test(e.key))
                          e.preventDefault();
                      }}
                      id="form-edit-session-group-size"
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
                  <FieldLabel
                    htmlFor="form-edit-session-description"
                    className="flex-row items-center justify-between">
                    Description
                  </FieldLabel>
                  <Textarea
                    {...field}
                    className="min-h-[150px]"
                    id="form-edit-session-description"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="frozen"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <div className="flex items-center space-x-2">
                    <FieldLabel htmlFor="form-edit-session-frozen">
                      Locked
                    </FieldLabel>
                    <Switch
                      id="form-edit-session-frozen"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter className="mt-4 max-sm:mt-8 flex flex-col">
            <Button
              type="submit"
              className="sm:min-w-[80px]"
              disabled={!form.formState.isDirty || patcher.isMutating}>
              {patcher.isMutating ? <Spinner className="mr-2" /> : null}
              Save
            </Button>

            <Button
              type="button"
              className="sm:min-w-[80px]"
              variant="outline"
              onClick={() => form.reset(data)}
              disabled={!form.formState.isDirty || patcher.isMutating}>
              Clear
            </Button>

            <DialogClose asChild>
              <Button variant="outline" className="sm:min-w-[80px]">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
