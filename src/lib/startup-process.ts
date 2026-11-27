import { ActionItemStatus } from "@/interfaces/action-item";
import type { ProgramThisWeek } from "@/interfaces/program-week";
import { UserRole } from "@/interfaces/session";
import {
  StartupStageState,
  type ProcessAssignment,
  type ProcessPhase,
  type StartupProcess,
  type StartupRound,
} from "@/interfaces/startup-process";
import { calendarDay, formatDayMonth } from "@/lib/utils";

export enum ChipTone {
  Amber = "amber",
  Gray = "gray",
  Green = "green",
}

export const STAGE_STATE_TONES: Record<StartupStageState, ChipTone> = {
  [StartupStageState.Current]: ChipTone.Amber,
  [StartupStageState.Completed]: ChipTone.Green,
  [StartupStageState.Upcoming]: ChipTone.Gray,
};

export const ASSIGNMENT_STATUS_TONES: Record<ActionItemStatus, ChipTone> = {
  [ActionItemStatus.Open]: ChipTone.Amber,
  [ActionItemStatus.InProgress]: ChipTone.Gray,
  [ActionItemStatus.Completed]: ChipTone.Green,
  [ActionItemStatus.Cancelled]: ChipTone.Gray,
};

/** "2 · 31 Ağu" within one month, "28 Tem · 5 Ağu" across two. */
export function formatRoundRange(
  startsOn: string,
  endsOn: string,
  locale = "tr",
) {
  const start = calendarDay(startsOn);
  const end = calendarDay(endsOn);
  const sameMonth =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth();
  const from = sameMonth
    ? String(start.getDate())
    : formatDayMonth(start, locale);
  return `${from} · ${formatDayMonth(end, locale)}`;
}

/** "12 Haz – 8 Tem 2026" */
export function formatStageRange(
  startsOn: string,
  endsOn: string,
  locale = "tr",
) {
  const end = calendarDay(endsOn);
  return `${formatDayMonth(calendarDay(startsOn), locale)} – ${formatDayMonth(end, locale)} ${end.getFullYear()}`;
}

/** Who set an assignment, as a `startupProcess.source` key. */
export function assignmentSourceKind(role: UserRole | null) {
  if (role === UserRole.Mentor) return "mentor" as const;
  if (role === UserRole.Coordinator || role === UserRole.Admin) {
    return "program" as const;
  }
  return "startup" as const;
}

export type CompletedPhaseRow = {
  phase: ProcessPhase;
  completedAssignments: number;
};

/** The program phases already behind the team, with how many Ödevler it finished in each. */
export function completedPhases(process: StartupProcess): CompletedPhaseRow[] {
  return process.phases
    .filter((phase) => phase.state === StartupStageState.Completed)
    .map((phase) => ({
      phase,
      completedAssignments: process.assignments.filter(
        (assignment) =>
          assignment.phaseId === phase.id &&
          assignment.status === ActionItemStatus.Completed,
      ).length,
    }));
}

/** The card's button, as a `startupProcess.action` key. */
export type PhaseAction = "current" | "completed" | "continue" | "start";

export type PhaseCard = {
  phase: ProcessPhase;
  done: number;
  total: number;
  percent: number;
  action: PhaseAction;
};

/** One Süreç card per program phase: how many of its Ödevler are done, cancelled ones left out. */
export function phaseCards(process: StartupProcess): PhaseCard[] {
  return process.phases.map((phase) => {
    const own = process.assignments.filter(
      (assignment) =>
        assignment.phaseId === phase.id &&
        assignment.status !== ActionItemStatus.Cancelled,
    );
    const done = own.filter(
      (assignment) => assignment.status === ActionItemStatus.Completed,
    ).length;
    const percent =
      own.length > 0
        ? Math.round((done / own.length) * 100)
        : phase.state === StartupStageState.Completed
          ? 100
          : 0;
    const action: PhaseAction =
      phase.state === StartupStageState.Current
        ? "current"
        : phase.state === StartupStageState.Completed
          ? "completed"
          : done > 0
            ? "continue"
            : "start";
    return { phase, done, total: own.length, percent, action };
  });
}

