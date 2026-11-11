import { useMemo, useSyncExternalStore } from "react";

const LOCATION_CHANGED = "test:location-changed";

let historyPatched = false;

/** pushState and replaceState fire no event of their own; the App Router hears them, so the stand-in does too. */
function patchHistory() {
  if (historyPatched) return;
  historyPatched = true;
  const push = window.history.pushState.bind(window.history);
  const replace = window.history.replaceState.bind(window.history);
  window.history.pushState = (...args) => {
    push(...args);
    window.dispatchEvent(new Event(LOCATION_CHANGED));
  };
  window.history.replaceState = (...args) => {
    replace(...args);
    window.dispatchEvent(new Event(LOCATION_CHANGED));
  };
}

function subscribe(onChange: () => void) {
  patchHistory();
  window.addEventListener(LOCATION_CHANGED, onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener(LOCATION_CHANGED, onChange);
    window.removeEventListener("popstate", onChange);
  };
}

/**
 * useSearchParams the way the App Router gives it in the browser: it follows pushState, replaceState and Back.
 * Mock next/navigation's useSearchParams with it in tests of screens that keep their state in the URL.
 */
export function useLocationSearchParams() {
  const query = useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => "",
  );
  return useMemo(() => new URLSearchParams(query), [query]);
}
