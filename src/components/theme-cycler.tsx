"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";
import { Button } from "@/components/ui/button";

export function ThemeCycler() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const cycleTheme = React.useCallback(() => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  }, [theme, setTheme]);

  if (!mounted) {
    return (
      <Button variant="outline" size="icon-lg" disabled>
        <span className="sr-only">Cycle theme</span>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon-lg"
      onClick={cycleTheme}
      aria-label="Cycle theme">
      {theme === "light" && <Sun className="size-[1.2rem]" />}
      {theme === "dark" && <Moon className="size-[1.2rem]" />}
      {theme === "system" && <Monitor className="size-[1.2rem]" />}
      <span className="sr-only">Cycle theme</span>
    </Button>
  );
}
