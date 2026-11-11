"use client";

import { useState } from "react";

import { useProgramMeetingRatings } from "@/hooks/use-program-report";
import type { AdminOverview } from "@/interfaces/admin-overview";
import {
  pairsIn,
  programsOfType,
  ratingsFromDay,
  reportProgram,
  weekStarts,
} from "@/lib/admin-reporting";
import { ALL_PROGRAM_TYPES, type ProgramTypeFilter } from "@/lib/program-types";
import { ReportRange, ReportTab } from "@/types/admin-reporting";

/** Raporlama's choices (type, program, range, tab, selected pair) and what they put on screen. */
export function useAdminReporting(data: AdminOverview) {
  const [type, setType] = useState<ProgramTypeFilter>(ALL_PROGRAM_TYPES);
  const [programId, setProgramId] = useState<string | null>(null);
  const [range, setRange] = useState(ReportRange.EightWeeks);
  const [tab, setTab] = useState(ReportTab.Program);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const programs = programsOfType(data.programs, type);
  const program = reportProgram(programs, programId);
  const weeks = weekStarts(range, program?.createdAt);
  const pairs = program ? pairsIn(data, program) : [];
  const selected = pairs.find((pair) => pair.id === selectedId) ?? null;
  const ratingsFrom = ratingsFromDay(range, weeks);
  const ratingsQuery = useProgramMeetingRatings(
    program?.id ?? null,
    ratingsFrom,
  );

  return {
    type,
    /** A new type starts over with its default program and no pair selected. */
    chooseType: (value: ProgramTypeFilter) => {
      setType(value);
      setProgramId(null);
      setSelectedId(null);
    },
    programs,
    program,
    chooseProgram: (id: string) => {
      setProgramId(id);
      setSelectedId(null);
    },
    range,
    setRange,
    tab,
    setTab,
    weeks,
    pairs,
    selected,
    selectPair: setSelectedId,
    ratingsFrom,
    ratingsQuery,
  };
}
