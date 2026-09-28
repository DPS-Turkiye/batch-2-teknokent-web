import { ActionItemStatus } from "@/interfaces/action-item";
import { UserRole } from "@/interfaces/session";
import {
  type ProcessAssignment,
  type StartupProcess,
  type StartupRound,
  StartupStage,
  StartupStageState,
} from "@/interfaces/startup-process";
import { calendarDay, formatDayMonth } from "@/lib/utils";

export const STARTUP_STAGE_LABELS: Record<StartupStage, string> = {
  [StartupStage.Problem]: "Problem",
  [StartupStage.Solution]: "Çözüm",
  [StartupStage.Mvp]: "MVP",
  [StartupStage.BusinessModel]: "İş Modeli",
  [StartupStage.Market]: "Pazar",
  [StartupStage.Finance]: "Finans",
  [StartupStage.Pitch]: "Pitch",
};

export enum ChipTone {
  Amber = "amber",
  Gray = "gray",
  Green = "green",
}

export const ASSIGNMENT_STATUS_CHIPS: Record<
  ActionItemStatus,
  { label: string; tone: ChipTone }
> = {
  [ActionItemStatus.Open]: { label: "Yüklenmedi", tone: ChipTone.Amber },
  [ActionItemStatus.InProgress]: {
    label: "Devam ediyor",
    tone: ChipTone.Gray,
  },
  [ActionItemStatus.Completed]: { label: "Tamamlandı", tone: ChipTone.Green },
  [ActionItemStatus.Cancelled]: { label: "İptal edildi", tone: ChipTone.Gray },
};

/** "2 · 31 Ağu" within one month, "28 Tem · 5 Ağu" across two. */
export function formatRoundRange(startsOn: string, endsOn: string) {
  const start = calendarDay(startsOn);
  const end = calendarDay(endsOn);
  const sameMonth =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth();
  const from = sameMonth ? String(start.getDate()) : formatDayMonth(start);
  return `${from} · ${formatDayMonth(end)}`;
}

/** "12 Haz – 8 Tem 2026" */
export function formatStageRange(startsOn: string, endsOn: string) {
  const end = calendarDay(endsOn);
  return `${formatDayMonth(calendarDay(startsOn))} – ${formatDayMonth(end)} ${end.getFullYear()}`;
}

/** "Teslim 30 Ağu" */
export function formatDueLabel(dueDate: string) {
  return `Teslim ${formatDayMonth(calendarDay(dueDate))}`;
}

function sourceKind(role: UserRole | null) {
  if (role === UserRole.Mentor) return "mentorluk ödevi";
  if (role === UserRole.Coordinator || role === UserRole.Admin) {
    return "program ödevi";
  }
  return "startup ödevi";
}

/** "Çağrı Yılmaz · mentorluk ödevi · MVP test turu" */
export function assignmentSource(
  assignment: ProcessAssignment,
  roundName: string | null,
) {
  return [
    assignment.createdByName,
    sourceKind(assignment.createdByRole),
    roundName,
  ]
    .filter(Boolean)
    .join(" · ");
}

export type CompletedStageRow = {
  stage: StartupStage;
  startsOn: string | null;
  endsOn: string | null;
  completedAssignments: number;
};

/** The stages already behind the startup, with the rounds and Ödevler they took. */
export function completedStages(process: StartupProcess): CompletedStageRow[] {
  return process.stages
    .filter((progress) => progress.state === StartupStageState.Completed)
    .map(({ stage }) => {
      const rounds = process.rounds.filter((round) => round.stage === stage);
      const starts = rounds.map((round) => round.startsOn).sort();
      const ends = rounds.map((round) => round.endsOn).sort();
      return {
        stage,
        startsOn: starts[0] ?? null,
        endsOn: ends.at(-1) ?? null,
        completedAssignments: process.assignments.filter(
          (assignment) =>
            assignment.stage === stage &&
            assignment.status === ActionItemStatus.Completed,
        ).length,
      };
    });
}

export type StageCard = {
  stage: StartupStage;
  state: StartupStageState;
  done: number;
  total: number;
  percent: number;
  action: string;
};

/** One Süreç card per stage: how many of its Ödevler are done, cancelled ones left out. */
export function stageCards(process: StartupProcess): StageCard[] {
  return process.stages.map(({ stage, state }) => {
    const own = process.assignments.filter(
      (assignment) =>
        assignment.stage === stage &&
        assignment.status !== ActionItemStatus.Cancelled,
    );
    const done = own.filter(
      (assignment) => assignment.status === ActionItemStatus.Completed,
    ).length;
    const percent =
      own.length > 0
        ? Math.round((done / own.length) * 100)
        : state === StartupStageState.Completed
          ? 100
          : 0;
    const action =
      state === StartupStageState.Current
        ? "Mevcut aşama"
        : state === StartupStageState.Completed
          ? "Tamamlandı"
          : done > 0
            ? "Devam et"
            : "Başla";
    return { stage, state, done, total: own.length, percent, action };
  });
}

/** The round a stage card opens: the focus round for its stage, else that stage's latest round. */
export function roundForStage(
  process: StartupProcess,
  stage: StartupStage,
): StartupRound | null {
  if (process.currentRound?.stage === stage) return process.currentRound;
  return (
    process.rounds
      .filter((round) => round.stage === stage)
      .sort((left, right) => right.startsOn.localeCompare(left.startsOn))[0] ??
    null
  );
}
