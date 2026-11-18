"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { ClientApiError } from "@/lib/client/api";
import { getProgramWeeksSoFar } from "@/lib/client/program-weeks";
import { pastWeeks } from "@/lib/program-week";

export const PROGRAM_PAST_WEEKS_QUERY_KEY = ["program", "past-weeks"] as const;

/**
 * "Geçmiş haftalar" on Süreç: the weeks before the running one, newest first. The backend sends only weeks that have
 * begun, so a later week never reaches the browser. The section stays out of the way while it loads, when there is no
 * past week yet, and for someone outside a program (404/403); any other failure is shown.
 */
export function useProgramPastWeeks() {
  const query = useQuery({
    queryKey: PROGRAM_PAST_WEEKS_QUERY_KEY,
    queryFn: getProgramWeeksSoFar,
    retry: false,
  });
  const outside =
    query.error instanceof ClientApiError &&
    (query.error.status === 404 || query.error.status === 403);
  const weeks = useMemo(() => pastWeeks(query.data?.weeks ?? []), [query.data]);
  // A failed refetch keeps the weeks already shown rather than swapping them for an error.
  const error = outside || query.data ? null : query.error;
  return {
    weeks,
    error,
    hidden: outside || query.isLoading || (!error && weeks.length === 0),
  };
}
