"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  BadgeCheckIcon,
  ChevronRightIcon,
  InfoIcon,
  PlusIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { useRemark } from "react-remark";
import { toast } from "sonner";
import type { z } from "zod";
import { SimpleTooltip } from "@/components/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCreateGroupSessionSWRMutation } from "@/hooks/use-group-session";
import { useIsBelowBreakpoint } from "@/hooks/use-is-below-breakpoint";
import { expandGroupSeed } from "@/lib/group-session";
import { cn } from "@/lib/utils";
import {
  type SessionCreateSchemaType,
  sessionCreateSchema,
  useSessionCreateStore,
} from ".";

export function SessionCreateForm() {
  const state = useSessionCreateStore();
  const creator = useCreateGroupSessionSWRMutation({
    onSuccess: (data) => {
      setShowGoToSessionButton(true);
      setSessionCode(data.code);
      reset();
    },
    onError: (err) => toast.error(err.message),
  });
  const [showMarkdown, setShowMarkdown] = React.useState(false);
  const [showGoToSessionButton, setShowGoToSessionButton] =
    React.useState(false);
  const [sessionCode, setSessionCode] = React.useState<string | null>(null);
  const [reactMarkdown, setReactMarkdown] = useRemark();
  const isMobile = useIsBelowBreakpoint(640);

  const form = useForm({
    resolver: zodResolver(sessionCreateSchema),
    defaultValues: state.data,
    mode: "all",
  });

  function reset() {
    (document.activeElement as HTMLElement | null)?.blur();
    state.reset();
    form.reset(state.defaultData);
  }

  React.useEffect(() => {
    if (form.formState.isDirty) {
      setShowGoToSessionButton(false);
      setSessionCode(null);
    }
  }, [form.formState.isDirty]);

  // sync form to zustand store
  // biome-ignore lint/correctness/useExhaustiveDependencies: intended usage
  React.useEffect(() => {
    const sub = form.watch((data) => {
      state.setData(data as Partial<SessionCreateSchemaType>);
      setReactMarkdown(data?.description ?? "");
    });
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

  async function onSubmit(data: z.output<typeof sessionCreateSchema>) {
    await creator.trigger(data).catch(() => null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 h-[1em]">
          <PlusIcon className="size-4" />
          Create
        </CardTitle>
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
                      id="form-create-session-name"
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
                      onChange={(e) => field.onChange(+e.target.value)}
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
                  <FieldLabel
                    htmlFor="form-create-session-description"
                    className="has-data-[state=checked]:bg-card! max-sm:flex-col max-sm:items-start max-sm:gap-2 flex-row">
                    <div className="flex gap-1">
                      <span>Description</span>
                      <Badge variant="outline" asChild>
                        <a
                          href="https://commonmark.org/help/"
                          target="_blank"
                          rel="noopener">
                          <BadgeCheckIcon /> Markdown
                        </a>
                      </Badge>
                    </div>
                    {!isMobile && (
                      <MarkdownPreviewSwitch
                        setShowMarkdown={setShowMarkdown}
                      />
                    )}
                  </FieldLabel>
                  {showMarkdown ? (
                    <ScrollArea
                      className={cn(
                        field.value.length > 25 ? "h-[300px]" : "h-[100px]",
                        "border border-input rounded-md wrap-break-word hyphens-auto",
                      )}>
                      <div className="markdown px-2">{reactMarkdown}</div>
                      <ScrollBar orientation="vertical" />
                    </ScrollArea>
                  ) : (
                    <Textarea
                      {...field}
                      className="h-25"
                      placeholder={
                        "## Juniper router allocation for [this week's lab](https://canvas.uts.edu.au). "
                      }
                      id="form-create-session-description"
                      aria-invalid={fieldState.invalid}
                    />
                  )}
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                  {isMobile && (
                    <MarkdownPreviewSwitch setShowMarkdown={setShowMarkdown} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="groupSeed"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="flex-[0.7]">
                  <div className="flex items-center gap-1">
                    <SimpleTooltip
                      tip={
                        <>
                          <p>
                            A comma-separated list of values to generate a set
                            of group names.
                          </p>
                          <br />
                          <p>
                            You can use character ranges like <code>[a-z]</code>{" "}
                            and numerical ranges like <code>[1-500]</code>.
                          </p>
                          <br />
                          <p>
                            <b>Example 1:</b> <code>table [a-b]</code> yields{" "}
                            <code>table a</code>, <code>table b</code>
                            <br />
                            <b>Example 2:</b> <code>a,b,[1-2]</code> yields{" "}
                            <code>a</code>, <code>b</code>, <code>1</code>,{" "}
                            <code>2</code>
                            <br />
                            <b>Example 3:</b> <code>[001-100]</code> yields{" "}
                            <code>001</code>, <code>002</code>, ...{" "}
                            <code>099</code>, <code>100</code>
                          </p>
                        </>
                      }
                    />
                    <FieldLabel
                      htmlFor="form-create-session-group-seed"
                      required>
                      Group Seed
                    </FieldLabel>
                  </div>
                  <Input
                    {...field}
                    type="text"
                    autoComplete="off"
                    placeholder="Group [1-10], Group [001-100], Group [a-c]"
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
                          {expandGroupSeed(form.getValues("groupSeed"))
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
      <CardFooter className="gap-2">
        <Button
          type="submit"
          form="form-create-session"
          className="transition-none min-w-[100px]"
          disabled={creator.isMutating}>
          {creator.isMutating ? <Spinner /> : null}Create
        </Button>
        <AnimatePresence initial={false}>
          {showGoToSessionButton && (
            <motion.div
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -10, opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}>
              <Button type="button" variant="outline" size="icon-sm" asChild>
                <Link href={`/s/${sessionCode}`}>
                  <ChevronRightIcon />
                </Link>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardFooter>
    </Card>
  );
}

function MarkdownPreviewSwitch({
  setShowMarkdown,
}: {
  setShowMarkdown: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <div className="flex gap-1 w-full justify-end">
      <Label htmlFor="preview-switch" className="text-card-foreground">
        Preview
      </Label>
      <Switch id="preview-switch" onCheckedChange={setShowMarkdown} />
    </div>
  );
}
