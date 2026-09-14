import type { ActionItemStatus } from "@/interfaces/action-item";
import type { UserRole } from "@/interfaces/session";

/** Mirrors the backend's StartupStage; declaration order is the journey. */
export enum StartupStage {
  Problem = "PROBLEM",
  Solution = "SOLUTION",
  Mvp = "MVP",
  BusinessModel = "BUSINESS_MODEL",
  Market = "MARKET",
  Finance = "FINANCE",
  Pitch = "PITCH",
}

export enum StartupStageState {
  Completed = "COMPLETED",
  Current = "CURRENT",
  Upcoming = "UPCOMING",
}

export interface StartupStageProgress {
  stage: StartupStage;
  state: StartupStageState;
}

/** A dated focus period, e.g. "MVP test turu" from 2 to 31 August. */
export interface StartupRound {
  id: string;
  title: string;
  name: string;
  stage: StartupStage;
  startsOn: string;
  endsOn: string;
}

/** An "Ödev" given to the startup, done once a file is submitted. */
export interface ProcessAssignment {
  id: string;
  roundId: string | null;
  stage: StartupStage;
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
  currentStage: StartupStage | null;
  stages: StartupStageProgress[];
  currentRound: StartupRound | null;
  rounds: StartupRound[];
  assignments: ProcessAssignment[];
}
