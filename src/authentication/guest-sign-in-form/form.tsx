"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { Controller, useForm } from "react-hook-form";
import { GUEST_PROVIDER } from "@/authentication/provider";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { type GuestSignInSchema, guestSignInSchema } from ".";

export function GuestSignInForm({ callbackUrl }: { callbackUrl?: string }) {
  const form = useForm<GuestSignInSchema>({
    resolver: zodResolver(guestSignInSchema),
    mode: "all",
    defaultValues: {
      nickname: "",
    },
  });

  async function onSubmit(values: GuestSignInSchema) {
    await signIn(GUEST_PROVIDER, {
      nickname: values.nickname,
      callbackUrl: callbackUrl ?? "/",
      redirect: true,
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-2">
        <Controller
          name="nickname"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="nickname" required disableAsterisk>
                Your Nickname
              </FieldLabel>
              <Input
                {...field}
                type="text"
                id="nickname"
                placeholder="John Doe"
                autoComplete="off"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <Button
        type="submit"
        className="mt-2 max-sm:w-full"
        variant="outline"
        disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? <Spinner className="mr-2" /> : null}
        Continue as Guest
      </Button>
    </form>
  );
}
