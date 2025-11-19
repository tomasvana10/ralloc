"use client";

import React from "react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useGroupSession } from "./hooks";

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
  const { data, joinGroup, leaveGroup } = useGroupSession({
    code,
    onClose: (reason) =>
      reason && toast.error(`Group session closed due to '${reason}'`),
    onError: (msg) => toast.error(msg),
  });

  const [group, setGroup] = React.useState<string | null>(null);

  if (!data) return <p>loading data</p>;

  return (
    <>
      <Input onChange={(e) => setGroup(e.target.value)}></Input>
      <Button
        onClick={() => joinGroup(group, userRepresentation.compressedUser)}>
        Join Group
      </Button>
      <Button
        onClick={() => leaveGroup(group, userRepresentation.compressedUser)}>
        Leave Group
      </Button>
      <p>{JSON.stringify(data.groups)}</p>
    </>
  );
}
