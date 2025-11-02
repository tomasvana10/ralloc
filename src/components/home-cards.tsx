"use client";

import { SessionJoinForm } from "./forms/session-join";
import { SessionCreateForm } from "./forms/session-create/form";

interface Props {
  userId: string;
}

export function HomeCards({ userId }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <SessionJoinForm />
      <SessionCreateForm userId={userId} />
    </div>
  );
}
