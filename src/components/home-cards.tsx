"use client";

import { SessionJoinForm } from "./forms/session-join";
import { SessionCreateForm } from "./forms/session-create/form";

export function HomeCards() {
  return (
    <div className="flex flex-col gap-2">
      <SessionJoinForm />
      <SessionCreateForm />
    </div>
  );
}
