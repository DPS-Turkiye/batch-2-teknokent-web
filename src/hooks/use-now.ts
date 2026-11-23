"use client";

import { useEffect, useState } from "react";

const TICK_MS = 1_000;

/** The time, renewed every second while `isTicking`. */
export function useNow(isTicking: (now: Date) => boolean) {
  const [now, setNow] = useState(() => new Date());
  const ticks = isTicking(now);

  useEffect(() => {
    if (!ticks) return;
    const timer = setInterval(() => {
      setNow(new Date());
    }, TICK_MS);
    return () => {
      clearInterval(timer);
    };
  }, [ticks]);

  return now;
}
