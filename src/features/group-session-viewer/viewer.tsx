"use client";

import React from "react";
import { toast } from "sonner";
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
  const { data, joinGroup, leaveGroup } = useGroupSession({
    code,
    onClose: (reason) => reason && toast.error(`Closed: '${reason}'`),
    onError: (msg) => toast.error(msg),
  });

  if (!data) return <p>loading data</p>;

  return (
    <>
      {hostId === data.hostId && <HostControls />}
      <CollapsibleGroupSessionDescription description="" />
      {data.groups.map(({ members, name }) => (
        // zod validation (through GroupSeed) prevents duplicate group names,
        // so using `name` as the key is fine
        <Group members={members} name={name} key={name} />
      ))}
      <p>{JSON.stringify(data.groups)}</p>
      <p>{data.frozen ? "Frozen" : "Not frozen"}</p>
    </>
  );
}

export function CollapsibleGroupSessionDescription({
  description,
}: {
  description: string;
}) {
  return <p>Description</p>;
}

const Group = React.memo(
  _Group,
  (prev, next) =>
    prev.name === next.name && prev.members.length === next.members.length,
);
export function _Group({ name, members }: { name: string; members: string[] }) {
  return <p>Group</p>;
}
