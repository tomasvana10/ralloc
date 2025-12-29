"use client";

import { Button } from "@web/components/ui/button";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";

export function ThemeCycler() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  function cycleTheme() {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  }

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
