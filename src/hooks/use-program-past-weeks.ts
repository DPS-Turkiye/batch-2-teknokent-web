"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import type { ProgramWeekSoFar } from "@/interfaces/program-week";
import { ClientApiError } from "@/lib/client/api";
import { getProgramWeeksSoFar } from "@/lib/client/program-weeks";
import { pastWeeks, upcomingWeeks } from "@/lib/program-week";

export const PROGRAM_PAST_WEEKS_QUERY_KEY = ["program", "past-weeks"] as const;

// `pick` is a module-level function (pastWeeks, upcomingWeeks), so it never changes the memo below.
function useProgramWeeksSoFar(
  pick: (weeks: readonly ProgramWeekSoFar[]) => ProgramWeekSoFar[],
) {
  const query = useQuery({
    queryKey: PROGRAM_PAST_WEEKS_QUERY_KEY,
    queryFn: getProgramWeeksSoFar,
    retry: false,
  });
  const outside =
    query.error instanceof ClientApiError &&
    (query.error.status === 404 || query.error.status === 403);
  const weeks = useMemo(
    () => pick(query.data?.weeks ?? []),
    [pick, query.data],
  );
  // A failed refetch keeps the weeks already shown rather than swapping them for an error.
  const error = outside || query.data ? null : query.error;
  return { weeks, error, outside, isLoading: query.isLoading };
}

/**
 * "Geçmiş haftalar" on Süreç: the weeks before the running one, newest first. The backend sends only weeks that have
 * begun or that the coordinator opened early, and never a hidden one. The section stays out of the way while it
 * loads, when there is no past week yet, and for someone outside a program (404/403); any other failure is shown.
 */
export function useProgramPastWeeks() {
  const { weeks, error, outside, isLoading } = useProgramWeeksSoFar(pastWeeks);
  return {
    weeks,
    error,
    hidden: outside || isLoading || (!error && weeks.length === 0),
  };
}

/**
 * "Yaklaşan haftalar" on Süreç: the weeks the coordinator opened before they begin, soonest first. Shares the
 * request with "Geçmiş haftalar", which reports a failure, so this section only ever hides.
 */
export function useProgramUpcomingWeeks() {
  const { weeks, error, isLoading } = useProgramWeeksSoFar(upcomingWeeks);
  return { weeks, hidden: isLoading || error !== null || weeks.length === 0 };
}
