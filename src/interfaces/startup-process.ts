import type { ActionItemStatus } from "@/interfaces/action-item";
import type { UserRole } from "@/interfaces/session";

export enum StartupStageState {
  Completed = "COMPLETED",
  Current = "CURRENT",
  Upcoming = "UPCOMING",
}

/**
 * One Süreç card: a phase of the team's program. Its state comes from its dates; a phase without dates is
 * upcoming.
 */
export interface ProcessPhase {
  id: string;
  name: string;
  position: number;
  startDate: string | null;
  endDate: string | null;
  expectedOutput: string | null;
  state: StartupStageState;
}

/** A dated focus period, e.g. "MVP test turu" from 2 to 31 August. */
export interface StartupRound {
  id: string;
  title: string;
  name: string;
  /** The program phase the round falls in, or null. */
  phaseId: string | null;
  startsOn: string;
  endsOn: string;
}

/** An "Ödev" given to the startup, done once a file is submitted. */
export interface ProcessAssignment {
  id: string;
  roundId: string | null;
  /** The program phase the Ödev belongs to, or null ("Fazsız görevler"). */
  phaseId: string | null;
  title: string;
  description: string | null;
  status: ActionItemStatus;
  dueDate: string | null;
  submissionDocumentId: string | null;
  submissionFilename: string | null;
  createdByName: string | null;
  createdByRole: UserRole | null;
  createdAt: string;
}

export interface StartupProcess {
  organizationId: string;
  /** The phase today falls in, or null. */
  currentPhaseId: string | null;
  /** The phases of the team's program, in order; empty without a program or phases. */
  phases: ProcessPhase[];
  currentRound: StartupRound | null;
  rounds: StartupRound[];
  assignments: ProcessAssignment[];
}
