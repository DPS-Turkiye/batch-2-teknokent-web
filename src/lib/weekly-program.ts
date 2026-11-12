import type {
  SaveWeeklyProgramInput,
  WeeklyProgramExisting,
  WeeklyProgramPhase,
  WeeklyProgramPhaseInput,
} from "@/interfaces/weekly-program";
import { ClientApiError } from "@/lib/client/api";
import { MAX_PHASES } from "@/lib/coordinator-program-detail";
import { withKeys, withoutKeys, type Keyed } from "@/lib/keyed-list";
import { weekInputOf, type WeekDraft } from "@/lib/program-week";

/** The backend's limits for what the review edits. */
export const PHASE_NAME_MAX_LENGTH = 120;
export const PHASE_OUTPUT_MAX_LENGTH = 200;
export const WEEK_TITLE_MAX_LENGTH = 160;

/** The phase picker's value for a week no phase covers. */
export const NO_PHASE = -1;

/** A phase under review: a named range of program weeks. */
export type PhaseRangeDraft = Keyed<WeeklyProgramPhaseInput>;

export function phaseRangeDraftsOf(
  phases: readonly WeeklyProgramPhase[],
): PhaseRangeDraft[] {
  return withKeys(
    phases.map(({ name, expectedOutput, firstWeek, lastWeek }) => ({
      name,
      expectedOutput,
      firstWeek,
      lastWeek,
    })),
  );
}

/** The position of the phase a week falls in, or -1 for a week between phases. */
export function phaseIndexOfWeek(
  phases: readonly WeeklyProgramPhaseInput[],
  week: number,
) {
  return phases.findIndex(
    (phase) => phase.firstWeek <= week && week <= phase.lastWeek,
  );
}

/**
 * Puts `week` in the phase at `target`, keeping the phases in order and apart: the target grows up to the week,
 * the phases in between give up the weeks it takes, and a phase left with no weeks is removed.
 */
export function moveWeekToPhase<T extends WeeklyProgramPhaseInput>(
  phases: readonly T[],
  week: number,
  target: number,
): T[] {
  const chosen = phases[target];
  if (!chosen || (chosen.firstWeek <= week && week <= chosen.lastWeek)) {
    return [...phases];
  }
  const growsForward = chosen.lastWeek < week;
  return phases
    .map((phase, index) => {
      if (index === target) {
        return growsForward
          ? { ...phase, lastWeek: week }
          : { ...phase, firstWeek: week };
      }
      if (growsForward && index > target && phase.firstWeek <= week) {
        return { ...phase, firstWeek: week + 1 };
      }
      if (!growsForward && index < target && phase.lastWeek >= week) {
        return { ...phase, lastWeek: week - 1 };
      }
      return phase;
    })
    .filter((phase) => phase.firstWeek <= phase.lastWeek);
}

export enum PhaseRangeProblem {
  MissingName = "MISSING_NAME",
  TooMany = "TOO_MANY",
  OutOfOrder = "OUT_OF_ORDER",
  PastTheEnd = "PAST_THE_END",
}

/** Why the phases can't be saved yet, or null. */
export function phaseRangeProblem(
  phases: readonly WeeklyProgramPhaseInput[],
  totalWeeks: number,
) {
  if (phases.some((phase) => !phase.name.trim())) {
    return PhaseRangeProblem.MissingName;
  }
  if (phases.length > MAX_PHASES) return PhaseRangeProblem.TooMany;
  let previousLast = 0;
  for (const phase of phases) {
    if (
      !Number.isInteger(phase.firstWeek) ||
      !Number.isInteger(phase.lastWeek) ||
      phase.lastWeek < phase.firstWeek ||
      phase.firstWeek <= previousLast
    ) {
      return PhaseRangeProblem.OutOfOrder;
    }
    if (phase.lastWeek > totalWeeks) return PhaseRangeProblem.PastTheEnd;
    previousLast = phase.lastWeek;
  }
  return null;
}

/** The last week a save leaves as it is, or null when the whole plan is replaced. */
export function lastKeptWeek(
  existing: WeeklyProgramExisting,
  keepPast: boolean,
) {
  if (!keepPast || existing.currentWeek === null || existing.currentWeek < 2) {
    return null;
  }
  return existing.currentWeek - 1;
}

/** Whether keeping the past leaves every week as it is, because the program has ended. */
export function keepsEveryWeek(lastKept: number | null, totalWeeks: number) {
  return lastKept !== null && lastKept >= totalWeeks;
}

/**
 * Whether saving replaces a plan the program already has, so the coordinator must confirm it. The save sends back
 * the plan the read counted; if it changed in between, the backend refuses the save instead of overwriting it.
 */
export function replacesExistingPlan(existing: WeeklyProgramExisting) {
  return existing.phaseCount > 0 || existing.weekCount > 0;
}

export function weeklyProgramSaveInput({
  documentId,
  weeks,
  phases,
  existing,
  keepPast,
}: {
  documentId: string;
  weeks: readonly WeekDraft[];
  phases: readonly PhaseRangeDraft[];
  existing: WeeklyProgramExisting;
  keepPast: boolean;
}): SaveWeeklyProgramInput {
  return {
    documentId,
    weeks: weeks.map(weekInputOf),
    phases: withoutKeys(phases).map((phase) => ({
      ...phase,
      name: phase.name.trim(),
      expectedOutput: phase.expectedOutput?.trim() || null,
    })),
    seenPhaseCount: existing.phaseCount,
    seenWeekCount: existing.weekCount,
    keepPast,
  };
}

const CONFLICT = 409;

/** The save was refused because the program's plan changed after the file was read. */
export function isStalePlanError(failure: unknown) {
  return failure instanceof ClientApiError && failure.status === CONFLICT;
}

/** "8 ve 10" for the weeks a warning is about. */
export function weekListLabel(weeks: readonly number[], locale: string) {
  return new Intl.ListFormat(locale, { type: "conjunction" }).format(
    weeks.map(String),
  );
}
