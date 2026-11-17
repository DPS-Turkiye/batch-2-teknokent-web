import type { ProgramPhase } from "@/interfaces/coordinator-program";
import {
  ProgramAssignmentSubmissionState,
  type CreateProgramAssignmentInput,
} from "@/interfaces/program-assignment";

/** The backend's limits on an Ödev's title and description. */
export const MAX_ASSIGNMENT_TITLE = 255;
export const MAX_ASSIGNMENT_DESCRIPTION = 10000;

/** The "Ödev ver" form; empty strings stand for fields left out. */
export type ProgramAssignmentDraft = {
  title: string;
  description: string;
  dueDate: string;
  phaseId: string;
  fileRequired: boolean;
};

export const EMPTY_ASSIGNMENT_DRAFT: ProgramAssignmentDraft = {
  title: "",
  description: "",
  dueDate: "",
  phaseId: "",
  fileRequired: false,
};

/** Why the draft cannot be sent yet, as a `programAssignments.problems` key. */
export enum AssignmentDraftProblem {
  TitleRequired = "titleRequired",
  DuePassed = "duePassed",
}

/** The first problem with the draft, or null; `today` is a yyyy-mm-dd day. */
export function assignmentDraftProblem(
  draft: ProgramAssignmentDraft,
  today: string,
): AssignmentDraftProblem | null {
  if (!draft.title.trim()) return AssignmentDraftProblem.TitleRequired;
  if (draft.dueDate && draft.dueDate < today) {
    return AssignmentDraftProblem.DuePassed;
  }
  return null;
}

export function assignmentInput(
  draft: ProgramAssignmentDraft,
): CreateProgramAssignmentInput {
  return {
    title: draft.title.trim(),
    description: draft.description.trim() || null,
    dueDate: draft.dueDate || null,
    phaseId: draft.phaseId || null,
    fileRequired: draft.fileRequired,
  };
}

export type SubmissionTone = "green" | "amber" | "red" | "neutral";

export const SUBMISSION_STATE_TONES: Record<
  ProgramAssignmentSubmissionState,
  SubmissionTone
> = {
  [ProgramAssignmentSubmissionState.Submitted]: "green",
  [ProgramAssignmentSubmissionState.Late]: "amber",
  [ProgramAssignmentSubmissionState.Overdue]: "red",
  [ProgramAssignmentSubmissionState.Open]: "neutral",
};

/** The name of the program phase an Ödev belongs to, or null when it names none or the phase is gone. */
export function phaseNameOf(
  phases: readonly ProgramPhase[],
  phaseId: string | null,
): string | null {
  if (!phaseId) return null;
  return phases.find((phase) => phase.id === phaseId)?.name ?? null;
}
