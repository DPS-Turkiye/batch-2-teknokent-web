"use client";

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useState,
  useSyncExternalStore,
} from "react";

import { anchorSelector, isInteractiveElement } from "@/lib/product-tour";
import type { Box, TourAnchor } from "@/types/product-tour";

/** How long a step waits for its element (a page loading, a list filling) before it carries on without it. */
export const TARGET_WAIT_MS = 3_000;

const boxes = new WeakMap<Element, Box>();

/** The element's place on screen, as the same object while it has not moved (a stable store snapshot). */
function boxOf(element: Element | null): Box | null {
  if (element === null) return null;
  const rect = element.getBoundingClientRect();
  const previous = boxes.get(element);
  if (
    previous?.top === rect.top &&
    previous.left === rect.left &&
    previous.width === rect.width &&
    previous.height === rect.height
  ) {
    return previous;
  }
  const box = {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
  boxes.set(element, box);
  return box;
}

// Watches the whole page: a step's element can appear anywhere (a list filling, a dialog opening). A tour runs for
// a minute or so, and each change costs one querySelectorAll.
function subscribeToDom(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-tour", "class", "style", "hidden"],
  });
  return () => observer.disconnect();
}

/** The page changes, and so does which copy of an element is shown (the desktop menu hides on a phone). */
function subscribeToPage(onChange: () => void) {
  const unsubscribeDom = subscribeToDom(onChange);
  window.addEventListener("resize", onChange);
  return () => {
    unsubscribeDom();
    window.removeEventListener("resize", onChange);
  };
}

/** The first shown element with this anchor: a hidden copy (the desktop menu on a phone) does not count. */
function visibleAnchor(anchor: TourAnchor) {
  const matches = document.querySelectorAll<HTMLElement>(anchorSelector(anchor));
  return [...matches].find((element) => element.checkVisibility()) ?? null;
}

function subscribeToViewport(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

function viewportWidth() {
  return window.innerWidth;
}

function viewportHeight() {
  return window.innerHeight;
}

function serverNothing() {
  return null;
}

function serverZero() {
  return 0;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Finds the element a step points at (`data-tour`), follows where it is on screen, and reports a click on it.
 * `waitKey` names the wait: a new step waits again even when it points at an element of the same name.
 */
export function useTourTarget(
  anchor: TourAnchor | null,
  waitKey: string,
  onTargetClick: (() => void) | null,
) {
  const findElement = useCallback(
    () => (anchor === null ? null : visibleAnchor(anchor)),
    [anchor],
  );
  const element = useSyncExternalStore(
    subscribeToPage,
    findElement,
    serverNothing,
  );

  const subscribeToLayout = useCallback(
    (onChange: () => void) => {
      if (element === null) return () => undefined;
      const resize = new ResizeObserver(onChange);
      resize.observe(element);
      const unsubscribeDom = subscribeToDom(onChange);
      window.addEventListener("scroll", onChange, {
        capture: true,
        passive: true,
      });
      window.addEventListener("resize", onChange);
      return () => {
        resize.disconnect();
        unsubscribeDom();
        window.removeEventListener("scroll", onChange, { capture: true });
        window.removeEventListener("resize", onChange);
      };
    },
    [element],
  );
  const box = useSyncExternalStore(
    subscribeToLayout,
    () => boxOf(element),
    serverNothing,
  );
  // The highlight follows the element's own corners (a pill in the menu, a rounded card).
  const radius = useSyncExternalStore(
    subscribeToLayout,
    () => (element === null ? null : getComputedStyle(element).borderRadius),
    serverNothing,
  );
  const width = useSyncExternalStore(
    subscribeToViewport,
    viewportWidth,
    serverZero,
  );
  const height = useSyncExternalStore(
    subscribeToViewport,
    viewportHeight,
    serverZero,
  );

  const [expiredWait, setExpiredWait] = useState<string | null>(null);
  useEffect(() => {
    if (anchor === null) return;
    const timer = window.setTimeout(
      () => setExpiredWait(waitKey),
      TARGET_WAIT_MS,
    );
    return () => window.clearTimeout(timer);
  }, [anchor, waitKey]);

  useEffect(() => {
    if (element === null) return;
    const rect = element.getBoundingClientRect();
    if (rect.top >= 0 && rect.bottom <= window.innerHeight) return;
    element.scrollIntoView({
      block: "center",
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, [element]);

  const reportClick = useEffectEvent(() => onTargetClick?.());
  const listens = onTargetClick !== null;
  useEffect(() => {
    if (element === null || !listens) return;
    // Capture phase: the click still reaches the page (a link navigates, a button submits), and a handler that
    // stops propagation cannot hide it from the tour.
    function onClick(event: MouseEvent) {
      if (event.target instanceof Node && element?.contains(event.target)) {
        reportClick();
      }
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [element, listens]);

  return {
    element,
    box,
    radius,
    viewport: { width, height },
    /** The element did not turn up in time: the step carries on without a highlight. */
    missing: element === null && anchor !== null && expiredWait === waitKey,
    /** Whether a keyboard user can press the element; otherwise the card also offers "İleri". */
    interactive: element !== null && isInteractiveElement(element),
  };
}