/** The round a phase card opens: the focus round when it is in that phase, else the phase's latest round. */
export function roundForPhase(
  process: StartupProcess,
  phaseId: string,
): StartupRound | null {
  if (process.currentRound?.phaseId === phaseId) return process.currentRound;
  return (
    process.rounds
      .filter((round) => round.phaseId === phaseId)
      .sort((left, right) => right.startsOn.localeCompare(left.startsOn))[0] ??
    null
  );
}

/** A handed-in file the team may still swap for another (the backend closes this after the due day). */
export function canReplaceSubmission(assignment: ProcessAssignment): boolean {
  return (
    assignment.status === ActionItemStatus.Completed &&
    assignment.submissionDocumentId !== null &&
    // A backend without the field leaves it out; falsy, so the swap stays hidden.
    assignment.replaceable
  );
}

/** Ödevler no phase covers: they are listed under "Fazsız görevler". */
export function unphasedAssignments(
  assignments: readonly ProcessAssignment[],
): ProcessAssignment[] {
  return assignments.filter((assignment) => assignment.phaseId === null);
}

/** The Süreç search parameter naming the Ödev a link points at. */
export const PROCESS_FOCUS_PARAM = "assignment";

/** The Süreç page opened on one Ödev: its phase is shown and its row brought into view. */
export function processAssignmentHref(assignmentId: string): string {
  return `/startup/process?${PROCESS_FOCUS_PARAM}=${encodeURIComponent(assignmentId)}`;
}

/** The name of the phase an Ödev belongs to, or null for one no phase covers. */
export function assignmentPhaseName(
  assignment: ProcessAssignment,
  phases: readonly ProcessPhase[],
): string | null {
  const { phaseId } = assignment;
  if (phaseId === null) return null;
  return phases.find((phase) => phase.id === phaseId)?.name ?? null;
}

/**
 * Where Süreç opens for a linked Ödev: its phase, or "Fazsız görevler" when no phase covers it. Null when the
 * link names no Ödev of the team (or there are no phases to pick from).
 */
export function focusedSelection(
  process: StartupProcess,
  assignmentId: string | null,
): { phaseId: string | null; unphased: boolean } | null {
  if (!assignmentId || process.phases.length === 0) return null;
  const assignment = process.assignments.find(
    (item) => item.id === assignmentId,
  );
  if (!assignment) return null;
  return assignment.phaseId === null
    ? { phaseId: null, unphased: true }
    : { phaseId: assignment.phaseId, unphased: false };
}

/** The phase today falls in, or null. */
export function currentPhase(process: StartupProcess): ProcessPhase | null {
  return (
    process.phases.find((phase) => phase.id === process.currentPhaseId) ?? null
  );
}

export type SoftwareDevelopmentCard = {
  state: StartupStageState;
  /** The program's start and end; null unless both are set. */
  dates: { startsOn: string; endsOn: string } | null;
};

/**
 * "Yazılım geliştirme" on Süreç: the team builds its software for the whole program, so the card follows the
 * program's dates rather than a phase. It reads the same before/after flags as "Bu hafta" so the two never
 * disagree. Null outside a program.
 */
export function softwareDevelopmentCard(
  week: ProgramThisWeek | null,
): SoftwareDevelopmentCard | null {
  if (!week) return null;
  const state = week.ended
    ? StartupStageState.Completed
    : week.notStarted
      ? StartupStageState.Upcoming
      : StartupStageState.Current;
  const { programStart, programEnd } = week;
  return {
    state,
    dates:
      programStart && programEnd
        ? { startsOn: programStart, endsOn: programEnd }
        : null,
  };
}
