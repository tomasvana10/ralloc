"use client";

import type { ErrorProps } from "@web/app/error";
import { Alert, AlertDescription, AlertTitle } from "@web/components/ui/alert";
import { Button } from "@web/components/ui/button";
import { AlertCircleIcon, RotateCcwIcon } from "lucide-react";

export function BaseError({
  title,
  error,
  reset,
}: { title?: string } & ErrorProps) {
  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">
        <Alert>
          <AlertCircleIcon />
          <AlertTitle>{title || "An error occurred"}</AlertTitle>
          {error && (
            <AlertDescription className="mt-1">
              {error.name} - {error.message}
              {error.digest && (
                <span>
                  <b>Digest:</b> {error.digest}
                </span>
              )}
            </AlertDescription>
          )}
        </Alert>
        <div className="flex w-full justify-center">
          <Button onClick={reset}>
            <RotateCcwIcon className="h-4 w-4" />
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
