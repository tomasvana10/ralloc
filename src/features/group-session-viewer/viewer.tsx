"use client";

import {
  BrushCleaning,
  CircleXIcon,
  LogOutIcon,
  PlusIcon,
  SearchIcon,
  SwitchCameraIcon,
} from "lucide-react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { useRouter } from "next/navigation";
import React from "react";
import { useRemark } from "react-remark";
import { toast } from "sonner";
import { ClientAvatar } from "@/components/avatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import type { GroupSessionData } from "@/db/group-session";
import { useIsBelowBreakpoint } from "@/hooks/is-below-breakpoint";
import { UserRepresentation } from "@/lib/group-session";
import { GroupSessionS2C } from "@/lib/group-session/messaging";
import { cn } from "@/lib/utils";
import { SessionEditForm } from "../forms/session-edit/form";
import { useGroupSession } from "./hooks";

function getGroupBorderClasses(
  index: number,
  visibleTotal: number,
  isMobile: boolean,
) {
  if (isMobile) return cn("[div+div]:border-t", index === 0 && "border-t-0");

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

export function GroupSessionViewer({
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
  const [groupQuery, setGroupQuery] = React.useState("");
  const { data, joinGroup, leaveGroup, currentGroup, lock } = useGroupSession({
    code,
    thisCompressedUser: userRepresentation.compressedUser,
    onOpen: () => toast.info("You are connected to the group session."),
    onClose: (code) => {
      if (code === 1005) return; // likely caused by the user redirecting to a new page, so ignore
      if (code === GroupSessionS2C.CloseEventCodes.GroupSessionWasDeleted) {
        toast.error(
          "This group session was deleted. You will be redirected in 3 seconds.",
        );
        lock();
        return setTimeout(() => router.push("/"), 3000);
      }
      if (code === GroupSessionS2C.CloseEventCodes.RateLimited) {
        toast.error(
          "You have been rate limited - please try again later. You will be redirected in 3 seconds.",
        );
        lock();
        return setTimeout(() => router.push("/"), 3000);
      }

      toast.error(
        `Your connection was closed (code ${code}). Your client is attempting to reconnect...`,
      );
    },
    onError: (msg) => toast.error(msg),
    onReconnectStop: (n) => {
      setTimeout(() => {
        lock();
        toast.warning(
          `Your client has exceeded the maximum amount of reconnection attempts (${n}). You will be redirected in 3 seconds.`,
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

  if (!data) return <Spinner className="size-24 stroke-1 w-full" />;

  return (
    <>
      <GroupSessionInfo
        data={data}
        isHost={userRepresentation.userId === data.hostId}
      />

      <div className="sm:my-5 my-4">
        {currentGroup ? (
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
              frozen={data.frozen}
            />
          </div>
        ) : (
          <CurrentGroupEmpty />
        )}
      </div>

      <Field>
        <FieldLabel htmlFor="group-search">
          <SearchIcon className="size-4" />
          Search for a group
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
            variant="destructive"
            size="icon"
            onClick={() => setGroupQuery("")}>
            <CircleXIcon />
          </Button>
        </div>
      </Field>

      {groupCollection.length === 0 ? (
        <GroupCollectionEmpty />
      ) : (
        <ScrollArea className="rounded-sm border border-border">
          <div className="max-h-[calc(100vh-19.5rem)] min-h-[75px]">
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
                  frozen={data.frozen}
                />
              ))}
            </div>
          </div>
        </ScrollArea>
      )}
    </>
  );
}

function GroupSessionInfo({
  data,
  isHost,
}: {
  data: GroupSessionData;
  isHost: boolean;
}) {
  const repr = UserRepresentation.fromCompressedString(data.compressedHost);
  const [reactMarkdown, setReactMarkdown] = useRemark();

  React.useEffect(() => {
    if (data.description) {
      setReactMarkdown(data.description);
    }
  }, [data.description, setReactMarkdown]);

  return (
    <div className="flex flex-col mb-4 gap-2">
      <div className="flex flex-row items-center sm:gap-4 gap-2">
        <ClientAvatar
          image={repr.avatarUrl}
          name={repr.name}
          className="size-16 bg-card border border-accent"
        />
        <div className="flex flex-col gap-2">
          <h1 className="text-lg font-semibold leading-none wrap-break-word hyphens-auto">
            {data.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Created by {repr.name} on{" "}
            {new Date(data.createdOn).toLocaleDateString()}
          </p>
        </div>
        {isHost && (
          <div className="ml-auto">
            <SessionEditForm
              code={data.code}
              data={{
                description: data.description,
                frozen: data.frozen,
                name: data.name,
                groupSize: data.groupSize,
              }}
            />
          </div>
        )}
      </div>
      {data.description && (
        <Accordion
          type="single"
          collapsible
          className="bg-accent/20 p-4 rounded-sm">
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

const _groupAnimationVariants: Variants = {
  hidden: { width: 0, opacity: 0, scale: 0.8 },
  visible: {
    width: "auto",
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 350,
      damping: 25,
    },
  },
  exit: (isThisUser: boolean) => ({
    width: 0,
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: isThisUser ? 0 : 0.2,
    },
  }),
};

function Group({
  name,
  members,
  groupSize,
  compressedUser,
  currentGroupName,
  joinGroup: join,
  leaveGroup: leave,
  isWithinCollection,
  frozen,
  className,
}: {
  name: string;
  members: string[];
  groupSize: number;
  compressedUser: string;
  currentGroupName: string | null;
  isWithinCollection: boolean;
  className?: string;
} & Pick<ReturnType<typeof useGroupSession>, "joinGroup" | "leaveGroup"> &
  Pick<GroupSessionData, "frozen">) {
  const isCurrentGroup = currentGroupName === name;
  const isFull = members.length === groupSize;
  const isCurrentGroupAndWithinCollection =
    isCurrentGroup && isWithinCollection;

  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    isFirstRender.current = false;
  }, []);

  const { userRepresentations, thisUserId } = React.useMemo(() => {
    return {
      userRepresentations: members.map((member) =>
        UserRepresentation.fromCompressedString(member),
      ),
      thisUserId:
        UserRepresentation.fromCompressedString(compressedUser).userId,
    };
  }, [members, compressedUser]);

  return (
    <Item
      variant="outline"
      size="sm"
      className={cn(
        className,
        "flex flex-row min-h-[90px]",
        isCurrentGroup && !isWithinCollection
          ? "bg-accent/20 border-primary"
          : isCurrentGroupAndWithinCollection && "bg-black/20",
      )}>
      <ItemContent
        className={cn(
          "flex h-full",
          isCurrentGroupAndWithinCollection
            ? "justify-center"
            : "justify-between",
        )}>
        <ItemTitle className="wrap-break-word hyphens-auto">{name}</ItemTitle>
        {!isCurrentGroupAndWithinCollection && (
          <div className="flex flex-col justify-end">
            {!members.length && <ItemDescription>No members</ItemDescription>}

            <div className="flex flex-row items-center gap-2">
              {isFull && <strong>Full</strong>}
              <div className="isolate flex -space-x-2">
                <AnimatePresence mode="popLayout">
                  {userRepresentations.map((repr, i) => {
                    const isThisUser = repr.userId === thisUserId;

                    // if this group was joined by the client, animate them in.
                    // otherwise, they shouldn't be animated (unless it's the first render)
                    const shouldAnimateEntry =
                      isThisUser || !isFirstRender.current;

                    return (
                      <motion.div
                        key={repr.userId}
                        layout
                        custom={isThisUser}
                        variants={_groupAnimationVariants}
                        initial={shouldAnimateEntry ? "hidden" : false}
                        animate="visible"
                        exit="exit"
                        style={{
                          // final avatar must be on top of all the others
                          zIndex: i === members.length - 1 ? 2 : 1,
                        }}>
                        <ClientAvatar
                          image={repr.avatarUrl}
                          name={repr.name}
                          imageProps={{
                            draggable: false,
                            className: "select-none",
                          }}
                          className="bg-card border border-accent ring-card relative ring-2 shrink-0"
                        />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}
      </ItemContent>
      <ItemActions>
        {isCurrentGroup ? (
          <Button
            variant="destructive"
            size="icon-lg"
            disabled={frozen}
            onClick={() => leave(name, compressedUser)}
            aria-label="leave group">
            <LogOutIcon />
          </Button>
        ) : (
          currentGroupName && (
            <Button
              size="icon-lg"
              disabled={frozen || isFull}
              onClick={() => {
                if (currentGroupName) leave(currentGroupName, compressedUser);
                join(name, compressedUser);
              }}
              aria-label="switch group">
              <SwitchCameraIcon />
            </Button>
          )
        )}
        {!currentGroupName && (
          <Button
            disabled={frozen || isFull}
            size="icon-lg"
            onClick={() => join(name, compressedUser)}
            aria-label="join group">
            <PlusIcon />
          </Button>
        )}
      </ItemActions>
    </Item>
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

function GroupCollectionEmpty() {
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
