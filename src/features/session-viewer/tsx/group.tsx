import {
  EllipsisVerticalIcon,
  LogOutIcon,
  PlusIcon,
  SwitchCameraIcon,
  TrashIcon,
} from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { GroupSessionData } from "@/db/group-session";
import { confirm } from "@/features/confirm";
import { UserRepresentation } from "@/lib/group-session";
import { cn } from "@/lib/utils";
import type { UseGroupSessionReturn } from "../use-group-session";

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

const decompressedUserCache = new Map<string, UserRepresentation>();

function getDecompressedUser(compressedString: string) {
  if (!decompressedUserCache.has(compressedString)) {
    decompressedUserCache.set(
      compressedString,
      UserRepresentation.fromCompressedString(compressedString),
    );
  }
  return decompressedUserCache.get(compressedString)!;
}

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

export const Group = React.memo(_Group);
export function _Group({
  name,
  members,
  groupSize,
  compressedUser,
  currentGroupName,
  isWithinCollection,
  maxVisibleAvatarsPerGroup,
  isHost,
  joinGroup,
  leaveGroup,
  removeGroup,
  clearGroupMembers,
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
  maxVisibleAvatarsPerGroup: number;
  isHost: boolean;
  joinGroup: UseGroupSessionReturn["joinGroup"];
  leaveGroup: UseGroupSessionReturn["leaveGroup"];
  removeGroup: UseGroupSessionReturn["removeGroup"];
  clearGroupMembers: UseGroupSessionReturn["clearGroupMembers"];
} & Pick<GroupSessionData, "frozen">) {
  const isCurrentGroup = currentGroupName === name;
  const isFull = members.length === groupSize;
  const isCurrentGroupAndWithinCollection =
    isCurrentGroup && isWithinCollection;
  const isInteractive = !frozen && !isHost && (!isFull || isCurrentGroup);

  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    isFirstRender.current = false;
  }, []);

  const userRepresentations = React.useMemo(
    () => members.map(getDecompressedUser),
    [members],
  );
  const thisUserId = React.useMemo(
    () => getDecompressedUser(compressedUser).userId,
    [compressedUser],
  );

  const visibleUsers = userRepresentations.slice(0, maxVisibleAvatarsPerGroup);
  const hiddenUserCount =
    userRepresentations.length - maxVisibleAvatarsPerGroup;
  const id = `${name}-${isWithinCollection ? "collection" : "active"}`;

  return (
    <Item
      asChild
      variant="outline"
      size="sm"
      className={cn(
        className,
        "flex flex-row min-h-[90px]",
        isInteractive && "hover:bg-accent/20",
        isCurrentGroup && !isWithinCollection
          ? "bg-accent/20 border-primary"
          : isCurrentGroupAndWithinCollection && "bg-accent/20",
      )}>
      <Label htmlFor={id}>
        <ItemContent
          className={cn(
            "flex h-full min-h-[64px]",
            isCurrentGroupAndWithinCollection
              ? "justify-center"
              : "justify-between",
          )}>
          <ItemTitle className="wrap-break-word hyphens-auto">
            {name} {isFull && <Badge variant="destructive">Full</Badge>}
          </ItemTitle>
          {!isCurrentGroupAndWithinCollection && (
            <div className="flex flex-col justify-end">
              {!members.length && <ItemDescription>Empty</ItemDescription>}

              {!!members.length && (
                <div className="flex flex-row items-center gap-2">
                  <GroupMembersModal
                    name={name}
                    thisUserId={thisUserId}
                    userRepresentations={userRepresentations}
                    hiddenUserCount={hiddenUserCount}
                    isFirstRender={isFirstRender}
                    visibleUsers={visibleUsers}
                  />
                </div>
              )}
            </div>
          )}
        </ItemContent>
        <ItemActions>
          {isHost ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                asChild
                className="select-none cursor-pointer">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Group options">
                  <EllipsisVerticalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {isCurrentGroup ? (
                  <DropdownMenuItem
                    disabled={frozen}
                    aria-label="Leave group"
                    className="flex justify-between items-center w-full cursor-pointer"
                    onClick={() => leaveGroup(name, compressedUser)}>
                    Leave <LogOutIcon />
                  </DropdownMenuItem>
                ) : currentGroupName ? (
                  <DropdownMenuItem
                    disabled={frozen || isFull}
                    aria-label="Switch group"
                    className="flex justify-between items-center w-full cursor-pointer"
                    onClick={() => {
                      if (currentGroupName)
                        leaveGroup(currentGroupName, compressedUser);
                      joinGroup(name, compressedUser);
                    }}>
                    Switch <SwitchCameraIcon />
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    disabled={frozen || isFull}
                    aria-label="Join group"
                    className="flex justify-between items-center w-full cursor-pointer"
                    onClick={() => joinGroup(name, compressedUser)}>
                    Join <PlusIcon />
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  aria-label="Delete group"
                  className="flex justify-between items-center w-full cursor-pointer"
                  onClick={async () => {
                    if (members.length) {
                      const result = await confirm({
                        message:
                          "This group has allocated members which will be removed on deletion. This action can't be undone.",
                        actionMessage: "Delete",
                        actionVariant: "destructive",
                      });
                      if (!result) return;
                    }

                    removeGroup(name);
                  }}>
                  Delete <TrashIcon />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : isCurrentGroup ? (
            <Button
              id={isInteractive ? id : undefined}
              variant="outline"
              className="border-primary dark:border-primary dark:hover:bg-accent/90"
              size="icon"
              disabled={frozen}
              onClick={(e) => {
                e.preventDefault();
                leaveGroup(name, compressedUser);
              }}
              aria-label="Leave group">
              <LogOutIcon />
            </Button>
          ) : currentGroupName ? (
            <Button
              id={isInteractive ? id : undefined}
              size="icon"
              variant="outline"
              className="dark:hover:bg-accent/90"
              disabled={frozen || isFull}
              onClick={(e) => {
                e.preventDefault();
                if (currentGroupName)
                  leaveGroup(currentGroupName, compressedUser);
                joinGroup(name, compressedUser);
              }}
              aria-label="Switch group">
              <SwitchCameraIcon />
            </Button>
          ) : (
            <Button
              id={isInteractive ? id : undefined}
              disabled={frozen || isFull}
              size="icon"
              className="dark:hover:bg-accent/90"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                joinGroup(name, compressedUser);
              }}
              aria-label="Join group">
              <PlusIcon />
            </Button>
          )}
        </ItemActions>
      </Label>
    </Item>
  );
}

