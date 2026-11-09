"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import type { AttendanceRange } from "@/interfaces/program-attendance";
import type { SessionsExportFormat } from "@/interfaces/program-report";
import {
  getProgramAttendance,
  programAttendanceExportHref,
} from "@/lib/client/program-attendance";

/**
 * The coordinator's weekly attendance report. With both days empty it covers
 * the program from its start to today; a range needs both days, in order.
 */
export function useProgramAttendance(programId: string) {
  const [days, setDays] = useState({ from: "", to: "" });
  const filtered = Boolean(days.from || days.to);
  const valid =
    !filtered || (Boolean(days.from && days.to) && days.from <= days.to);
  const range: AttendanceRange =
    filtered && valid ? { from: days.from, to: days.to } : null;
  const query = useQuery({
    queryKey: ["program-attendance", programId, range],
    queryFn: () => getProgramAttendance(programId, range),
    enabled: valid,
  });
  return {
    ...days,
    valid,
    filtered,
    query,
    setFrom: (from: string) => setDays((current) => ({ ...current, from })),
    setTo: (to: string) => setDays((current) => ({ ...current, to })),
    clear: () => setDays({ from: "", to: "" }),
    exportHref: (format: SessionsExportFormat) =>
      valid
        ? programAttendanceExportHref(programId, { range, format })
        : undefined,
  };
}
