"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getProgramMeetingRatings,
  getProgramReport,
} from "@/lib/client/program-report";

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
    queryFn: () => getProgramMeetingRatings(programId as string, from),
    enabled: Boolean(programId),
  });
}
