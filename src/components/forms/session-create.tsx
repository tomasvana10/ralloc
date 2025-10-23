import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { SimpleTooltip } from "../tooltip";
import { Seed } from "@/lib/seed";
import { toast } from "sonner";

export const sessionCreateSchema = z.object({
  groupSeed: z
    .string()
    .min(5, "Seed must be at least 5 characters")
    .max(150, "Seed must be at most 150 characters")
    .superRefine((val, ctx) => {
      const result = Seed.expand(val);
      if (result.issue === undefined) return;

      switch (result.issue) {
        case "invalid_range":
          return ctx.addIssue({
            code: "custom",
            message: "Seed has invalid ranges",
          });
        case "too_big":
          return ctx.addIssue({
            code: "too_big",
            maximum: Seed.MAX_PARTS,
            origin: "array",
            message: "Seed expands to too many values",
          });
        case "too_short":
          return ctx.addIssue({
            code: "too_small",
            minimum: Seed.MIN_PARTS,
            origin: "array",
            message: "Seed expands to too little values",
          });
        case "too_many_char_ranges":
          return ctx.addIssue({
            code: "custom",
            message: `You have provided too many character ranges`,
          });
        case "too_many_num_ranges":
          return ctx.addIssue({
            code: "custom",
            message: `You have provided too many numerical ranges`,
          });
      }
    }),
  groupSize: z.coerce.number().min(1, "Groups must have at least 1 member"),
  name: z
    .string()
    .min(5, "Name must be at least 5 characters")
    .max(50, "Name must be at most 50 characters"),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional()
    .refine(
      (val) => !val || val.length >= 10,
      "Description must be at least 10 characters"
    ),
});

export type SessionCreateSchemaType = z.infer<typeof sessionCreateSchema>;

export function SessionCreateForm() {
  const form = useForm<
    z.input<typeof sessionCreateSchema>,
    unknown,
    z.output<typeof sessionCreateSchema>
  >({
    resolver: zodResolver(sessionCreateSchema),
    defaultValues: {
      groupSeed: "",
      groupSize: 2,
      name: "",
      description: "",
    },
    mode: "onChange",
  });

  function onSubmit(data: z.output<typeof sessionCreateSchema>) {
    toast(JSON.stringify(data));
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
            <div className="flex flex-row gap-2 max-[350px]:flex-col">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="flex-[0.7]"
                  >
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
                    className="flex-[0.3]"
                  >
                    <FieldLabel
                      className="text-nowrap"
                      htmlFor="form-create-session-group-size"
                      required
                    >
                      Group Size
                    </FieldLabel>
                    <Input
                      {...field}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={String(field.value)}
                      onChange={(e) => field.onChange(e.target.value)}
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
                    Group Seed{" "}
                    <SimpleTooltip
                      tip={
                        <>
                          <p>
                            An expandable, comma-separated list of regex-like
                            expression to create a set of group names.
                          </p>
                          <br />
                          <p>
                            Supports a single numerical range (like{" "}
                            <code>[1-50]</code>) and two character ranges (like{" "}
                            <code>[a-z]</code> or <code>[A-Z]</code>).
                          </p>
                          <br />
                          <p>
                            The amount of expanded values must not exceed{" "}
                            {Seed.MAX_PARTS}. Any expanded values greater than{" "}
                            {Seed.MAX_PART_LENGTH} characters in length will be
                            truncated.
                          </p>
                        </>
                      }
                    />
                  </FieldLabel>
                  <Input
                    {...field}
                    type="text"
                    autoComplete="off"
                    placeholder="Router 10.0.1.1[10-50], Router 10.0.1.101"
                    id="form-create-session-group-seed"
                    aria-invalid={fieldState.invalid}
                  />
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
          <Button
            type="button"
            variant="destructive"
            onClick={() => form.reset()}
          >
            Reset
          </Button>
          <Button type="submit" form="form-create-session">
            Create
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}
