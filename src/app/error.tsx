"use client";

import type { Metadata } from "next";
import { useEffect } from "react";
import { BaseError } from "@/components/layout/error";

export interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export const metadata: Metadata = {
  title: "Error",
};

export default function Error_({ error, reset }: ErrorProps) {
  useEffect(() => console.error(error), [error]);

  return <BaseError error={error} reset={reset} />;
}
