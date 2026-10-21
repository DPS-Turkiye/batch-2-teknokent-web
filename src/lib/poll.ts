export const POLL_INTERVAL = {
  chat: 10_000,
  messages: 15_000,
  background: 60_000,
} as const;

export const ACTIVITY_EVENTS = [
  "pointerdown",
  "keydown",
  "touchstart",
  "wheel",
] as const;

// Hidden tabs already pause TanStack polling; this slows a visible tab nobody is using.
const IDLE_AFTER_MS = 2 * 60_000;
const IDLE_SLOWDOWN = 4;

let lastActivity = Date.now();

export function isIdle(now = Date.now()) {
  return now - lastActivity > IDLE_AFTER_MS;
}

/** Returns true when this activity ends an idle stretch. */
export function recordActivity(now = Date.now()) {
  const wasIdle = isIdle(now);
  lastActivity = now;
  return wasIdle;
}

export function polling(ms: number) {
  return {
    refetchInterval: () => (isIdle() ? ms * IDLE_SLOWDOWN : ms),
    meta: { polled: true },
  };
}

export function isPolledQuery(query: { meta?: Record<string, unknown> }) {
  return query.meta?.polled === true;
}

export function whenVisible(tick: () => void) {
  return () => {
    if (!document.hidden) tick();
  };
}
