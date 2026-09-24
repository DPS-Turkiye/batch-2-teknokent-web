import {
  type CoordinatorProgram,
  ProgramLifecycle,
  type ProgramPhase,
} from "@/interfaces/coordinator-program";

export enum ProgramListFilter {
  All = "ALL",
  Active = "ACTIVE",
  Upcoming = "UPCOMING",
  Completed = "COMPLETED",
}

const FILTER_LABELS: Record<ProgramListFilter, string> = {
  [ProgramListFilter.All]: "Tümü",
  [ProgramListFilter.Active]: "Aktif",
  [ProgramListFilter.Upcoming]: "Yaklaşan",
  [ProgramListFilter.Completed]: "Tamamlanan",
};

const FILTER_LIFECYCLE: Record<ProgramListFilter, ProgramLifecycle | null> = {
  [ProgramListFilter.All]: null,
  [ProgramListFilter.Active]: ProgramLifecycle.Active,
  [ProgramListFilter.Upcoming]: ProgramLifecycle.Upcoming,
  [ProgramListFilter.Completed]: ProgramLifecycle.Completed,
};

export function programFilterOptions(programs: CoordinatorProgram[]) {
  return Object.values(ProgramListFilter).map((filter) => {
    const lifecycle = FILTER_LIFECYCLE[filter];
    const count = lifecycle
      ? programs.filter((program) => program.lifecycle === lifecycle).length
      : programs.length;
    return { id: filter, label: `${FILTER_LABELS[filter]} ${count}` };
  });
}

export function filterPrograms(
  programs: CoordinatorProgram[],
  filter: ProgramListFilter,
  search: string,
) {
  const lifecycle = FILTER_LIFECYCLE[filter];
  const term = search.trim().toLocaleLowerCase("tr");
  return programs.filter(
    (program) =>
      (!lifecycle || program.lifecycle === lifecycle) &&
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

const MONTH_YEAR = new Intl.DateTimeFormat("tr-TR", {
  month: "short",
  year: "numeric",
});

function parseDay(value: string) {
  return new Date(`${value}T00:00:00`);
}

/** "Şub 2026 – Ara 2026"; empty when the program has no dates yet. */
export function formatMonthRange(start: string | null, end: string | null) {
  if (!start && !end) return "";
  const from = start ? MONTH_YEAR.format(parseDay(start)) : "";
  const to = end ? MONTH_YEAR.format(parseDay(end)) : "";
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
