import type { CoordinatorProgramDetail } from "@/interfaces/coordinator-program";
import type {
  ProgramPlanWeek,
  ProgramPlanWeekInput,
  ProgramWeekPlan,
} from "@/interfaces/program-week";

/** Mirrors the backend's WeeklyProgramWarning: what the review of a weekly program file points out. */
export enum WeeklyProgramWarningCode {
  TextCut = "TEXT_CUT",
  DatesDiffer = "DATES_DIFFER",
  WeeksDropped = "WEEKS_DROPPED",
  PhasesRebuilt = "PHASES_REBUILT",
  PhasesMerged = "PHASES_MERGED",
  NoPhases = "NO_PHASES",
}

/** `weeks` names the weeks the warning is about; empty when it is about the whole file. */
export type WeeklyProgramWarning = {
  code: WeeklyProgramWarningCode;
  weeks: number[];
};

/** A phase as a range of program weeks; its dates come from the program calendar. */
export type WeeklyProgramPhase = {
  name: string;
  expectedOutput: string | null;
  firstWeek: number;
  lastWeek: number;
  startDate: string;
  endDate: string;
};

/**
 * What saving would replace. `currentWeek` is the first week a keep-past save replaces (`totalWeeks + 1` once the
 * program has ended), or null until the program starts.
 */
export type WeeklyProgramExisting = {
  phaseCount: number;
  weekCount: number;
  currentWeek: number | null;
};

/**
 * A weekly program PDF read for review (`POST …/weekly-program/read`); nothing is saved. `notes` are lines of the
 * file that belong to no week (a demo day after the last week); `readingWarnings` are the AI's own remarks.
 */
export type WeeklyProgramProposal = {
  totalWeeks: number;
  weeks: ProgramPlanWeek[];
  phases: WeeklyProgramPhase[];
  warnings: WeeklyProgramWarning[];
  notes: string[];
  readingWarnings: string[];
  pageCount: number;
  existing: WeeklyProgramExisting;
};

export type WeeklyProgramPhaseInput = Pick<
  WeeklyProgramPhase,
  "name" | "expectedOutput" | "firstWeek" | "lastWeek"
>;

/** The reviewed plan, saved in one step (`PUT …/weekly-program`). */
export type SaveWeeklyProgramInput = {
  documentId: string;
  weeks: ProgramPlanWeekInput[];
  phases: WeeklyProgramPhaseInput[];
  /** The plan the coordinator was shown (`existing`); a plan that changed since is not overwritten. */
  seenPhaseCount: number;
  seenWeekCount: number;
  /** A running program keeps its past weeks and completed phases. */
  keepPast: boolean;
};

export type WeeklyProgramSaved = {
  program: CoordinatorProgramDetail;
  plan: ProgramWeekPlan;
};
