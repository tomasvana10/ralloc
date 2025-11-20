"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemDescription,
  ItemHeader,
  ItemTitle,
} from "@/components/ui/item";
import { useGroupSession } from "./hooks";
import { HostControls } from "./host-controls";

export function GroupSessionViewer({
  code,
  hostId,
  userRepresentation,
}: {
  code: string;
  hostId: string;
  userRepresentation: {
    avatarUrl: string;
    name: string;
    userId: string;
    compressedUser: string;
  };
}) {
  const { data, joinGroup, leaveGroup, currentGroup } = useGroupSession({
    code,
    thisCompressedUser: userRepresentation.compressedUser,
    onClose: (reason) => reason && toast.error(`Closed: '${reason}'`),
    onError: (msg) => toast.error(msg),
  });

  if (!data) return <p>loading data</p>;

  return (
    <>
      {hostId === data.hostId && <HostControls />}
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
}: {
  name: string;
  members: string[];
  compressedUser: string;
  currentGroup: string | null;
} & Pick<ReturnType<typeof useGroupSession>, "joinGroup" | "leaveGroup">) {
  const isCurrent = currentGroup === name;
  return (
    <Item variant="outline" size="sm">
      <ItemHeader>
        <ItemTitle>{name}</ItemTitle>
      </ItemHeader>
      <ItemDescription>{members.join(", ")}</ItemDescription>
      <ItemActions>
        {isCurrent ? (
          <Button onClick={() => leave(name, compressedUser)}>Leave</Button>
        ) : (
          currentGroup && (
            <Button
              onClick={() => {
                if (currentGroup) leave(currentGroup, compressedUser);
                join(name, compressedUser);
              }}>
              Switch
            </Button>
          )
        )}
        {!currentGroup && (
          <Button onClick={() => join(name, compressedUser)}>Join</Button>
        )}
      </ItemActions>
    </Item>
  );
}
