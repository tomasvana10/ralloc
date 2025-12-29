"use client";

import { SessionCreateForm } from "@web/features/forms/group-session/create";
import { SessionJoinForm } from "@web/features/forms/group-session/join";

export function HomeCards() {
  return (
    <div className="flex flex-col gap-2">
      <SessionJoinForm />
      <SessionCreateForm />
    </div>
  );
}
