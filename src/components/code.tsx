"use client";

import * as React from "react";
import { RING_BUTTON_STYLES } from "@/lib/constants";
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
      type="button"
      onClick={handleCopy}
      disabled={isCopied}
      aria-label="copy value"
      className={cn(RING_BUTTON_STYLES, className)}>
      <code {...props}>{isCopied ? "Copied!" : children}</code>
    </button>
  );
}
