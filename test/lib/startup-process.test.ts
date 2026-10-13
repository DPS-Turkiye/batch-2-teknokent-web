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
  ASSIGNMENT_STATUS_TONES,
  assignmentSourceKind,
  ChipTone,
  completedStages,
  formatRoundRange,
  formatStageRange,
  roundForStage,
  stageCards,
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

describe("formatStageRange", () => {
  it("dates a finished stage with its year", () => {
    expect(formatStageRange("2026-06-12", "2026-07-08")).toBe(
      "12 Haz – 8 Tem 2026",
    );
  });

  it("writes the months in English", () => {
    expect(formatStageRange("2026-06-12", "2026-07-08", "en")).toBe(
      "Jun 12 – Jul 8 2026",
    );
  });
});

describe("ASSIGNMENT_STATUS_TONES", () => {
  it("marks an open Ödev amber and a finished one green", () => {
    expect(ASSIGNMENT_STATUS_TONES[ActionItemStatus.Open]).toBe(ChipTone.Amber);
    expect(ASSIGNMENT_STATUS_TONES[ActionItemStatus.Completed]).toBe(
      ChipTone.Green,
    );
  });
});

describe("assignmentSourceKind", () => {
  it("tells a mentor's, the program's and the startup's own Ödev apart", () => {
    expect(assignmentSourceKind(UserRole.Mentor)).toBe("mentor");
    expect(assignmentSourceKind(UserRole.Coordinator)).toBe("program");
    expect(assignmentSourceKind(UserRole.Admin)).toBe("program");
    expect(assignmentSourceKind(null)).toBe("startup");
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

describe("stageCards", () => {
  it("rates each stage by its Ödevler and names the card's next step", () => {
    const process: StartupProcess = {
      organizationId: "org-1",
      currentStage: StartupStage.Mvp,
      stages: [
        { stage: StartupStage.Solution, state: StartupStageState.Completed },
        { stage: StartupStage.Mvp, state: StartupStageState.Current },
        { stage: StartupStage.Market, state: StartupStageState.Upcoming },
        { stage: StartupStage.Pitch, state: StartupStageState.Upcoming },
      ],
      currentRound: null,
      rounds: [],
      assignments: [
        assignment({
          stage: StartupStage.Mvp,
          status: ActionItemStatus.Completed,
        }),
        assignment({ stage: StartupStage.Mvp }),
        assignment({
          stage: StartupStage.Mvp,
          status: ActionItemStatus.Cancelled,
        }),
        assignment({
          stage: StartupStage.Market,
          status: ActionItemStatus.Completed,
        }),
        assignment({ stage: StartupStage.Market }),
        assignment({ stage: StartupStage.Market }),
      ],
    };

    expect(
      stageCards(process).map(({ stage, done, total, percent, action }) => ({
        stage,
        done,
        total,
        percent,
        action,
      })),
    ).toEqual([
      {
        stage: StartupStage.Solution,
        done: 0,
        total: 0,
        percent: 100,
        action: "completed",
      },
      {
        stage: StartupStage.Mvp,
        done: 1,
        total: 2,
        percent: 50,
        action: "current",
      },
      {
        stage: StartupStage.Market,
        done: 1,
        total: 3,
        percent: 33,
        action: "continue",
      },
      {
        stage: StartupStage.Pitch,
        done: 0,
        total: 0,
        percent: 0,
        action: "start",
      },
    ]);
  });
});

describe("roundForStage", () => {
  const round = (id: string, stage: StartupStage, startsOn: string) => ({
    id,
    title: id,
    name: id,
    stage,
    startsOn,
    endsOn: "2026-12-31",
  });
  const focus = round("focus", StartupStage.Mvp, "2026-08-02");
  const process: StartupProcess = {
    organizationId: "org-1",
    currentStage: StartupStage.Mvp,
    stages: [],
    currentRound: focus,
    rounds: [
      round("later-mvp", StartupStage.Mvp, "2026-10-01"),
      focus,
      round("old-problem", StartupStage.Problem, "2026-06-12"),
      round("new-problem", StartupStage.Problem, "2026-06-25"),
    ],
    assignments: [],
  };

  it("uses the focus round for its stage and the latest round for the others", () => {
    expect(roundForStage(process, StartupStage.Mvp)?.id).toBe("focus");
    expect(roundForStage(process, StartupStage.Problem)?.id).toBe(
      "new-problem",
    );
    expect(roundForStage(process, StartupStage.Pitch)).toBeNull();
  });
});