export function GroupMembersModal({
  userRepresentations,
  thisUserId,
  name,
  visibleUsers,
  hiddenUserCount,
  isFirstRender,
}: {
  userRepresentations: UserRepresentation[];
  thisUserId: string;
  name: string;
  visibleUsers: UserRepresentation[];
  hiddenUserCount: number;
  isFirstRender: React.RefObject<boolean>;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="isolate flex -space-x-2 cursor-pointer p-0 h-auto ring-offset-2 ring-offset-card"
          aria-label="View group members">
          <AnimatePresence mode="popLayout">
            {visibleUsers.map((repr, i) => {
              const isThisUser = repr.userId === thisUserId;

              const shouldAnimateEntry = isThisUser || !isFirstRender.current;

              return (
                <motion.div
                  key={repr.userId}
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
            {hiddenUserCount > 0 && (
              <div className="ml-4 flex items-center justify-center size-8 rounded-full bg-muted border border-accent text-xs font-medium ring-2 ring-card">
                +{hiddenUserCount}
              </div>
            )}
          </AnimatePresence>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className="text-left">
          <DialogTitle>{name}</DialogTitle>
          <DialogDescription>
            {userRepresentations.length} member
            {userRepresentations.length === 1 ? "" : "s"}
          </DialogDescription>
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
