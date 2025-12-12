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
import { CopyableCode } from "@/components/code";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
} from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import type { GroupSessionData } from "@/db/group-session";
import {
  useDeleteGroupSessionSWRMutation,
  useGetGroupSessionsSWR,
  usePatchGroupSessionSWRMutation,
} from "@/hooks/group-session-swr";
import { useIsBelowBreakpoint } from "@/hooks/use-is-below-breakpoint";
import { cn } from "@/lib/utils";
import { confirm } from "../confirm";
import {
  optimisticallyUpdateSessions,
  type SelectedSessionsAction,
  type SelectedSessionsState,
  selectedSessionsReducer,
} from "./state";

const PATCHES_BEFORE_GET = 25;

export function MySessions({ userId }: { userId: string }) {
  const [patchCount, setPatchCount] = React.useState(0);
  const isMobile = useIsBelowBreakpoint(640);

  const getter = useGetGroupSessionsSWR(userId, {
    onError: (err) => toast.error(err.message),
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

  React.useEffect(() => {
    if (patchCount >= PATCHES_BEFORE_GET) {
      getter.mutate();
      setPatchCount(0);
    }
  }, [patchCount, getter]);

  if (getter.isLoading) return <MySessionsLoading />;
  if (!getter.data.length) return <MySessionsEmpty />;

  return (
    <>
      <AnimatePresence>
        {selectedSessions.size > 0 ? (
          <ActionItem
            data={getter.data}
            state={selectedSessions}
            dispatch={dispatchSelectedSessions}
            deleter={deleter}
            getter={getter}
            patcher={patcher}
            setPatchCount={setPatchCount}
          />
        ) : null}
      </AnimatePresence>
      <ScrollArea className="rounded-sm border border-border">
        <div className={cn("flex flex-col max-h-[70vh] min-h-[70px]")}>
          {getter.data
            .sort((a, b) => b.createdOn - a.createdOn)
            .map((session) => (
              <SessionBlock
                data={session}
                key={session.code}
                checked={selectedSessions.has(session.code)}
                dispatch={dispatchSelectedSessions}
                getter={getter}
                patcher={patcher}
                setPatchCount={setPatchCount}
                isMobile={isMobile}
              />
            ))}
        </div>
      </ScrollArea>
    </>
  );
}

function ActionItem({
  data,
  state,
  dispatch,
  getter,
  patcher,
  deleter,
  setPatchCount,
}: {
  data: GroupSessionData[];
  state: SelectedSessionsState;
  dispatch: React.Dispatch<SelectedSessionsAction>;
  getter: ReturnType<typeof useGetGroupSessionsSWR>;
  patcher: ReturnType<typeof usePatchGroupSessionSWRMutation>;
  deleter: ReturnType<typeof useDeleteGroupSessionSWRMutation>;
  setPatchCount: React.Dispatch<React.SetStateAction<number>>;
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
              const result = await confirm({
                message: `${state.size} session${state.size === 1 ? "" : "s"} will be deleted. This action can't be undone.`,
                actionMessage: "Delete",
                actionVariant: "destructive",
              });
              if (!result) return;

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
            id="x"
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
                  })
                  .then(() => {
                    optimisticallyUpdateSessions(
                      data.find((d) => d.code === code)!,
                      { frozen: true },
                      getter,
                    );
                    setPatchCount((c) => c + 1);
                  });
              }
              setIsLocking(false);
              !err && toast.success("The selected sessions were locked.");
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
                  })
                  .then(() => {
                    optimisticallyUpdateSessions(
                      data.find((d) => d.code === code)!,
                      { frozen: false },
                      getter,
                    );
                    setPatchCount((c) => c + 1);
                  });
              }
              setIsUnlocking(false);
              !err && toast.success("The selected sessions were unlocked.");
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
  (prev, next) =>
    prev.checked === next.checked &&
    prev.data === next.data &&
    prev.isMobile === next.isMobile,
);
function _SessionBlock({
  data,
  checked,
  dispatch,
  getter,
  patcher,
  setPatchCount,
  isMobile,
}: {
  data: GroupSessionData;
  checked: boolean;
  dispatch: React.Dispatch<SelectedSessionsAction>;
  getter: ReturnType<typeof useGetGroupSessionsSWR>;
  patcher: ReturnType<typeof usePatchGroupSessionSWRMutation>;
  setPatchCount: React.Dispatch<React.SetStateAction<number>>;
  isMobile: boolean;
}) {
  const [isMutatingThis, setIsMutatingThis] = React.useState(false);

  return (
    <Item
      asChild
      variant="outline"
      className={cn(
        "rounded-none border-0 border-b last:border-b-0 hover:bg-accent/20 has-aria-checked:bg-accent/20 max-sm:flex-col max-sm:items-start",
      )}>
      <Label htmlFor={`single-session-${data.code}`}>
        <ItemContent>
          <div className="flex flex-row gap-4 items-center">
            {!isMobile && (
              <SessionBlockCheckbox
                checked={checked}
                data={data}
                dispatch={dispatch}
              />
            )}
            <div>
              <ItemTitle>
                <span className="wrap-break-word hyphens-auto">
                  {data.name}
                </span>
                <CopyableCode className="h-6" copyValue={data.code}>
                  {data.code}
                </CopyableCode>
              </ItemTitle>
            </div>
          </div>
        </ItemContent>
        <ItemActions className="ml-auto max-sm:flex max-sm:justify-between max-sm:w-full">
          {isMobile && (
            <SessionBlockCheckbox
              checked={checked}
              data={data}
              dispatch={dispatch}
            />
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon-lg"
              aria-label="Lock or unlock session"
              disabled={isMutatingThis}
              onClick={async () => {
                setIsMutatingThis(true);
                optimisticallyUpdateSessions(
                  data,
                  { frozen: !data.frozen },
                  getter,
                );
                await patcher
                  .trigger({
                    code: data.code,
                    data: { frozen: !data.frozen },
                  })
                  .catch(() => null);
                setIsMutatingThis(false);
                setPatchCount((c) => c + 1);
              }}>
              {isMutatingThis ? (
                <Spinner />
              ) : data.frozen ? (
                <LockIcon />
              ) : (
                <UnlockIcon />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon-lg"
              id="x"
              aria-label="Go to session"
              asChild>
              <Link href={`/s/${data.code}`}>
                <ChevronRightIcon className="size-4" />
              </Link>
            </Button>
          </div>
        </ItemActions>
      </Label>
    </Item>
  );
}

function SessionBlockCheckbox({
  checked,
  data,
  dispatch,
}: {
  checked: boolean;
  data: GroupSessionData;
  dispatch: React.Dispatch<SelectedSessionsAction>;
}) {
  return (
    <Checkbox
      className="size-6"
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
