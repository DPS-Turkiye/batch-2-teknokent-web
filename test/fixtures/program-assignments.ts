import {
  ProgramAssignmentSubmissionState,
  type ProgramAssignment,
  type ProgramAssignmentTeam,
} from "@/interfaces/program-assignment";

export function programAssignmentTeam(
  overrides: Partial<ProgramAssignmentTeam> = {},
): ProgramAssignmentTeam {
  return {
    organizationId: "org-1",
    organizationName: "Döngü",
    assignmentId: "copy-1",
    state: ProgramAssignmentSubmissionState.Open,
    submittedAt: null,
    documentId: null,
    filename: null,
    ...overrides,
  };
}

/** A program Ödev two teams hold, one handed in with a file, one still waiting. */
export function programAssignment(
  overrides: Partial<ProgramAssignment> = {},
): ProgramAssignment {
  return {
    id: "odev-1",
    programId: "program-1",
    title: "Pazar araştırması",
    description: "Hedef pazarı anlat.",
    dueDate: "2026-12-01",
    phaseId: "phase-1",
    fileRequired: true,
    createdByName: "Elif Demir",
    createdAt: "2026-11-16T09:00:00Z",
    submittedCount: 1,
    lateCount: 0,
    overdueCount: 0,
    openCount: 1,
    teams: [
      programAssignmentTeam({
        state: ProgramAssignmentSubmissionState.Submitted,
        submittedAt: "2026-11-20T10:00:00Z",
        documentId: "doc-1",
        filename: "pazar.pdf",
      }),
      programAssignmentTeam({
        organizationId: "org-2",
        organizationName: "Küme",
        assignmentId: "copy-2",
      }),
    ],
    ...overrides,
  };
}
