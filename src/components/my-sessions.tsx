"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  BrushCleaningIcon,
  CheckIcon,
  ChevronRightIcon,
  LinkIcon,
  TrashIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
  ItemActions,
} from "./ui/item";
import {
  useDeleteGroupSessionsSWRMutation,
  useGetGroupSessionsSWR,
} from "@/lib/hooks/swr/group-sessions";
import * as React from "react";
import { ScrollArea } from "./ui/scroll-area";
import type { GroupSessionData } from "@/db/session";
import { useHasScrollbar } from "@/lib/hooks/scrollbar";
import { cn } from "@/lib/utils";
import { Label } from "./ui/label";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./ui/empty";
import Link from "next/link";
import { Spinner } from "./ui/spinner";

type SelectedSessionsState = Set<string>;

type SelectedSessionsAction =
  | { type: "add"; payload: string }
  | { type: "remove"; payload: string }
  | { type: "clear" };

function selectedSessionsReducer(
  state: Set<string>,
  action: SelectedSessionsAction
): Set<string> {
  switch (action.type) {
    case "add":
      return new Set([...state, action.payload]);
    case "remove": {
      const next = new Set(state);
      next.delete(action.payload);
      return next;
    }
    case "clear":
      return new Set();
    default:
      return state;
  }
}

export function MySessions({ userId }: { userId: string }) {
  const { ref, hasScrollbar } = useHasScrollbar<HTMLDivElement>();

  const swrGetter = useGetGroupSessionsSWR(userId, {
    onError: err =>
      toast.error(err.message, {
        id: "getGroupSessionsSWRErr",
      }),
  });
  const swrDeleter = useDeleteGroupSessionsSWRMutation({
    onSuccess: () => {
      toast.success("The selected sessions were deleted.");
      dispatchSelectedSession({ type: "clear" });
      swrGetter.mutate();
    },
    onError: err =>
      toast.error(err.message, { id: "deleteGroupSessionsSWRErr" }),
  });

  const [selectedSessions, dispatchSelectedSession] = React.useReducer(
    selectedSessionsReducer,
    new Set<string>()
  );

  if (swrGetter.isLoading) return <MySessionsLoading />;
  if (!swrGetter.data.length) return <MySessionsEmpty />;

  return (
    <>
      <ScrollArea>
        <div
          ref={ref}
          className={cn(
            "flex flex-col max-h-[calc(100vh-20rem)]",
            hasScrollbar ? "pr-2" : "pr-0"
          )}>
          {swrGetter.data.map(session => (
            <SessionBlock
              data={session}
              key={session.code}
              state={selectedSessions}
              dispatch={dispatchSelectedSession}
            />
          ))}
        </div>
      </ScrollArea>
      <AnimatePresence>
        {selectedSessions.size > 0 ? (
          <SessionActionItem
            state={selectedSessions}
            dispatch={dispatchSelectedSession}
            deleteCallback={swrDeleter.trigger}
            isDeleterMutating={swrDeleter.isMutating}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}

function SessionActionItem({
  state,
  dispatch,
  deleteCallback,
  isDeleterMutating,
}: {
  state: SelectedSessionsState;
  dispatch: React.Dispatch<SelectedSessionsAction>;
  deleteCallback: ReturnType<
    typeof useDeleteGroupSessionsSWRMutation
  >["trigger"];
  isDeleterMutating: boolean;
}) {
  return (
    <motion.div
      className="fixed left-1/2 -translate-x-1/2 bottom-4 sm:bottom-auto sm:top-4"
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}>
      <Item className="bg-secondary rounded-sm border-border" size="sm">
        <ItemContent>
          <ItemTitle>
            {state.size} session
            {state.size > 1 ? "s" : ""} selected
          </ItemTitle>
        </ItemContent>
        <ItemActions>
          <Button
            onClick={async () =>
              await deleteCallback(Array.from(state)).catch(() => null)
            }
            variant="destructive"
            aria-label="Delete session(s)">
            {isDeleterMutating ? <Spinner /> : <TrashIcon />}
          </Button>
          <Button
            onClick={() => dispatch({ type: "clear" })}
            aria-label="Deselect all sessions">
            <XIcon />
          </Button>
        </ItemActions>
      </Item>
    </motion.div>
  );
}

function SessionBlock({
  data,
  state,
  dispatch,
}: {
  data: GroupSessionData;
  state: SelectedSessionsState;
  dispatch: React.Dispatch<SelectedSessionsAction>;
}) {
  const [copyStatus, setCopyStatus] = React.useState<"copied" | "default">(
    "default"
  );

  const handleCopy = async () => {
    if (copyStatus === "copied") return;

    setCopyStatus("copied");
    await navigator.clipboard.writeText(
      `${process.env.NEXT_PUBLIC_URL}/s/${data.code}`
    );
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCopyStatus("default");
  };

  return (
    <Item
      asChild
      variant="outline"
      className="rounded-none first:rounded-t-sm last:rounded-b-sm not-last:border-b-0 hover:bg-accent/20 has-[[aria-checked=true]]:bg-accent/20">
      <Label htmlFor={data.code}>
        <ItemContent>
          <div className="flex flex-row gap-4 items-center">
            <Checkbox
              className="size-6"
              id={data.code}
              checked={state.has(data.code)}
              aria-label="Select session"
              onCheckedChange={checked =>
                dispatch({
                  type: checked ? "add" : "remove",
                  payload: data.code,
                })
              }
            />
            <div>
              <ItemTitle>{data.name}</ItemTitle>
              <ItemDescription>{data.description}</ItemDescription>
            </div>
          </div>
        </ItemContent>
        <ItemActions>
          <Button
            variant="outline"
            size="icon-lg"
            aria-label="Copy session code"
            onClick={handleCopy}>
            {copyStatus === "default" ? (
              <LinkIcon className="size-4" />
            ) : (
              <CheckIcon className="size-4" />
            )}
          </Button>
          <Link href={`/s/${data.code}`}>
            <Button variant="outline" size="icon-lg" aria-label="Go to session">
              <ChevronRightIcon className="size-4" />
            </Button>
          </Link>
        </ItemActions>
      </Label>
    </Item>
  );
}

function MySessionsEmpty() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BrushCleaningIcon />
        </EmptyMedia>
        <EmptyTitle>No Group Sessions</EmptyTitle>
        <EmptyDescription>
          No group sessions found. Create one in{" "}
          <Link href="/">the home menu</Link>.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function MySessionsLoading() {
  return (
    <div className="flex justify-center p-6 md:p-12">
      <Spinner className="size-24 stroke-1" />
    </div>
  );
}
