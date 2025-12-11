"use client";

import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { BrushCleaning, CircleXIcon, LockIcon, SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { useRemark } from "react-remark";
import type { ReadyState } from "react-use-websocket-lite";
import { VirtuosoGrid, type VirtuosoGridProps } from "react-virtuoso";
import { toast } from "sonner";
import { ClientAvatar } from "@/components/auth/avatar";
import { CopyableCode } from "@/components/code";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import type { GroupSessionData } from "@/db/group-session";
import { getRateLimitMessage } from "@/db/rate-limit/utils";
import { useIsBelowBreakpoint } from "@/hooks/use-is-below-breakpoint";
import { UserRepresentation } from "@/lib/group-session";
import { GSServer } from "@/lib/group-session/proto";
import { cn } from "@/lib/utils";
import { SessionEditForm } from "../../forms/session-edit/form";
import { useGroupSession } from "../use-group-session";
import { GlobalActionsModal } from "./global-actions-modal";
import { Group } from "./group";
import { WebSocketStatus } from "./websocket-status";

const groupGridComponents: VirtuosoGridProps<
  undefined,
  undefined
>["components"] = {
  Scroller: ({
    ref,
    style,
    children,
    ...props
  }: React.ComponentPropsWithRef<"div">) => (
    <ScrollAreaPrimitive.Root className="w-full overflow-none rounded-sm border border-border">
      <ScrollAreaPrimitive.Viewport
        ref={ref}
        {...props}
        style={style}
        className="h-full w-full">
        {children}
      </ScrollAreaPrimitive.Viewport>

      <ScrollBar />
    </ScrollAreaPrimitive.Root>
  ),

  List: ({
    ref,
    style,
    children,
    ...props
  }: React.ComponentPropsWithRef<"div">) => (
    <div
      ref={ref}
      {...props}
      style={style}
      className={cn("grid grid-cols-1 auto-rows-fr", "sm:grid-cols-2")}>
      {children}
    </div>
  ),
};

const MIN_ITEMS_TO_ENABLE_LIST_VIRTUALISATION = 50;

function getGroupBorderClasses(
  index: number,
  visibleTotal: number,
  isMobile: boolean,
) {
  if (isMobile) return "border-b";

  if (visibleTotal <= 1) return "";

  const isOnLeftColumn = index % 2 === 0;
  const row = Math.floor(index / 2);
  const finalRow = Math.floor((visibleTotal - 1) / 2);

  return cn(isOnLeftColumn && "border-r", row < finalRow && "border-b");
}

const groupNameCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

export function SessionViewer({
  code,
  userRepresentation,
}: {
  code: string;
  userRepresentation: {
    avatarUrl: string;
    name: string;
    userId: string;
    compressedUser: string;
  };
}) {
  const router = useRouter();
  const isMobile = useIsBelowBreakpoint(640);
  const [isBelow350, isBelow768] = [
    useIsBelowBreakpoint(350),
    useIsBelowBreakpoint(768),
  ];
  const maxVisibleAvatarsPerGroup = isBelow350
    ? 4
    : isMobile
      ? 6
      : isBelow768
        ? 3
        : 5;
  const [groupQuery, setGroupQuery] = React.useState("");
  const {
    data,
    joinGroup,
    leaveGroup,
    addGroup,
    removeGroup,
    clearAllGroupMembers,
    clearGroupMembers,
    currentGroup,
    freezeClient,
    wsReadyState,
    isHost,
  } = useGroupSession({
    code,
    compressedUser: userRepresentation.compressedUser,
    onClose: (code, reason) => {
      if (code === 1005) return; // likely caused by the user redirecting to a new page, so ignore

      if (code >= 4000) {
        // custom close event code
        let customErrMsgBase = "";
        switch (code) {
          case GSServer.CloseEventCodes.GroupSessionWasDeleted:
            customErrMsgBase = "This group session was deleted";
            break;
          case GSServer.CloseEventCodes.RateLimited:
            // i am using `reason` as a way to transmit retryAfter. a lil cheeky but it's ok
            customErrMsgBase = getRateLimitMessage(undefined, +reason);
            break;
          case GSServer.CloseEventCodes.Forbidden:
            customErrMsgBase =
              "You're not allowed to perform this action since you aren't the host";
            break;
          case GSServer.CloseEventCodes.PotentialAbuse:
            customErrMsgBase =
              "Your activity has been flagged as potential abuse";
            break;
        }

        toast.warning(
          `${customErrMsgBase}. You'll be redirected in 3 seconds.`,
        );
        freezeClient();
        return setTimeout(() => router.push("/"), 3000);
      }

      if ([1003, 1007, 1008, 1012, 1013, 1014, 1015].includes(code)) {
        toast.error(
          `Your connection was closed (code ${code}). You'll be redirected in 3 seconds.`,
        );
        freezeClient();
        return setTimeout(() => router.push("/"), 3000);
      }
    },
    onError: (msg) => toast.error(msg),
    onReconnectStop: (n) => {
      setTimeout(() => {
        freezeClient();
        toast.warning(
          `Your client has exceeded the maximum amount of reconnection attempts (${n}). You'll be redirected in 3 seconds.`,
        );
      }, 100);
      setTimeout(() => router.push("/"), 2900);
    },
  });

  const groupCollection = React.useMemo(() => {
    if (!data) return [];

    return data.groups
      .filter(
        (group) =>
          !groupQuery ||
          group.name.toLowerCase().includes(groupQuery.toLowerCase()),
      )
      .sort((a, b) => groupNameCollator.compare(a.name, b.name));
  }, [data, groupQuery]);

  return (
    <>
      {!data ? (
        <SessionInfoSkeleton />
      ) : (
        <SessionInfo
          data={data}
          isHost={isHost}
          wsReadyState={wsReadyState}
          isMobile={isMobile}
          modals={[
            <GlobalActionsModal
              key={0}
              addGroup={addGroup}
              clearAllGroupMembers={clearAllGroupMembers}
            />,
            <SessionEditForm
              key={1}
              code={data.code}
              data={{
                description: data.description,
                frozen: data.frozen,
                name: data.name,
                groupSize: data.groupSize,
              }}
            />,
          ]}
        />
      )}

      <div className="sm:my-5 my-4">
        {currentGroup && data ? (
          <div className="grid grid-cols-1 auto-rows-fr">
            <Group
              members={currentGroup.members}
              name={currentGroup.name}
              groupSize={data.groupSize}
              compressedUser={userRepresentation.compressedUser}
              currentGroupName={currentGroup?.name ?? null}
              isWithinCollection={false}
              joinGroup={joinGroup}
              leaveGroup={leaveGroup}
              clearGroupMembers={clearGroupMembers}
              removeGroup={removeGroup}
              frozen={data.frozen}
              maxVisibleAvatarsPerGroup={maxVisibleAvatarsPerGroup}
            />
          </div>
        ) : (
          <CurrentGroupEmpty />
        )}
      </div>

      <Field>
        <FieldLabel htmlFor="group-search">
          <SearchIcon className="size-4" />
          Search for a Group
        </FieldLabel>
        <div className="flex gap-2">
          <Input
            placeholder="Name"
            className="mb-2"
            id="group-search"
            value={groupQuery}
            onChange={(ev) => setGroupQuery(ev.target.value)}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setGroupQuery("")}>
            <CircleXIcon />
          </Button>
        </div>
      </Field>

      {!data ? (
        <Spinner className="size-24 stroke-1 w-full" />
      ) : groupCollection.length === 0 ? (
        <GroupsEmpty />
      ) : groupCollection.length < MIN_ITEMS_TO_ENABLE_LIST_VIRTUALISATION ? (
        <ScrollArea className="rounded-sm border border-border">
          <div
            className={cn(
              "max-h-[calc(100vh-33.5rem)]",
              groupQuery ? "min-h-[90px]" : "sm:min-h-[380px] min-h-[450px]",
            )}>
            <div
              className={cn(
                "grid grid-cols-1 auto-rows-fr",
                groupCollection.length > 1 && "sm:grid-cols-2",
              )}>
              {groupCollection.map(({ members, name }, i) => (
                <Group
                  key={name}
                  className={cn(
                    "border-0 rounded-none",
                    getGroupBorderClasses(i, groupCollection.length, isMobile),
                  )}
                  members={members}
                  name={name}
                  groupSize={data.groupSize}
                  isWithinCollection={true}
                  compressedUser={userRepresentation.compressedUser}
                  currentGroupName={currentGroup?.name ?? null}
                  joinGroup={joinGroup}
                  leaveGroup={leaveGroup}
                  clearGroupMembers={clearGroupMembers}
                  removeGroup={removeGroup}
                  frozen={data.frozen}
                  maxVisibleAvatarsPerGroup={maxVisibleAvatarsPerGroup}
                />
              ))}
            </div>
          </div>
        </ScrollArea>
      ) : (
        <VirtuosoGrid
          style={{ height: "480px" }}
          className="rounded-sm"
          totalCount={groupCollection.length}
          components={groupGridComponents}
          itemContent={(index) => {
            const { members, name } = groupCollection[index];

            return (
              <Group
                key={name}
                className={cn(
                  "border-0 rounded-none",
                  getGroupBorderClasses(
                    index,
                    groupCollection.length,
                    isMobile,
                  ),
                )}
                members={members}
                name={name}
                groupSize={data.groupSize}
                isWithinCollection={true}
                compressedUser={userRepresentation.compressedUser}
                currentGroupName={currentGroup?.name ?? null}
                joinGroup={joinGroup}
                leaveGroup={leaveGroup}
                clearGroupMembers={clearGroupMembers}
                removeGroup={removeGroup}
                frozen={data.frozen}
                maxVisibleAvatarsPerGroup={maxVisibleAvatarsPerGroup}
              />
            );
          }}
        />
      )}
    </>
  );
}

