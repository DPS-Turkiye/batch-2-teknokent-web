import type { useTranslations } from "next-intl";

import {
  ProgramLifecycle,
  type CoordinatorProgram,
  type ProgramPhase,
} from "@/interfaces/coordinator-program";
import {
  ALL_PROGRAM_TYPES,
  matchesProgramType,
  type ProgramTypeFilter,
} from "@/lib/program-types";

export enum ProgramListFilter {
  All = "ALL",
  Draft = "DRAFT",
  Active = "ACTIVE",
  Upcoming = "UPCOMING",
  Completed = "COMPLETED",
}

export type ProgramsT = ReturnType<
  typeof useTranslations<"coordinatorPrograms">
>;

const FILTER_LIFECYCLE: Record<ProgramListFilter, ProgramLifecycle | null> = {
  [ProgramListFilter.All]: null,
  [ProgramListFilter.Draft]: ProgramLifecycle.Draft,
  [ProgramListFilter.Active]: ProgramLifecycle.Active,
  [ProgramListFilter.Upcoming]: ProgramLifecycle.Upcoming,
  [ProgramListFilter.Completed]: ProgramLifecycle.Completed,
};

export function programFilterOptions(
  programs: CoordinatorProgram[],
  t: ProgramsT,
) {
  return Object.values(ProgramListFilter).map((filter) => {
    const lifecycle = FILTER_LIFECYCLE[filter];
    const count = lifecycle
      ? programs.filter((program) => program.lifecycle === lifecycle).length
      : programs.length;
    return { id: filter, label: t(`filters.${filter}`, { count }) };
  });
}

export function filterPrograms(
  programs: CoordinatorProgram[],
  filter: ProgramListFilter,
  search: string,
  type: ProgramTypeFilter = ALL_PROGRAM_TYPES,
) {
  const lifecycle = FILTER_LIFECYCLE[filter];
  const term = search.trim().toLocaleLowerCase("tr");
  return programs.filter(
    (program) =>
      (!lifecycle || program.lifecycle === lifecycle) &&
      matchesProgramType(program.type, type) &&
      (!term || program.name.toLocaleLowerCase("tr").includes(term)),
  );
}

/** What the coordinator should look at: teams without a mentor, pending mentors, risky mentorships. */
export function openActionCount(program: CoordinatorProgram) {
  return (
    program.awaitingMatchCount +
    program.pendingMentorCount +
    program.riskyMentorshipCount
  );
}

/** A "YYYY-MM-DD" day at local midnight, so it never shifts a day with the time zone. */
export function parseDay(value: string) {
  return new Date(`${value}T00:00:00`);
}

/** "Şub 2026 – Ara 2026"; empty when the program has no dates yet. */
export function formatMonthRange(
  start: string | null,
  end: string | null,
  locale: string,
) {
  if (!start && !end) return "";
  const monthYear = new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "numeric",
  });
  const from = start ? monthYear.format(parseDay(start)) : "";
  const to = end ? monthYear.format(parseDay(end)) : "";
  return `${from} – ${to}`.trim();
}

export function daysUntil(date: string, today = new Date()) {
  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).getTime();
  return Math.max(
    0,
    Math.round((parseDay(date).getTime() - start) / 86_400_000),
  );
}

export enum PhaseState {
  Done = "DONE",
  Current = "CURRENT",
  Upcoming = "UPCOMING",
}

/** Phases before the current one are done; a completed program has finished them all. */
export function phaseStates(program: CoordinatorProgram) {
  const currentIndex = program.currentPhase
    ? program.phases.findIndex((phase) => phase.id === program.currentPhase?.id)
    : -1;
  return program.phases.map((phase: ProgramPhase, index) => {
    let state = PhaseState.Upcoming;
    if (program.lifecycle === ProgramLifecycle.Completed) {
      state = PhaseState.Done;
    } else if (currentIndex >= 0 && index < currentIndex) {
      state = PhaseState.Done;
    } else if (index === currentIndex) {
      state = PhaseState.Current;
    }
    return { phase, state };
  });
}
