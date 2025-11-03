import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Button } from "@/components/ui/button";
import { SESSION_CODE_LENGTH } from "@/lib/constants";
import { sessionJoinSchema, useSessionJoinStore, type SessionJoinSchemaType } from ".";
import * as React from "react";

export function SessionJoinForm() {
  const state = useSessionJoinStore();

  const form = useForm<SessionJoinSchemaType>({
    resolver: zodResolver(sessionJoinSchema),
    defaultValues: state.data,
  });

  const reset = () => {
    state.reset();
    form.reset(state.defaultData);
  };

  React.useEffect(() => {
    const sub = form.watch(data =>
      state.setData(data as Partial<SessionJoinSchemaType>)
    );
    return () => sub.unsubscribe();
  }, [form, state.setData]);

  function onSubmit(data: SessionJoinSchemaType) {
    reset();
  }

  return (
    <Card className="border-primary">
      <CardHeader>
        <CardTitle>Join a Group Session</CardTitle>
        <CardDescription>
          Join a group session using a code. You can paste the code or type it
          manually.
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
                    onChange={field.onChange}
                    aria-invalid={fieldState.invalid}>
                    <InputOTPGroup className="flex-wrap">
                      {Array.from({ length: SESSION_CODE_LENGTH }, (_, i) => (
                        <InputOTPSlot
                          {...field}
                          index={i}
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
