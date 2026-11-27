import { describe, expect, it } from "vitest";

import { ProgramAssignmentSubmissionState } from "@/interfaces/program-assignment";
import {
  AssignmentDraftProblem,
  assignmentDraftProblem,
  assignmentInput,
  editDraftOf,
  editDraftUnchanged,
  editInput,
  EMPTY_ASSIGNMENT_DRAFT,
  phaseNameOf,
  SUBMISSION_STATE_TONES,
  teamsWithFiles,
} from "@/lib/program-assignments";
import { programAssignment } from "@test/fixtures/program-assignments";

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

  it("lets an edit keep the date already set once it has passed, but not move to another past day", () => {
    const draft = { title: "Pazar", dueDate: "2026-11-10" };
    expect(assignmentDraftProblem(draft, TODAY, "2026-11-10")).toBeNull();
    expect(
      assignmentDraftProblem(
        { ...draft, dueDate: "2026-11-12" },
        TODAY,
        "2026-11-10",
      ),
    ).toBe(AssignmentDraftProblem.DuePassed);
    expect(
      assignmentDraftProblem({ ...draft, dueDate: "" }, TODAY, "2026-11-10"),
    ).toBeNull();
    expect(
      assignmentDraftProblem({ ...draft, title: " " }, TODAY, "2026-11-10"),
    ).toBe(AssignmentDraftProblem.TitleRequired);
  });

  it("fills the edit form from the Ödev and sends all three fields, blanks as null", () => {
    const assignment = programAssignment({ description: null, dueDate: null });
    expect(editDraftOf(assignment)).toEqual({
      title: "Pazar araştırması",
      description: "",
      dueDate: "",
    });
    expect(
      editInput({ title: "  Pazar analizi ", description: "  ", dueDate: "" }),
    ).toEqual({ title: "Pazar analizi", description: null, dueDate: null });
    expect(
      editInput({
        title: "Pazar",
        description: " Rakipler ",
        dueDate: "2026-12-05",
      }),
    ).toEqual({
      title: "Pazar",
      description: "Rakipler",
      dueDate: "2026-12-05",
    });
  });

  it("tells an edit that changes nothing from one that does", () => {
    const assignment = programAssignment();
    const draft = editDraftOf(assignment);
    expect(editDraftUnchanged(draft, assignment)).toBe(true);
    expect(
      editDraftUnchanged({ ...draft, title: ` ${draft.title} ` }, assignment),
    ).toBe(true);
    expect(editDraftUnchanged({ ...draft, title: "Yeni" }, assignment)).toBe(
      false,
    );
    expect(editDraftUnchanged({ ...draft, description: "" }, assignment)).toBe(
      false,
    );
    expect(editDraftUnchanged({ ...draft, dueDate: "" }, assignment)).toBe(
      false,
    );
    expect(
      editDraftUnchanged(
        { ...draft, description: "" },
        programAssignment({ description: "" }),
      ),
    ).toBe(true);
  });

  it("counts the teams whose handed-in file a delete takes too", () => {
    expect(teamsWithFiles(programAssignment())).toBe(1);
    expect(teamsWithFiles(programAssignment({ teams: [] }))).toBe(0);
  });
});
