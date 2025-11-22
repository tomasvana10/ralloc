import * as React from "react";

export function useIsBelowBreakpoint(breakpoint: number) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof window.matchMedia !== "function") return;

    const media = window.matchMedia(`(max-width: ${breakpoint}px)`);

    const handler = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    setIsMobile(media.matches);

    try {
      media.addEventListener("change", handler);
    } catch {
      media.addListener(handler);
    }

    return () => {
      try {
        media.removeEventListener("change", handler);
      } catch {
        media.removeListener(handler);
      }
    };
  }, [breakpoint]);

  return isMobile;
}
