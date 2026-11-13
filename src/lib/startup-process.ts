import { ActionItemStatus } from "@/interfaces/action-item";
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

/** Ödevler no phase covers: they are listed under "Fazsız görevler". */
export function unphasedAssignments(
  assignments: readonly ProcessAssignment[],
): ProcessAssignment[] {
  return assignments.filter((assignment) => assignment.phaseId === null);
}

/** The phase today falls in, or null. */
export function currentPhase(process: StartupProcess): ProcessPhase | null {
  return (
    process.phases.find((phase) => phase.id === process.currentPhaseId) ?? null
  );
}
