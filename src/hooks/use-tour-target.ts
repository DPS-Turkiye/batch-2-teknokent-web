"use client";

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
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

function subscribeToDom(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-tour"],
  });
  return () => observer.disconnect();
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
    () =>
      anchor === null
        ? null
        : document.querySelector<HTMLElement>(anchorSelector(anchor)),
    [anchor],
  );
  const element = useSyncExternalStore(
    subscribeToDom,
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

  // The highlight follows the element's own corners (a pill in the menu, a rounded card).
  const radius = useMemo(
    () => (element === null ? null : getComputedStyle(element).borderRadius),
    [element],
  );

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
