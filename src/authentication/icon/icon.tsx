import { useTheme } from "next-themes";
import React from "react";
import type { ProviderIconData, ProviderIconProps } from ".";

export function ProviderIcon({
  data,
  props,
}: {
  data: ProviderIconData;
  props?: ProviderIconProps;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!data.defaultIcon) return null;
  if (!mounted) return <data.defaultIcon {...props} />;

  const Icon = (resolvedTheme === "dark" && data.darkIcon) || data.defaultIcon;

  return <Icon {...props} />;
}
