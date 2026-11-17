import { describe, expect, it } from "vitest";

import { ProgramAssignmentSubmissionState } from "@/interfaces/program-assignment";
import {
  AssignmentDraftProblem,
  assignmentDraftProblem,
  assignmentInput,
  EMPTY_ASSIGNMENT_DRAFT,
  phaseNameOf,
  SUBMISSION_STATE_TONES,
} from "@/lib/program-assignments";

const TODAY = "2026-11-16";

describe("program assignments", () => {
  it("needs a title and a due date that has not passed", () => {
    expect(assignmentDraftProblem(EMPTY_ASSIGNMENT_DRAFT, TODAY)).toBe(
      AssignmentDraftProblem.TitleRequired,
    );
    expect(
      assignmentDraftProblem(
        { ...EMPTY_ASSIGNMENT_DRAFT, title: "   " },
        TODAY,
      ),
    ).toBe(AssignmentDraftProblem.TitleRequired);
    expect(
      assignmentDraftProblem(
        { ...EMPTY_ASSIGNMENT_DRAFT, title: "Pazar", dueDate: "2026-11-15" },
        TODAY,
      ),
    ).toBe(AssignmentDraftProblem.DuePassed);
    expect(
      assignmentDraftProblem(
        { ...EMPTY_ASSIGNMENT_DRAFT, title: "Pazar", dueDate: TODAY },
        TODAY,
      ),
    ).toBeNull();
    expect(
      assignmentDraftProblem(
        { ...EMPTY_ASSIGNMENT_DRAFT, title: "Pazar" },
        TODAY,
      ),
    ).toBeNull();
  });

  it("trims the draft and sends empty fields as null", () => {
    expect(
      assignmentInput({
        title: "  Pazar araştırması ",
        description: "   ",
        dueDate: "",
        phaseId: "",
        fileRequired: true,
      }),
    ).toEqual({
      title: "Pazar araştırması",
      description: null,
      dueDate: null,
      phaseId: null,
      fileRequired: true,
    });
    expect(
      assignmentInput({
        title: "Pazar",
        description: " Hedef pazar ",
        dueDate: "2026-12-01",
        phaseId: "phase-1",
        fileRequired: false,
      }),
    ).toEqual({
      title: "Pazar",
      description: "Hedef pazar",
      dueDate: "2026-12-01",
      phaseId: "phase-1",
      fileRequired: false,
    });
  });

  it("names the phase an Ödev belongs to while it still exists", () => {
    const phases = [
      {
        id: "phase-1",
        name: "MVP",
        position: 1,
        startDate: null,
        endDate: null,
        expectedOutput: null,
      },
    ];
    expect(phaseNameOf(phases, "phase-1")).toBe("MVP");
    expect(phaseNameOf(phases, "gone")).toBeNull();
    expect(phaseNameOf(phases, null)).toBeNull();
  });

  it("colours a late hand-in apart from a missed one", () => {
    expect(
      SUBMISSION_STATE_TONES[ProgramAssignmentSubmissionState.Submitted],
    ).toBe("green");
    expect(SUBMISSION_STATE_TONES[ProgramAssignmentSubmissionState.Late]).toBe(
      "amber",
    );
    expect(
      SUBMISSION_STATE_TONES[ProgramAssignmentSubmissionState.Overdue],
    ).toBe("red");
    expect(SUBMISSION_STATE_TONES[ProgramAssignmentSubmissionState.Open]).toBe(
      "neutral",
    );
  });
});
