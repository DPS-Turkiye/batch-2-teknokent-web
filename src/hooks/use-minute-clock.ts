"use client";

import { useEffect, useState } from "react";

const MINUTE_MS = 60_000;

/** The current time, re-read every minute, for screens whose rules flip at a clock time (a send window opening). */
export function useMinuteClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), MINUTE_MS);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}
