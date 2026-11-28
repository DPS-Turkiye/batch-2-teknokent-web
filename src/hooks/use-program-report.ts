"use client";

import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import type { SessionsExportFormat } from "@/interfaces/program-report";
import { ToastTone } from "@/interfaces/toast";
import {
  downloadProgramSessions,
  getProgramMeetingFeedback,
  getProgramMeetingRatings,
  getProgramReport,
  getProgramSessions,
} from "@/lib/client/program-report";
import { isoDay } from "@/lib/coordinator-calendar";
import { errorMessage } from "@/lib/utils";
import { useToast } from "@/stores/toast-store";

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
  const t = useTranslations("programReport.sessions");
  const { showToast } = useToast();
  const [range, setRange] = useState(() => currentMonth());
  const valid = Boolean(range.from && range.to) && range.from <= range.to;
  const query = useQuery({
    queryKey: ["program-sessions", programId, range.from, range.to],
    queryFn: () => getProgramSessions(programId, range.from, range.to),
    enabled: valid,
  });
  const download = useMutation({
    mutationFn: (format: SessionsExportFormat) =>
      downloadProgramSessions(programId, { ...range, format }),
    onError: (error: Error) => {
      showToast({
        message: errorMessage(error, t("exportFailed")),
        tone: ToastTone.Error,
      });
    },
  });
  return {
    ...range,
    valid,
    query,
    setFrom: (from: string) => setRange((current) => ({ ...current, from })),
    setTo: (to: string) => setRange((current) => ({ ...current, to })),
    /** Whether a file can be asked for now: a valid range, and no file on its way. */
    canExport: valid && !download.isPending,
    exportFile: (format: SessionsExportFormat) => {
      if (valid && !download.isPending) download.mutate(format);
    },
  };
}
