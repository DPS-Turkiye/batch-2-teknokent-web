import { describe, expect, it } from "vitest";

import { ActionItemStatus } from "@/interfaces/action-item";
import { UserRole } from "@/interfaces/session";
import {
  StartupStageState,
  type ProcessAssignment,
  type StartupRound,
} from "@/interfaces/startup-process";
import {
  ASSIGNMENT_STATUS_TONES,
  assignmentPhaseName,
  assignmentSourceKind,
  ChipTone,
  completedPhases,
  currentPhase,
  focusedSelection,
  formatRoundRange,
  formatStageRange,
  isOpenAssignment,
  phaseCards,
  processAssignmentHref,
  roundForPhase,
  softwareDevelopmentCard,
  STAGE_STATE_TONES,
  unphasedAssignments,
} from "@/lib/startup-process";
import { thisWeek } from "@test/fixtures/program-week";
import { processPhase, startupProcess } from "@test/fixtures/startup-process";

function assignment(
  overrides: Partial<ProcessAssignment> = {},
): ProcessAssignment {
  return {
    id: "a-1",
    roundId: "round-1",
    phaseId: "finance",
    title: "Finansal model taslağı",
    description: null,
    status: ActionItemStatus.Open,
    dueDate: null,
    submissionDocumentId: null,
    submissionFilename: null,
    createdByName: "Çağrı Yılmaz",
    createdByRole: UserRole.Mentor,
    createdAt: "2026-08-10T09:00:00Z",
    programAssignmentId: null,
    fileRequired: true,
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

const problem = processPhase("problem", "Problemi Keşfet", {
  startDate: "2026-06-01",
  endDate: "2026-06-30",
  state: StartupStageState.Completed,
});
const idea = processPhase("idea", "Fikir ve Değer", {
  startDate: "2026-07-01",
  endDate: "2026-07-31",
  state: StartupStageState.Completed,
});
const mvp = processPhase("mvp", "MVP", {
  startDate: "2026-08-01",
  endDate: "2026-08-31",
  state: StartupStageState.Current,
});
const market = processPhase("market", "Pazar");
const pitch = processPhase("pitch", "Sunum");

describe("completedPhases", () => {
  it("lists finished phases with the Ödevler finished in them", () => {
    const process = startupProcess({
      currentPhaseId: "mvp",
      phases: [problem, idea, mvp],
      assignments: [
        assignment({ phaseId: "problem", status: ActionItemStatus.Completed }),
        assignment({ phaseId: "problem" }),
        assignment({ phaseId: "mvp", status: ActionItemStatus.Completed }),
      ],
    });

    expect(completedPhases(process)).toEqual([
      { phase: problem, completedAssignments: 1 },
      { phase: idea, completedAssignments: 0 },
    ]);
  });
});

describe("phaseCards", () => {
  it("counts each phase's own Ödevler, leaves cancelled ones out and picks the action", () => {
    const process = startupProcess({
      currentPhaseId: "mvp",
      phases: [idea, mvp, market, pitch],
      assignments: [
        assignment({ phaseId: "mvp", status: ActionItemStatus.Completed }),
        assignment({ phaseId: "mvp" }),
        assignment({ phaseId: "mvp", status: ActionItemStatus.Cancelled }),
        assignment({ phaseId: "market", status: ActionItemStatus.Completed }),
        assignment({ phaseId: "market" }),
        assignment({ phaseId: "market" }),
        assignment({ phaseId: null }),
      ],
    });

    expect(
      phaseCards(process).map(({ phase, done, total, percent, action }) => ({
        id: phase.id,
        done,
        total,
        percent,
        action,
      })),
    ).toEqual([
      { id: "idea", done: 0, total: 0, percent: 100, action: "completed" },
      { id: "mvp", done: 1, total: 2, percent: 50, action: "current" },
      { id: "market", done: 1, total: 3, percent: 33, action: "continue" },
      { id: "pitch", done: 0, total: 0, percent: 0, action: "start" },
    ]);
  });
});

describe("roundForPhase", () => {
  const round = (
    id: string,
    phaseId: string | null,
    startsOn: string,
  ): StartupRound => ({
    id,
    title: id,
    name: id,
    phaseId,
    startsOn,
    endsOn: startsOn,
  });
  const focus = round("focus", "mvp", "2026-08-02");
  const process = startupProcess({
    currentRound: focus,
    rounds: [
      focus,
      round("later-mvp", "mvp", "2026-10-01"),
      round("old-problem", "problem", "2026-06-12"),
      round("new-problem", "problem", "2026-06-25"),
    ],
  });

  it("opens the focus round for its phase, else the phase's latest round", () => {
    expect(roundForPhase(process, "mvp")?.id).toBe("focus");
    expect(roundForPhase(process, "problem")?.id).toBe("new-problem");
    expect(roundForPhase(process, "pitch")).toBeNull();
  });
});

describe("unphasedAssignments and currentPhase", () => {
  it("finds the Ödevler no phase covers and the phase today falls in", () => {
    const loose = assignment({ id: "loose", phaseId: null });
    const process = startupProcess({
      currentPhaseId: "mvp",
      phases: [problem, mvp],
      assignments: [assignment({ phaseId: "mvp" }), loose],
    });

    expect(unphasedAssignments(process.assignments)).toEqual([loose]);
    expect(currentPhase(process)).toBe(mvp);
    expect(currentPhase(startupProcess({ phases: [problem] }))).toBeNull();
  });
});

describe("softwareDevelopmentCard", () => {
  it("runs over the program's dates while the program is on", () => {
    expect(softwareDevelopmentCard(thisWeek())).toEqual({
      state: StartupStageState.Current,
      dates: { startsOn: "2026-10-05", endsOn: "2026-12-27" },
    });
  });

  it("is done once the program has ended", () => {
    expect(
      softwareDevelopmentCard(thisWeek({ week: null, ended: true }))?.state,
    ).toBe(StartupStageState.Completed);
  });

  it("is upcoming before the program starts", () => {
    expect(
      softwareDevelopmentCard(thisWeek({ week: null, notStarted: true }))
        ?.state,
    ).toBe(StartupStageState.Upcoming);
  });

  it("has no dates unless the program has both a start and an end", () => {
    expect(
      softwareDevelopmentCard(
        thisWeek({ week: null, programStart: null, programEnd: null }),
      ),
    ).toEqual({ state: StartupStageState.Current, dates: null });
    expect(
      softwareDevelopmentCard(thisWeek({ programEnd: null }))?.dates,
    ).toBeNull();
  });

  it("is not shown outside a program", () => {
    expect(softwareDevelopmentCard(null)).toBeNull();
  });

  it("gives each state the chip tone the Ödev rows use", () => {
    expect(STAGE_STATE_TONES).toEqual({
      [StartupStageState.Current]: ChipTone.Amber,
      [StartupStageState.Completed]: ChipTone.Green,
      [StartupStageState.Upcoming]: ChipTone.Gray,
    });
  });
});

describe("processAssignmentHref", () => {
  it("links Süreç to one Ödev, escaping the id", () => {
    expect(processAssignmentHref("as 1")).toBe(
      "/startup/process?assignment=as%201",
    );
  });
});

describe("isOpenAssignment and assignmentPhaseName", () => {
  it("counts only Ödevler still waiting for a hand-in as open", () => {
    expect(isOpenAssignment(assignment())).toBe(true);
    expect(
      isOpenAssignment(assignment({ status: ActionItemStatus.InProgress })),
    ).toBe(true);
    expect(
      isOpenAssignment(assignment({ status: ActionItemStatus.Completed })),
    ).toBe(false);
    expect(
      isOpenAssignment(assignment({ status: ActionItemStatus.Cancelled })),
    ).toBe(false);
  });

  it("names the Ödev's phase, or nothing when no phase covers it", () => {
    const phases = [processPhase("ph-1", "Problem")];

    expect(assignmentPhaseName(assignment({ phaseId: "ph-1" }), phases)).toBe(
      "Problem",
    );
    expect(assignmentPhaseName(assignment({ phaseId: null }), phases)).toBe(
      null,
    );
  });
});

describe("focusedSelection", () => {
  const phases = [processPhase("ph-1", "Problem"), processPhase("ph-2", "MVP")];

  it("opens the linked Ödev's phase", () => {
    const process = startupProcess({
      phases,
      assignments: [assignment({ id: "as-2", phaseId: "ph-2" })],
    });

    expect(focusedSelection(process, "as-2")).toEqual({
      phaseId: "ph-2",
      unphased: false,
    });
  });

  it("opens Fazsız görevler for a linked Ödev no phase covers", () => {
    const process = startupProcess({
      phases,
      assignments: [assignment({ id: "as-3", phaseId: null })],
    });

    expect(focusedSelection(process, "as-3")).toEqual({
      phaseId: null,
      unphased: true,
    });
  });

  it("ignores a link to an Ödev the team does not have, or a process without phases", () => {
    const withPhases = startupProcess({ phases, assignments: [assignment()] });
    const flat = startupProcess({ assignments: [assignment()] });

    expect(focusedSelection(withPhases, "someone-else")).toBeNull();
    expect(focusedSelection(withPhases, null)).toBeNull();
    expect(focusedSelection(flat, assignment().id)).toBeNull();
  });
});
