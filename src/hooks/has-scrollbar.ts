import * as React from "react";

export function useHasScrollbar<T extends HTMLElement>() {
  const ref = React.useRef<T>(null);
  const [hasScrollbar, setHasScrollbar] = React.useState(false);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const checkScrollbar = () => {
      setHasScrollbar(el.scrollHeight > el.clientHeight);
    };
    checkScrollbar();

    const ob = new ResizeObserver(checkScrollbar);
    ob.observe(el);

    return () => ob.disconnect();
  }, []);

  return { ref, hasScrollbar };
}
