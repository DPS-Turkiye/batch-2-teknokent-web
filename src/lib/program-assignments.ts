import type { ProgramPhase } from "@/interfaces/coordinator-program";
import {
  ProgramAssignmentSubmissionState,
  type CreateProgramAssignmentInput,
  type ProgramAssignment,
  type UpdateProgramAssignmentInput,
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

/**
 * The first problem with the draft, or null; `today` is a yyyy-mm-dd day. `keptDueDate` is the date an edited Ödev
 * already has: it stays valid once passed, so an overdue Ödev's text can still be fixed.
 */
export function assignmentDraftProblem(
  draft: Pick<ProgramAssignmentDraft, "title" | "dueDate">,
  today: string,
  keptDueDate: string | null = null,
): AssignmentDraftProblem | null {
  if (!draft.title.trim()) return AssignmentDraftProblem.TitleRequired;
  if (draft.dueDate && draft.dueDate !== keptDueDate && draft.dueDate < today) {
    return AssignmentDraftProblem.DuePassed;
  }
  return null;
}

/** The "Düzenle" form; empty strings stand for fields left out. */
export type ProgramAssignmentEditDraft = Pick<
  ProgramAssignmentDraft,
  "title" | "description" | "dueDate"
>;

export function editDraftOf(
  assignment: ProgramAssignment,
): ProgramAssignmentEditDraft {
  return {
    title: assignment.title,
    description: assignment.description ?? "",
    dueDate: assignment.dueDate ?? "",
  };
}

export function editInput(
  draft: ProgramAssignmentEditDraft,
): UpdateProgramAssignmentInput {
  return {
    title: draft.title.trim(),
    description: draft.description.trim() || null,
    dueDate: draft.dueDate || null,
  };
}

/** True when saving would change nothing, so the save button can stay off. */
export function editDraftUnchanged(
  draft: ProgramAssignmentEditDraft,
  assignment: ProgramAssignment,
): boolean {
  const input = editInput(draft);
  return (
    input.title === assignment.title &&
    input.description === (assignment.description || null) &&
    input.dueDate === assignment.dueDate
  );
}

/** Teams whose handed-in file goes too when the Ödev is deleted. */
export function teamsWithFiles(assignment: ProgramAssignment): number {
  return assignment.teams.filter((team) => team.documentId !== null).length;
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
