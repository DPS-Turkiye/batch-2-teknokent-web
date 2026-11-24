"use client";

import { useCallback } from "react";

/**
 * A ref for a section that shows up after the page has loaded: the browser's own jump to `#id` has already passed by
 * then, so the section scrolls itself into view once it is there.
 */
export function useScrollToHash(id: string) {
  return useCallback(
    (element: HTMLElement | null) => {
      if (element && window.location.hash === `#${id}`) {
        element.scrollIntoView({ block: "start" });
      }
    },
    [id],
  );
}
