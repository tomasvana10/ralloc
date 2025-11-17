import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  SESSION_CODE_CHARACTERS,
  SESSION_CODE_LENGTH,
} from "@/lib/group-session/constants";
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

  const router = useRouter();

  React.useEffect(() => {
    const sub = form.watch((data) =>
      state.setData(data as Partial<SessionJoinSchemaType>),
    );
    return () => sub.unsubscribe();
  }, [form, state.setData]);

  async function onSubmit(data: SessionJoinSchemaType) {
    const exists = await fetch(`/api/sessions/${data.code}`, {
      method: "HEAD",
    }).then((res) => res.ok);

    if (!exists)
      return form.setError("code", {
        message:
          "This group session doesn't exist. Please double check you entered the code correctly.",
      });

    reset();
    router.push(`/s/${data.code}`);
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
                  <div className="flex gap-4 flex-wrap max-[400px]:justify-center">
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
                        if (form.getFieldState("code").error)
                          form.clearErrors("code");
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
                    <Button
                      type="submit"
                      className="max-[400px]:hidden min-w-[100px]">
                      Join
                    </Button>
                  </div>
                  {fieldState.invalid && (
                    <div className="max-[400px]:flex w-full justify-center">
                      <FieldError errors={[fieldState.error]} />
                    </div>
                  )}
                  <Button type="submit" className="min-[400px]:hidden w-1/2">
                    Join
                  </Button>
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
