import { ActionItemStatus } from "@/interfaces/action-item";
import {
  StartupStage,
  type ProcessAssignment,
} from "@/interfaces/startup-process";

/** An open assignment a coordinator gave the team, with no due date or submission yet. */
export function processAssignment(
  overrides: Partial<ProcessAssignment> = {},
): ProcessAssignment {
  return {
    id: "as-1",
    roundId: null,
    stage: StartupStage.Problem,
    title: "Finansal model",
    description: null,
    status: ActionItemStatus.Open,
    dueDate: null,
    submissionDocumentId: null,
    submissionFilename: null,
    createdByName: null,
    createdByRole: null,
    createdAt: "2026-08-10T09:00:00Z",
    ...overrides,
  };
}
