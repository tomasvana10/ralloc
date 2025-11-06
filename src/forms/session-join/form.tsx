import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { SESSION_CODE_CHARACTERS, SESSION_CODE_LENGTH } from "@/lib/constants";
import {
  type SessionJoinSchemaType,
  sessionJoinSchema,
  useSessionJoinStore,
} from ".";

export function SessionJoinForm() {
  const state = useSessionJoinStore();

  const form = useForm<SessionJoinSchemaType>({
    resolver: zodResolver(sessionJoinSchema),
    defaultValues: state.data,
    mode: "onSubmit",
  });

  const reset = () => {
    state.reset();
    form.reset(state.defaultData);
  };

  React.useEffect(() => {
    const sub = form.watch((data) =>
      state.setData(data as Partial<SessionJoinSchemaType>),
    );
    return () => sub.unsubscribe();
  }, [form, state.setData]);

  function onSubmit(data: SessionJoinSchemaType) {
    toast(data.code);
    reset();
  }

  return (
    <Card className="border-primary">
      <CardHeader>
        <CardTitle>Join a Group Session</CardTitle>
        <CardDescription>
          Join a group session using a{" "}
          <strong>lowercase, alphanumeric code</strong>. You can paste the code
          or type it manually.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="form-join-session" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="code"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <InputOTP
                    maxLength={SESSION_CODE_LENGTH}
                    value={field.value}
                    onChange={(val) => {
                      const clean = val
                        .replace(
                          new RegExp(`[^${SESSION_CODE_CHARACTERS}A-Z]`, "g"),
                          "",
                        )
                        .toLowerCase();
                      field.onChange(clean);
                    }}
                    aria-invalid={fieldState.invalid}>
                    <InputOTPGroup className="flex-wrap">
                      {Array.from({ length: SESSION_CODE_LENGTH }, (_, i) => (
                        <InputOTPSlot
                          {...field}
                          index={i}
                          // biome-ignore lint/suspicious/noArrayIndexKey: slots are fixed length and stable
                          key={`otp-slot-${i}`}
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button type="submit" form="form-join-session">
            Join
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}
