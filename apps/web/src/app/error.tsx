"use client";

import { BaseError } from "@web/components/layout/error";
import type { Metadata } from "next";
import { useEffect } from "react";

export interface ErrorProps {
  error: { digest?: string } & Error;
  reset: () => void;
}

export const metadata: Metadata = {
  title: "Error",
};

export default function Error_({ error, reset }: ErrorProps) {
  useEffect(() => console.error(error), [error]);

  return <BaseError error={error} reset={reset} />;
}
