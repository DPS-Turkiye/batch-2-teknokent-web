/** Where one team stands with a program Ödev ("Ödev ver"). */
export enum ProgramAssignmentSubmissionState {
  /** Handed in on time, or with no due date. */
  Submitted = "SUBMITTED",
  /** Handed in after the due date. */
  Late = "LATE",
  /** Not handed in and the due date has passed. */
  Overdue = "OVERDUE",
  /** Not handed in yet; the due date is still ahead or there is none. */
  Open = "OPEN",
}

/** One team's copy of a program Ödev. `documentId` opens the handed-in file. */
export interface ProgramAssignmentTeam {
  organizationId: string;
  organizationName: string;
  assignmentId: string;
  state: ProgramAssignmentSubmissionState;
  submittedAt: string | null;
  documentId: string | null;
  filename: string | null;
}

/** An Ödev a coordinator gave every team of a program, with each team's standing. */
export interface ProgramAssignment {
  id: string;
  programId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  phaseId: string | null;
  fileRequired: boolean;
  createdByName: string | null;
  createdAt: string;
  submittedCount: number;
  lateCount: number;
  overdueCount: number;
  openCount: number;
  teams: ProgramAssignmentTeam[];
}

/** "Düzenle": all three fields on every save, so a null due date clears it. */
export interface UpdateProgramAssignmentInput {
  title: string;
  description: string | null;
  dueDate: string | null;
}

export interface CreateProgramAssignmentInput {
  title: string;
  description: string | null;
  dueDate: string | null;
  phaseId: string | null;
  fileRequired: boolean;
}
