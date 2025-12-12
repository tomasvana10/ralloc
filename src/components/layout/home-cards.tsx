"use client";

import { SessionCreateForm } from "@/features/forms/group-session/create/form";
import { SessionJoinForm } from "@/features/forms/group-session/join";

export function HomeCards() {
  return (
    <div className="flex flex-col gap-2">
      <SessionJoinForm />
      <SessionCreateForm />
    </div>
  );
}
