"use client";

import type { GroupSessionData } from "@core/db/group-session";
import { getRateLimitMessage } from "@core/db/rate-limit/utils";
import { UserRepresentation } from "@core/lib/group-session";
import { GSServer } from "@core/lib/group-session/proto";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { ClientAvatar } from "@web/components/auth/avatar";
import { CopyableCode } from "@web/components/code";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@web/components/ui/accordion";
import { Badge } from "@web/components/ui/badge";
import { Button } from "@web/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@web/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@web/components/ui/input-group";
import { ScrollArea, ScrollBar } from "@web/components/ui/scroll-area";
import { Spinner } from "@web/components/ui/spinner";
import { confirm } from "@web/features/confirm";
import { SessionEditForm } from "@web/features/forms/group-session/edit";
import { SessionGroupAddForm } from "@web/features/forms/group-session/group-add";
import { focusStyles } from "@web/lib/constants";
import { useIsBelowBreakpoint } from "@web/lib/hooks/use-is-below-breakpoint";
import { cn } from "@web/lib/utils";
import {
  EllipsisVertical,
  FlameIcon,
  LockIcon,
  MegaphoneIcon,
  PenIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { useRemark } from "react-remark";
import type { ReadyState } from "react-use-websocket-lite";
import { VirtuosoGrid, type VirtuosoGridProps } from "react-virtuoso";
import { toast } from "sonner";
import {
  type UseGroupSessionReturn,
  useGroupSession,
} from "../use-group-session";
import { Group } from "./group";
import {
  EmptyCurrentGroup,
  EmptyGroups,
  SessionAdvertisementDialog,
  SessionSummarySkeleton,
} from "./misc";
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
        tabIndex={0}
        ref={ref}
        {...props}
        style={style}
        className={cn("h-full w-full rounded-sm", focusStyles)}>
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

const noReconnectAttemptCloseCodes = [
  1001, 1003, 1006, 1007, 1008, 1012, 1013, 1014, 1015,
];

export function SessionViewer({
  code,
  userRepresentation,
}: {
  code: string;
  userRepresentation: ReturnType<UserRepresentation["toJSONSummary"]>;
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
      console.log(code);
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

      if (noReconnectAttemptCloseCodes.includes(code)) {
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
        <SessionSummarySkeleton />
      ) : (
        <SessionHeader
          data={data}
          isHost={isHost}
          wsReadyState={wsReadyState}
          isMobile={isMobile}
          clearAllGroupMembers={clearAllGroupMembers}
        />
      )}

      <div className="sm:my-5 my-4">
        {currentGroup && data ? (
          <div className="grid grid-cols-1 auto-rows-fr">
            <Group
              members={currentGroup.members}
              name={currentGroup.name}
              groupSize={data.groupSize}
              groupCount={data.groups.length}
              compressedUser={userRepresentation.compressedUser}
              currentGroupName={currentGroup?.name ?? null}
              isWithinCollection={false}
              isHost={isHost}
              joinGroup={joinGroup}
              leaveGroup={leaveGroup}
              clearGroupMembers={clearGroupMembers}
              removeGroup={removeGroup}
              frozen={data.frozen}
              maxVisibleAvatarsPerGroup={maxVisibleAvatarsPerGroup}
            />
          </div>
        ) : (
          <EmptyCurrentGroup isHost={isHost} frozen={data?.frozen ?? false} />
        )}
      </div>

      <div className="flex flex-row gap-2 mb-2 max-sm:flex-col-reverse">
        <InputGroup className={cn(isHost && "sm:flex-[0.6]")}>
          <InputGroupInput
            placeholder="Search for a group..."
            aria-label="Search for a group"
            value={groupQuery}
            onChange={(ev) => setGroupQuery(ev.target.value)}
          />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupButton
            aria-label="Clear group search query"
            size="icon-sm"
            disabled={!groupQuery}
            onClick={() => setGroupQuery("")}>
            <XIcon />
          </InputGroupButton>
        </InputGroup>
        {isHost && (
          <SessionGroupAddForm className="sm:flex-[0.4]" addGroup={addGroup} />
        )}
      </div>

      {!data ? (
        <Spinner className="size-24 stroke-1 w-full" />
      ) : groupCollection.length === 0 ? (
        <EmptyGroups />
      ) : groupCollection.length < MIN_ITEMS_TO_ENABLE_LIST_VIRTUALISATION ? (
        <ScrollArea className="rounded-sm border border-border">
          <div className="max-h-[calc(100vh-33.5rem)] min-h-[90px]">
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
                  groupCount={data.groups.length}
                  name={name}
                  groupSize={data.groupSize}
                  isWithinCollection={true}
                  isHost={isHost}
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
          style={{ height: "510px" }}
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
                isHost={isHost}
                name={name}
                groupCount={data.groups.length}
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

function SessionHeader({
  data,
  isHost,
  wsReadyState,
  isMobile,
  clearAllGroupMembers,
}: {
  data: GroupSessionData;
  isHost: boolean;
  wsReadyState: ReadyState;
  isMobile: boolean;
  clearAllGroupMembers: UseGroupSessionReturn["clearAllGroupMembers"];
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
            image={repr.image}
            name={repr.name}
            className="size-16 bg-card border border-accent text-2xl"
          />
        )}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center flex-wrap">
            <div className="flex flex-row gap-2">
              {isMobile && (
                <ClientAvatar
                  image={repr.image}
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
            Created by {repr.name}
            {isHost ? <strong> (you)</strong> : ""} on{" "}
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
          <div className="ml-auto flex max-sm:flex-col-reverse gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <EllipsisVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <SessionEditForm
                  data={data}
                  trigger={
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      aria-label="Edit group session">
                      Edit <PenIcon />
                    </DropdownMenuItem>
                  }
                />
                {!isMobile && (
                  <SessionAdvertisementDialog
                    trigger={
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        aria-label="Edit group session">
                        Advertise <MegaphoneIcon />
                      </DropdownMenuItem>
                    }
                    hostName={repr.name}
                    name={data.name}
                    code={data.code}
                  />
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={
                    !data.groups.some((group) => group.members.length > 0)
                  }
                  aria-label="Deallocate all group members"
                  variant="destructive"
                  onClick={async () => {
                    const result = await confirm({
                      message:
                        "All group members will be deallocated. This action can't be undone.",
                      actionMessage: "Deallocate",
                      actionVariant: "destructive",
                    });
                    if (!result) return;

                    clearAllGroupMembers();
                  }}>
                  Deallocate All Members
                  <FlameIcon />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
