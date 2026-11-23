"use client";

import { useEffect, useState } from "react";

const TICK_MS = 1_000;

/** The time, renewed every second while `isTicking`. */
export function useNow(isTicking: (now: Date) => boolean) {
  const [now, setNow] = useState(() => new Date());
  const ticks = isTicking(now);

  useEffect(() => {
    if (!ticks) return;
    const tick = () => {
      setNow(new Date());
    };
    // The time shown may be old if nothing ticked for a while.
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, TICK_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [ticks]);

  return now;
}
