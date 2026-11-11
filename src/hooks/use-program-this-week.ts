"use client";

import { useQuery } from "@tanstack/react-query";

import { ClientApiError } from "@/lib/client/api";
import { getProgramThisWeek } from "@/lib/client/program-weeks";
import { programWeekCardState, weekPhase } from "@/lib/program-week";

export const PROGRAM_THIS_WEEK_QUERY_KEY = ["program", "this-week"] as const;

/**
 * "Bu hafta" on Süreç. Someone in no program (404) or outside the program (403) gets no card at all; any other
 * failure is shown on the card.
 */
export function useProgramThisWeek() {
  const query = useQuery({
    queryKey: PROGRAM_THIS_WEEK_QUERY_KEY,
    queryFn: getProgramThisWeek,
    retry: false,
  });
  const outside =
    query.error instanceof ClientApiError &&
    (query.error.status === 404 || query.error.status === 403);
  const week = query.data ?? null;
  return {
    week,
    state: week ? programWeekCardState(week) : null,
    phase: week ? weekPhase(week) : null,
    isLoading: query.isLoading,
    hidden: outside,
    error: outside ? null : query.error,
  };
}
