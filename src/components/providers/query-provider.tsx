"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";

import { ACTIVITY_EVENTS, isPolledQuery, recordActivity } from "@/lib/poll";

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            // Without it every screen refetched everything on each visit. Mutations invalidate what they
            // change and polling refetches on its own schedule, so neither waits for this.
            staleTime: 30_000,
          },
        },
      }),
  );

  // Coming back after an idle stretch refreshes polled screens now instead of after the slower interval.
  useEffect(() => {
    const onActivity = () => {
      if (recordActivity()) {
        void queryClient.refetchQueries({
          type: "active",
          predicate: isPolledQuery,
        });
      }
    };
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true });
    }
    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity);
      }
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
