import { LogOutIcon, PlusIcon, SwitchCameraIcon } from "lucide-react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import React from "react";
import { ClientAvatar } from "@/components/auth/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { GroupSessionData } from "@/db/group-session";
import { UserRepresentation } from "@/lib/group-session";
import { cn } from "@/lib/utils";
import type { useGroupSession } from "../hooks";

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

const _groupHiddenCountAnimationVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 350,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.2,
    },
  },
};

/*
const sampleUsers = [
  "usr_001\u001fAlice Chen\u001fgithub\u001f12345678",
  "usr_002\u001fBob Martinez\u001fgithub\u001f23456789",
  "usr_003\u001fCharlie Kim\u001fgithub\u001f34567890",
  "usr_004\u001fDiana Patel\u001fgithub\u001f45678901",
  "usr_005\u001fEvan Williams\u001fgithub\u001f56789012",
  "usr_006\u001fFiona O'Brien\u001fgithub\u001f67890123",
  "usr_007\u001fGeorge Tanaka\u001fgithub\u001f78901234",
  "115662810602353634604\u001fTomas\u001fgoogle\u001fACg8ocIkgBPZy6cH-BBMtxVEdNJBkSxQfvokbHi_SN9fvoIW6XGoBURv",
  "124552709\u001fTomas Vana\u001fgithub\u001f124552709",
  "usr_008\u001fHannah Lee Very Long Name\u001fgoogle\u001fACg8ocJxK2mN3pQ4rS5tU6vW7xY8zA",
  "usr_009\u001fIvan Petrov\u001fgoogle\u001fACg8ocBbC3dE4fG5hI6jK7lM8nO9pQ",
  "usr_010\u001fJulia Santos\u001fgoogle\u001fACg8ocRrS3tU4vW5xY6zA7bC8dE9fG",
  "usr_011\u001fKevin Murphy\u001fgoogle\u001fACg8ocHhI3jK4lM5nO6pQ7rS8tU9vW",
  "usr_012\u001fLaura Schmidt\u001fgoogle\u001fACg8ocXxY3zA4bC5dE6fG7hI8jK9lM",
  "usr_013\u001fMike Johnson\u001fgithub\u001f\u001e",
  "usr_014\u001fNina Kowalski\u001fgoogle\u001f\u001e",
  "usr_015\u001fOscar Nguyen\u001fgithub\u001f\u001e",
];
*/

export function Group({
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
  below,
}: {
  name: string;
  members: string[];
  groupSize: number;
  compressedUser: string;
  currentGroupName: string | null;
  isWithinCollection: boolean;
  className?: string;
  below: {
    w768: boolean;
    w640: boolean;
    w350: boolean;
  };
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

  // only animate layout shifts if the members have changed.
  // this prevents unecessary animations when additional elements are
  // rendered (e.g. the host adds a description which causes all the content)
  // to shift down
  const layoutDependency = React.useMemo(
    () => userRepresentations.map((repr) => repr.userId).join(","),
    [userRepresentations],
  );

  const maxVisibleUsers = below.w350 ? 4 : below.w640 ? 6 : below.w768 ? 3 : 5;
  const visibleUsers = userRepresentations.slice(0, maxVisibleUsers);
  const hiddenUsers = userRepresentations.length - maxVisibleUsers;

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
        <ItemTitle className="wrap-break-word hyphens-auto">
          {name} {isFull && <Badge variant="destructive">Full</Badge>}
        </ItemTitle>
        {!isCurrentGroupAndWithinCollection && (
          <div className="flex flex-col justify-end">
            {!members.length && <ItemDescription>No members</ItemDescription>}

            <div className="flex flex-row items-center gap-2">
              <GroupMembersModal
                name={name}
                thisUserId={thisUserId}
                userRepresentations={userRepresentations}
                trigger={
                  <button
                    type="button"
                    className="isolate flex -space-x-2 cursor-pointer">
                    <AnimatePresence mode="popLayout">
                      {visibleUsers.map((repr, i) => {
                        const isThisUser = repr.userId === thisUserId;

                        const shouldAnimateEntry =
                          isThisUser || !isFirstRender.current;

                        return (
                          <motion.div
                            key={repr.userId}
                            layout
                            layoutDependency={layoutDependency}
                            custom={isThisUser}
                            variants={_groupAnimationVariants}
                            initial={shouldAnimateEntry ? "hidden" : false}
                            animate="visible"
                            exit="exit"
                            style={{
                              zIndex: i,
                            }}>
                            <ClientAvatar
                              image={repr.avatarUrl}
                              name={repr.name}
                              imageProps={{
                                draggable: false,
                                className: "select-none",
                              }}
                              className={cn(
                                "bg-card border border-accent relative ring-2 shrink-0",
                                isThisUser ? "ring-primary/80" : "ring-card",
                              )}
                            />
                          </motion.div>
                        );
                      })}
                      {hiddenUsers > 0 && (
                        <motion.div
                          layout
                          layoutDependency={layoutDependency}
                          variants={_groupHiddenCountAnimationVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="ml-4 flex items-center justify-center size-8 rounded-full bg-muted border border-accent text-xs font-medium ring-2 ring-card">
                          +{hiddenUsers}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                }
              />
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

export function GroupMembersModal({
  userRepresentations,
  thisUserId,
  name,
  trigger,
}: {
  userRepresentations: UserRepresentation[];
  thisUserId: string;
  name: string;
  trigger: React.ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader className="text-left">
          <DialogTitle>{name}</DialogTitle>
          <DialogDescription>Members</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] sm:max-h-[70vh]">
          <ul className="grid grid-cols-1 min-[550px]:grid-cols-2 gap-2 pr-4 pl-1">
            {userRepresentations.map((repr) => {
              const isThisUser = repr.userId === thisUserId;
              return (
                <li
                  key={repr.userId}
                  className="py-1 flex items-center gap-2 min-w-0">
                  <ClientAvatar
                    image={repr.avatarUrl}
                    name={repr.name}
                    imageProps={{
                      draggable: false,
                      className: "select-none",
                    }}
                    className={cn(
                      "bg-card border border-accent relative ring-2 shrink-0",
                      isThisUser ? "ring-primary/80" : "ring-card",
                    )}
                  />
                  <span className="flex items-center gap-1.5 min-w-0">
                    {isThisUser && <Badge className="shrink-0">You</Badge>}
                    <span className="truncate">{repr.name}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="sm:min-w-[80px]">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
