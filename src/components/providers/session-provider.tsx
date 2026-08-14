"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import type { DemoSession } from "@/interfaces/session";

const SessionContext = createContext<DemoSession | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<DemoSession | null>(null);

  useEffect(() => {
    let active = true;
    void fetch("/api/session", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (active && data) setSession(data as DemoSession);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}

export function useDemoSession() {
  return useContext(SessionContext);
}