function SessionInfo({
  data,
  isHost,
  wsReadyState,
  modals,
  isMobile,
}: {
  data: GroupSessionData;
  isHost: boolean;
  wsReadyState: ReadyState;
  modals: React.ReactNode[];
  isMobile: boolean;
}) {
  const repr = UserRepresentation.fromCompressedString(data.compressedHost);
  const [reactMarkdown, setReactMarkdown] = useRemark();

  React.useEffect(() => {
    if (data.description) {
      setReactMarkdown(data.description);
    }
  }, [data.description, setReactMarkdown]);

  return (
    <div className="flex flex-col mb-4 gap-2 max-sm:px-2">
      <div className="flex flex-row sm:items-center items-start sm:gap-4 gap-2 min-h-[70px]">
        {!isMobile && (
          <ClientAvatar
            image={repr.avatarUrl}
            name={repr.name}
            className="size-16 bg-card border border-accent"
          />
        )}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center flex-wrap">
            <div className="flex flex-row gap-2">
              {isMobile && (
                <ClientAvatar
                  image={repr.avatarUrl}
                  name={repr.name}
                  className="size-8 bg-card border border-accent"
                />
              )}
              <h1 className="text-lg font-semibold leading-none hyphens-auto flex items-center gap-1 wrap-break-word">
                {data.name}
              </h1>
            </div>
            <div className="flex gap-1 flex-wrap">
              <CopyableCode className="h-fit text-xs" copyValue={data.code}>
                {data.code}
              </CopyableCode>
              {data.frozen && (
                <Badge variant="secondary">
                  <LockIcon />
                  Locked
                </Badge>
              )}
            </div>
          </div>
          <WebSocketStatus readyState={wsReadyState} />

          <p className="text-sm text-muted-foreground">
            Created by {repr.name} on{" "}
            {new Date(data.createdOn).toLocaleDateString()}
          </p>
          <p className="text-sm text-muted-foreground leading-none">
            <strong>{data.groups.length}</strong> group
            {data.groups.length === 1 ? "" : "s"} |{" "}
            <strong>{data.groupSize}</strong> member
            {data.groupSize === 1 ? "" : "s"} per group
          </p>
        </div>
        {isHost && (
          <div className="ml-auto flex max-sm:flex-col gap-2">{modals}</div>
        )}
      </div>
      {data.description && (
        <Accordion
          type="single"
          collapsible
          className="bg-accent/20 p-4 rounded-sm mt-3">
          <AccordionItem value="description">
            <AccordionTrigger className="py-0 mb-0">
              Information
            </AccordionTrigger>
            <AccordionContent className="mt-2 markdown">
              {reactMarkdown}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}

function SessionInfoSkeleton() {
  return (
    <div className="flex flex-row items-center sm:gap-4 gap-2 min-h-[70px]">
      <Skeleton className="size-16 rounded-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-[200px]" />
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[150px]" />
      </div>
    </div>
  );
}

function CurrentGroupEmpty() {
  return (
    <Empty className="border border-dashed p-0! min-h-[90px]">
      <EmptyHeader>
        <EmptyTitle>You Have No Group</EmptyTitle>
        <EmptyDescription>
          Join one below by clicking on the "+".
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function GroupsEmpty() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BrushCleaning />
        </EmptyMedia>
        <EmptyTitle>No Matches Found</EmptyTitle>
        <EmptyDescription>Try a different query.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
