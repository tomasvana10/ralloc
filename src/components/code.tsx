"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CodeProps extends React.HTMLAttributes<HTMLElement> {}

const defaultCodeStyles =
  "rounded-md bg-muted px-1 py-0.5 font-mono text-sm text-muted-foreground border border-border";

export function Code({ className, ...props }: CodeProps) {
  return <code className={cn(defaultCodeStyles, className)} {...props} />;
}

type CopyableCodeProps = CodeProps & {
  copyValue: string;
  copyTimeoutMs?: number;
  copyButtonClassName?: string;
};

export function CopyableCode({
  className,
  children,
  copyValue,
  copyTimeoutMs = 1000,
  ...props
}: CopyableCodeProps) {
  const [isCopied, setIsCopied] = React.useState(false);

  const handleCopy = async () => {
    if (isCopied) return;
    setIsCopied(true);
    await navigator.clipboard.writeText(copyValue);
    await new Promise((resolve) => setTimeout(resolve, copyTimeoutMs));
    setIsCopied(false);
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      disabled={isCopied}
      aria-label="copy value">
      <Code {...props}>{isCopied ? "Copied!" : children}</Code>
    </button>
  );
}
