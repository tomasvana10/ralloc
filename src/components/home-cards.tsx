"use client";

import { SessionJoinForm } from "./forms/session-join";
import { SessionCreateForm } from "./forms/session-create";

export function HomeCards() {
  return (
    <div className="flex flex-col gap-6 lg:w-2/3">
      <SessionJoinForm />
      <SessionCreateForm />
    </div>
  );
}
