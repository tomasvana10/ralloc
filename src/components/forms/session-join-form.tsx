import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Field, FieldError, FieldGroup } from "../ui/field";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";
import { Button } from "../ui/button";

export const CODE_LENGTH = 5;

export const sessionJoinSchema = z.object({
  code: z
    .string()
    .length(CODE_LENGTH, `Code must be ${CODE_LENGTH} characters`)
    .regex(
      new RegExp(REGEXP_ONLY_DIGITS_AND_CHARS),
      "Code must be alphanumeric"
    ),
});

export type SessionJoinSchemaType = z.infer<typeof sessionJoinSchema>;

export function SessionJoinForm() {
  const form = useForm<SessionJoinSchemaType>({
    resolver: zodResolver(sessionJoinSchema),
    defaultValues: {
      code: "",
    },
  });

  function onSubmit(data: SessionJoinSchemaType) {}

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join a Group Session</CardTitle>
        <CardDescription>Join a group session using a code.</CardDescription>
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
                    maxLength={CODE_LENGTH}
                    value={field.value}
                    onChange={field.onChange}
                    aria-invalid={fieldState.invalid}>
                    <InputOTPGroup className="flex-wrap">
                      {Array.from({ length: CODE_LENGTH }, (_, i) => (
                        <InputOTPSlot {...field} index={i} key={i} />
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
