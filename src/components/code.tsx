"use client";

import { CodeIcon } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function CopyableCode({
  className,
  children,
  copyValue,
  copyTimeoutMs = 1000,
  ...props
}: {
  copyValue: string;
  copyTimeoutMs?: number;
  copyButtonClassName?: string;
} & React.HTMLAttributes<HTMLElement>) {
  const [isCopied, setIsCopied] = React.useState(false);

  const handleCopy = async () => {
    if (isCopied) return;
    setIsCopied(true);
    await navigator.clipboard.writeText(copyValue);
    await new Promise((resolve) => setTimeout(resolve, copyTimeoutMs));
    setIsCopied(false);
  };

  return (
    <Badge
      asChild
      variant="outline"
      className={cn("cursor-pointer", className)}>
      <button
        type="button"
        onClick={handleCopy}
        disabled={isCopied}
        aria-label="copy value">
        <code {...props} className="flex items-center gap-1">
          <CodeIcon className="size-[1em]" />
          {isCopied ? "Copied!" : children}
        </code>
      </button>
    </Badge>
  );
}
