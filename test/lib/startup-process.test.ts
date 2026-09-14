import { describe, expect, it } from "vitest";

import { ActionItemStatus } from "@/interfaces/action-item";
import { UserRole } from "@/interfaces/session";
import {
  type ProcessAssignment,
  type StartupProcess,
  StartupStage,
  StartupStageState,
} from "@/interfaces/startup-process";
import {
  ASSIGNMENT_STATUS_CHIPS,
  assignmentSource,
  completedStages,
  formatDueLabel,
  formatRoundRange,
  formatStageRange,
  STARTUP_STAGE_LABELS,
} from "@/lib/startup-process";

function assignment(
  overrides: Partial<ProcessAssignment> = {},
): ProcessAssignment {
  return {
    id: "a-1",
    roundId: "round-1",
    stage: StartupStage.Finance,
    title: "Finansal model taslağı",
    description: null,
    status: ActionItemStatus.Open,
    dueDate: null,
    submissionDocumentId: null,
    submissionFilename: null,
    createdByName: "Çağrı Yılmaz",
    createdByRole: UserRole.Mentor,
    createdAt: "2026-08-10T09:00:00Z",
    ...overrides,
  };
}

describe("formatRoundRange", () => {
  it("names the month once when the round stays within it", () => {
    expect(formatRoundRange("2026-08-02", "2026-08-31")).toBe("2 · 31 Ağu");
  });

  it("names both months when the round crosses into the next", () => {
    expect(formatRoundRange("2026-07-28", "2026-08-05")).toBe("28 Tem · 5 Ağu");
  });
});

describe("formatStageRange and formatDueLabel", () => {
  it("dates a finished stage with its year", () => {
    expect(formatStageRange("2026-06-12", "2026-07-08")).toBe(
      "12 Haz – 8 Tem 2026",
    );
  });

  it("labels a due date", () => {
    expect(formatDueLabel("2026-08-30")).toBe("Teslim 30 Ağu");
  });
});

describe("STARTUP_STAGE_LABELS", () => {
  it("labels every stage in Turkish", () => {
    expect(STARTUP_STAGE_LABELS[StartupStage.BusinessModel]).toBe("İş Modeli");
    expect(Object.keys(STARTUP_STAGE_LABELS)).toHaveLength(7);
  });
});

describe("ASSIGNMENT_STATUS_CHIPS", () => {
  it("says an open Ödev is not uploaded yet", () => {
    expect(ASSIGNMENT_STATUS_CHIPS[ActionItemStatus.Open].label).toBe(
      "Yüklenmedi",
    );
    expect(ASSIGNMENT_STATUS_CHIPS[ActionItemStatus.Completed].label).toBe(
      "Tamamlandı",
    );
  });
});

describe("assignmentSource", () => {
  it("says who set the Ödev, what kind it is and its round", () => {
    expect(assignmentSource(assignment(), "MVP test turu")).toBe(
      "Çağrı Yılmaz · mentorluk ödevi · MVP test turu",
    );
  });

  it("calls one from a coordinator a program Ödev", () => {
    expect(
      assignmentSource(
        assignment({
          createdByName: "Ece Koordinatör",
          createdByRole: UserRole.Coordinator,
        }),
        null,
      ),
    ).toBe("Ece Koordinatör · program ödevi");
  });

  it("falls back to a startup Ödev when the creator is unknown", () => {
    expect(
      assignmentSource(
        assignment({ createdByName: null, createdByRole: null }),
        null,
      ),
    ).toBe("startup ödevi");
  });
});

describe("completedStages", () => {
  it("dates each finished stage by its rounds and counts its finished Ödevler", () => {
    const process: StartupProcess = {
      organizationId: "org-1",
      currentStage: StartupStage.Mvp,
      stages: [
        { stage: StartupStage.Problem, state: StartupStageState.Completed },
        { stage: StartupStage.Solution, state: StartupStageState.Completed },
        { stage: StartupStage.Mvp, state: StartupStageState.Current },
      ],
      currentRound: null,
      rounds: [
        {
          id: "r-2",
          title: "Görüşmeler",
          name: "Problem turu 2",
          stage: StartupStage.Problem,
          startsOn: "2026-06-25",
          endsOn: "2026-07-08",
        },
        {
          id: "r-1",
          title: "Keşif",
          name: "Problem turu 1",
          stage: StartupStage.Problem,
          startsOn: "2026-06-12",
          endsOn: "2026-06-24",
        },
      ],
      assignments: [
        assignment({
          stage: StartupStage.Problem,
          status: ActionItemStatus.Completed,
        }),
        assignment({ stage: StartupStage.Problem }),
        assignment({
          stage: StartupStage.Mvp,
          status: ActionItemStatus.Completed,
        }),
      ],
    };

    expect(completedStages(process)).toEqual([
      {
        stage: StartupStage.Problem,
        startsOn: "2026-06-12",
        endsOn: "2026-07-08",
        completedAssignments: 1,
      },
      {
        stage: StartupStage.Solution,
        startsOn: null,
        endsOn: null,
        completedAssignments: 0,
      },
    ]);
  });
});
