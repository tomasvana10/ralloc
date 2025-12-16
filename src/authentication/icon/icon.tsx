"use client";

import { useTheme } from "next-themes";
import React from "react";
import type { OfficialProvider } from "../provider";
import { PROVIDER_ICON_DATA, type ProviderIconProps } from ".";

export function ProviderIcon({
  provider,
  props,
}: {
  provider: OfficialProvider;
  props?: ProviderIconProps;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const data = PROVIDER_ICON_DATA[provider];

  if (!data.defaultIcon) return null;
  if (!mounted) return <data.defaultIcon {...props} />;

  const Icon = (resolvedTheme === "dark" && data.darkIcon) || data.defaultIcon;

  return <Icon {...props} />;
}
