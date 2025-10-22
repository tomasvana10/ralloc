"use client";

import * as React from "react";
import { SessionJoinForm } from "./forms/session-join-form";
import { SessionCreateForm } from "./forms/session-create-form";

export function HomeCards() {
  return (
    <div className="flex flex-col gap-6 lg:w-2/3">
      <SessionJoinForm />
      <SessionCreateForm />
    </div>
  );
}
