"use client";

import { SessionCreateForm } from "../features/forms/session-create/form";
import { SessionJoinForm } from "../features/forms/session-join";

export function HomeCards() {
  return (
    <div className="flex flex-col gap-2">
      <SessionJoinForm />
      <SessionCreateForm />
    </div>
  );
}
