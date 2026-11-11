"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import type { SessionsExportFormat } from "@/interfaces/program-report";
import {
  getProgramMeetingFeedback,
  getProgramMeetingRatings,
  getProgramReport,
  getProgramSessions,
  programSessionsExportHref,
} from "@/lib/client/program-report";
import { isoDay } from "@/lib/coordinator-calendar";

export function useProgramReport(programId: string) {
  return useQuery({
    queryKey: ["program-report", programId],
    queryFn: () => getProgramReport(programId),
  });
}

/** `from` is a yyyy-mm-dd day; null counts every held meeting of the program. */
export function useProgramMeetingRatings(
  programId: string | null,
  from: string | null,
) {
  return useQuery({
    queryKey: ["program-meeting-ratings", programId, from],
    queryFn: () => getProgramMeetingRatings(programId!, from),
    enabled: Boolean(programId),
  });
}

/**
 * Who rated whom, a page at a time, for the same window as the averages. The
 * caller remounts this per program and window, so the page starts over.
 */
export function useProgramMeetingFeedback(
  programId: string | null,
  from: string | null,
) {
  const [page, setPage] = useState(0);
  const query = useQuery({
    queryKey: ["program-meeting-feedback", programId, from, page],
    queryFn: () => getProgramMeetingFeedback(programId!, { from, page }),
    enabled: Boolean(programId),
    placeholderData: keepPreviousData,
  });
  const totalPages = query.data?.totalPages ?? 0;
  return {
    feedback: query.data?.content ?? [],
    total: query.data?.totalElements ?? 0,
    page,
    totalPages,
    isLoading: query.isLoading,
    error: query.error,
    hasPrevious: page > 0,
    hasNext: page + 1 < totalPages,
    previous: () => setPage((current) => Math.max(0, current - 1)),
    next: () =>
      setPage((current) => (current + 1 < totalPages ? current + 1 : current)),
  };
}

function currentMonth(now = new Date()) {
  return {
    from: isoDay(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: isoDay(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}

/** Sessions and hours per mentor and per mentee for a day range, the current month to start with. */
export function useProgramSessions(programId: string) {
  const [range, setRange] = useState(() => currentMonth());
  const valid = Boolean(range.from && range.to) && range.from <= range.to;
  const query = useQuery({
    queryKey: ["program-sessions", programId, range.from, range.to],
    queryFn: () => getProgramSessions(programId, range.from, range.to),
    enabled: valid,
  });
  return {
    ...range,
    valid,
    query,
    setFrom: (from: string) => setRange((current) => ({ ...current, from })),
    setTo: (to: string) => setRange((current) => ({ ...current, to })),
    exportHref: (format: SessionsExportFormat) =>
      valid
        ? programSessionsExportHref(programId, { ...range, format })
        : undefined,
  };
}
