"use client";

import {
  BrushCleaningIcon,
  ChevronRightIcon,
  LockIcon,
  TrashIcon,
  UnlockIcon,
  XIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";
import type { GroupSessionData } from "@/db/group-session";
import { useHasScrollbar } from "@/lib/hooks/scrollbar";
import {
  useDeleteGroupSessionSWRMutation,
  useGetGroupSessionsSWR,
  usePatchGroupSessionSWRMutation,
} from "@/lib/hooks/swr/group-session";
import { cn } from "@/lib/utils";
import { CopyableCode } from "./code";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./ui/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "./ui/item";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { Spinner } from "./ui/spinner";

type SelectedSessionsState = Set<string>;

type SelectedSessionsAction =
  | { type: "add"; payload: string }
  | { type: "remove"; payload: string }
  | { type: "set"; payload: string[] }
  | { type: "clear" };

function selectedSessionsReducer(
  state: Set<string>,
  action: SelectedSessionsAction,
): Set<string> {
  switch (action.type) {
    case "add":
      return new Set([...state, action.payload]);
    case "set":
      return new Set(action.payload);
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

  const getter = useGetGroupSessionsSWR(userId, {
    onError: (err) =>
      toast.error(err.message, {
        id: "getGroupSessionsSWRErr",
      }),
  });
  const deleter = useDeleteGroupSessionSWRMutation({
    onSuccess: (code) => {
      dispatchSelectedSessions({ type: "remove", payload: code });
    },
    onError: (err) => toast.error(err.message),
  });
  const patcher = usePatchGroupSessionSWRMutation({
    // used specifically to lock/unlock a session rn
    onError: (err) => toast.error(err.message),
  });

  const [selectedSessions, dispatchSelectedSessions] = React.useReducer(
    selectedSessionsReducer,
    new Set<string>(),
  );

  if (getter.isLoading) return <MySessionsLoading />;
  if (!getter.data.length) return <MySessionsEmpty />;

  return (
    <>
      <AnimatePresence>
        {selectedSessions.size > 0 ? (
          <SessionActionItem
            state={selectedSessions}
            dispatch={dispatchSelectedSessions}
            deleter={deleter}
            getter={getter}
            patcher={patcher}
          />
        ) : null}
      </AnimatePresence>
      <ScrollArea>
        <div
          ref={ref}
          className={cn(
            "flex flex-col max-h-[calc(100vh-19.5rem)] min-h-[100px]",
            hasScrollbar ? "pr-2" : "pr-0",
          )}>
          {getter.data
            .sort((a, b) => b.createdOn - a.createdOn)
            .map((session) => (
              <SessionBlock
                data={session}
                key={session.code}
                checked={selectedSessions.has(session.code)}
                dispatch={dispatchSelectedSessions}
                patcher={patcher}
                getter={getter}
              />
            ))}
        </div>
      </ScrollArea>
    </>
  );
}

function SessionActionItem({
  state,
  dispatch,
  getter,
  patcher,
  deleter,
}: {
  state: SelectedSessionsState;
  dispatch: React.Dispatch<SelectedSessionsAction>;
  getter: ReturnType<typeof useGetGroupSessionsSWR>;
  patcher: ReturnType<typeof usePatchGroupSessionSWRMutation>;
  deleter: ReturnType<typeof useDeleteGroupSessionSWRMutation>;
}) {
  const [isLocking, setIsLocking] = React.useState(false);
  const [isUnlocking, setIsUnlocking] = React.useState(false);

  return (
    <motion.div
      className="fixed left-1/2 -translate-x-1/2 bottom-4 sm:bottom-auto sm:top-4 z-9999"
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      style={{
        WebkitBackdropFilter: "blur(8px)",
        backdropFilter: "blur(8px)",
        transform: "translateZ(0)",
      }}>
      <Item
        className="rounded-sm border-border sm:gap-8 gap-4 justify-center max-sm:max-w-min sm:flex-nowrap"
        size="sm">
        <ItemContent>
          <div className="flex flex-row gap-4 justify-center items-center">
            <Checkbox
              id="multiple-session"
              checked={getter.data.length === state.size}
              className="size-6"
              onCheckedChange={(checked) => {
                if (!checked) dispatch({ type: "clear" });
                else
                  dispatch({
                    type: "set",
                    payload: getter.data.map(({ code }) => code),
                  });
              }}
            />
            <Label htmlFor="multiple-session" className="whitespace-nowrap">
              <ItemTitle>
                {state.size} session
                {state.size > 1 ? "s" : ""} selected
              </ItemTitle>
            </Label>
          </div>
        </ItemContent>
        <ItemActions>
          <Button
            onClick={async () => {
              let err = 0;
              for (const code of state) {
                await deleter.trigger({ code }).catch(() => {
                  err = 1;
                  return null;
                });
              }
              !err && toast.success("The selected sessions were deleted.");
              getter.mutate();
            }}
            variant="destructive"
            size="icon-lg"
            aria-label="Delete one or more sessions"
            disabled={deleter.isMutating}>
            {deleter.isMutating ? <Spinner /> : <TrashIcon />}
          </Button>
          <Button
            onClick={async () => {
              let err = 0;
              setIsLocking(true);
              for (const code of state) {
                await patcher
                  .trigger({ code, data: { frozen: true } })
                  .catch(() => {
                    err = 1;
                    return null;
                  });
              }
              setIsLocking(false);
              !err && toast.success("The selected sessions were locked.");
              getter.mutate();
            }}
            variant="outline"
            size="icon-lg"
            aria-label="Lock one or more sessions"
            disabled={isLocking}>
            {isLocking ? <Spinner /> : <LockIcon />}
          </Button>
          <Button
            onClick={async () => {
              let err = 0;
              setIsUnlocking(true);
              for (const code of state) {
                await patcher
                  .trigger({ code, data: { frozen: false } })
                  .catch(() => {
                    err = 1;
                    return null;
                  });
              }
              setIsUnlocking(false);
              !err && toast.success("The selected sessions were unlocked.");
              getter.mutate();
            }}
            variant="outline"
            size="icon-lg"
            aria-label="Unlock one or more sessions"
            disabled={isUnlocking}>
            {isUnlocking ? <Spinner /> : <UnlockIcon />}
          </Button>
          <Button
            size="icon-lg"
            onClick={() => dispatch({ type: "clear" })}
            aria-label="Deselect all selected sessions">
            <XIcon />
          </Button>
        </ItemActions>
      </Item>
    </motion.div>
  );
}

const SessionBlock = React.memo(
  _SessionBlock,
  (prev, next) => prev.checked === next.checked && prev.data === next.data,
);
function _SessionBlock({
  data,
  checked,
  dispatch,
  getter,
  patcher,
}: {
  data: GroupSessionData;
  checked: boolean;
  dispatch: React.Dispatch<SelectedSessionsAction>;
  patcher: ReturnType<typeof usePatchGroupSessionSWRMutation>;
  getter: ReturnType<typeof useGetGroupSessionsSWR>;
}) {
  const [isMutatingThis, setIsMutatingThis] = React.useState(false);

  return (
    <Item
      asChild
      variant="outline"
      className="rounded-none first:rounded-t-sm last:rounded-b-sm not-last:border-b-0 hover:bg-accent/20 has-aria-checked:bg-accent/20 max-sm:flex-col max-sm:items-start">
      <Label htmlFor={`single-session-${data.code}`}>
        <ItemContent>
          <div className="flex flex-row gap-4 items-center">
            <Checkbox
              className="size-6 max-sm:hidden"
              id={`single-session-${data.code}`}
              checked={checked}
              aria-label="Select session"
              onCheckedChange={(checked) =>
                dispatch({
                  type: checked ? "add" : "remove",
                  payload: data.code,
                })
              }
            />
            <div>
              <ItemTitle>
                <span className="wrap-break-word hyphens-auto">
                  {data.name}
                </span>
                <CopyableCode className="py-px" copyValue={data.code}>
                  {data.code}
                </CopyableCode>
              </ItemTitle>
              <ItemDescription
                className={cn("line-clamp-3", data?.description && "mt-1")}>
                {data.description}
              </ItemDescription>
            </div>
          </div>
        </ItemContent>
        <ItemActions className="ml-auto max-sm:flex max-sm:justify-between max-sm:w-full">
          <Checkbox
            className="size-6 sm:hidden"
            id={`single-session-${data.code}`}
            checked={checked}
            aria-label="Select session"
            onCheckedChange={(checked) =>
              dispatch({
                type: checked ? "add" : "remove",
                payload: data.code,
              })
            }
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon-lg"
              aria-label="Lock or unlock session"
              disabled={isMutatingThis}
              onClick={async () => {
                setIsMutatingThis(true);
                getter.mutate(
                  (prev) =>
                    prev?.map((session) =>
                      session.code === data.code
                        ? { ...session, frozen: !data.frozen }
                        : session,
                    ) ?? [],
                  { revalidate: false },
                );
                await patcher
                  .trigger({ code: data.code, data: { frozen: !data.frozen } })
                  .catch(() => null);
                getter.mutate();
                setIsMutatingThis(false);
              }}>
              {isMutatingThis ? (
                <Spinner />
              ) : data.frozen ? (
                <LockIcon />
              ) : (
                <UnlockIcon />
              )}
            </Button>
            <Link href={`/s/${data.code}`} tabIndex={-1}>
              <Button
                variant="outline"
                size="icon-lg"
                aria-label="Go to session">
                <ChevronRightIcon className="size-4" />
              </Button>
            </Link>
          </div>
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
