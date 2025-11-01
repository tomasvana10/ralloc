"use client";

import { SessionJoinForm } from "./forms/session-join";
import { SessionCreateForm } from "./forms/session-create/form";
import { MySessions } from "./my-sessions";

interface Props {
  userId: string;
}

export function HomeCards({ userId }: Props) {
  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full max-w-5xl">
      <div className="flex-[5] flex flex-col gap-6">
        <SessionJoinForm />
        <SessionCreateForm userId={userId} />
      </div>

      <div className="flex-[3] flex flex-col gap-6">
        <MySessions userId={userId} />
      </div>
    </div>
  );
}
