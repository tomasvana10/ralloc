"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemDescription,
  ItemHeader,
  ItemTitle,
} from "@/components/ui/item";
import type { GroupSessionData } from "@/db/group-session";
import { GroupSessionS2C } from "@/lib/group-session/messaging";
import { useGroupSession } from "./hooks";
import { HostControls } from "./host-controls";

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

  if (!data) return <p>loading data</p>;

  return (
    <>
      {userRepresentation.userId === data.hostId && <HostControls />}
      <CollapsibleGroupSessionDescription
        description={data.description || "no description"}
      />
      <p>Current group: {JSON.stringify(currentGroup)}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {data.groups.map(({ members, name }) => (
          // zod validation (through GroupSeed) prevents duplicate group names,
          // so using `name` as the key is fine
          <Group
            key={name}
            members={members}
            name={name}
            compressedUser={userRepresentation.compressedUser}
            currentGroup={currentGroup?.name ?? null}
            joinGroup={joinGroup}
            leaveGroup={leaveGroup}
            frozen={data.frozen}
          />
        ))}
      </div>
    </>
  );
}

function CollapsibleGroupSessionDescription({
  description,
}: {
  description: string;
}) {
  return <p>{description}</p>;
}

function Group({
  name,
  members,
  compressedUser,
  currentGroup,
  joinGroup: join,
  leaveGroup: leave,
  frozen,
}: {
  name: string;
  members: string[];
  compressedUser: string;
  currentGroup: string | null;
} & Pick<ReturnType<typeof useGroupSession>, "joinGroup" | "leaveGroup"> &
  Pick<GroupSessionData, "frozen">) {
  const isCurrent = currentGroup === name;
  return (
    <Item variant="outline" size="sm">
      <ItemHeader>
        <ItemTitle>{name}</ItemTitle>
      </ItemHeader>
      <ItemDescription>{members.join(", ")}</ItemDescription>
      <ItemActions>
        {isCurrent ? (
          <Button disabled={frozen} onClick={() => leave(name, compressedUser)}>
            Leave
          </Button>
        ) : (
          currentGroup && (
            <Button
              disabled={frozen}
              onClick={() => {
                if (currentGroup) leave(currentGroup, compressedUser);
                join(name, compressedUser);
              }}>
              Switch
            </Button>
          )
        )}
        {!currentGroup && (
          <Button disabled={frozen} onClick={() => join(name, compressedUser)}>
            Join
          </Button>
        )}
      </ItemActions>
    </Item>
  );
}
