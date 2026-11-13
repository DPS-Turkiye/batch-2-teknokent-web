import { describe, expect, it } from "vitest";

import type { WeeklyProgramPhaseInput } from "@/interfaces/weekly-program";
import { ClientApiError } from "@/lib/client/api";
import { weekDraftOf } from "@/lib/program-week";
import {
  isStalePlanError,
  keepsEveryWeek,
  lastKeptWeek,
  moveWeekToPhase,
  phaseIndexOfWeek,
  phaseRangeDraftsOf,
  PhaseRangeProblem,
  phaseRangeProblem,
  replacesExistingPlan,
  weekListLabel,
  weeklyProgramSaveInput,
} from "@/lib/weekly-program";
import {
  programWeek,
  weeklyProgramProposal,
} from "@test/fixtures/weekly-program";

function range(
  name: string,
  firstWeek: number,
  lastWeek: number,
): WeeklyProgramPhaseInput {
  return { name, expectedOutput: null, firstWeek, lastWeek };
}

const phases = [
  range("Problem", 1, 3),
  range("Fikir", 4, 5),
  range("Pazar", 6, 8),
];

describe("phaseIndexOfWeek", () => {
  it("finds the phase a week falls in, and none for a week between phases", () => {
    expect(phaseIndexOfWeek(phases, 4)).toBe(1);
    expect(phaseIndexOfWeek(phases, 8)).toBe(2);
    expect(phaseIndexOfWeek([range("A", 1, 2), range("B", 4, 5)], 3)).toBe(-1);
  });
});

describe("moveWeekToPhase", () => {
  it("moves a boundary week back into the phase before it", () => {
    expect(moveWeekToPhase(phases, 4, 0)).toEqual([
      range("Problem", 1, 4),
      range("Fikir", 5, 5),
      range("Pazar", 6, 8),
    ]);
  });

  it("moves a boundary week forward into the next phase", () => {
    expect(moveWeekToPhase(phases, 5, 2)).toEqual([
      range("Problem", 1, 3),
      range("Fikir", 4, 4),
      range("Pazar", 5, 8),
    ]);
  });

  it("removes a phase in between that is left with no weeks", () => {
    expect(moveWeekToPhase(phases, 6, 0)).toEqual([
      range("Problem", 1, 6),
      range("Pazar", 7, 8),
    ]);
  });

  it("takes a week between phases into the chosen one", () => {
    expect(moveWeekToPhase([range("A", 1, 2), range("B", 4, 5)], 3, 1)).toEqual(
      [range("A", 1, 2), range("B", 3, 5)],
    );
  });

  it("leaves the phases as they are for a week already in the target or an unknown target", () => {
    expect(moveWeekToPhase(phases, 2, 0)).toEqual(phases);
    expect(moveWeekToPhase(phases, 2, 9)).toEqual(phases);
  });

  it("keeps each phase's other fields, such as its row key", () => {
    const drafts = phaseRangeDraftsOf(weeklyProgramProposal().phases);

    const moved = moveWeekToPhase(drafts, 4, 0);

    expect(moved[0]?.key).toBe(drafts[0]?.key);
    expect(moved[0]?.lastWeek).toBe(4);
  });
});

describe("phaseRangeProblem", () => {
  it.each([
    ["no problem", phases, null],
    [
      "a phase without a name",
      [range(" ", 1, 2)],
      PhaseRangeProblem.MissingName,
    ],
    [
      "overlapping phases",
      [range("A", 1, 3), range("B", 3, 4)],
      PhaseRangeProblem.OutOfOrder,
    ],
    ["a backwards phase", [range("A", 3, 2)], PhaseRangeProblem.OutOfOrder],
    ["a fractional week", [range("A", 1.5, 2)], PhaseRangeProblem.OutOfOrder],
    ["a phase past the end", [range("A", 1, 12)], PhaseRangeProblem.PastTheEnd],
    [
      "more phases than a program keeps",
      Array.from({ length: 13 }, (_, i) => range(`F${i}`, i + 1, i + 1)),
      PhaseRangeProblem.TooMany,
    ],
  ])("reports %s", (_case, list, problem) => {
    expect(phaseRangeProblem(list, 11)).toBe(problem);
  });
});

describe("lastKeptWeek", () => {
  const existing = { phaseCount: 2, weekCount: 5, currentWeek: 4 };

  it("keeps the weeks before the current one when asked", () => {
    expect(lastKeptWeek(existing, true)).toBe(3);
  });

  it("keeps nothing when not asked, before the start, or in the first week", () => {
    expect(lastKeptWeek(existing, false)).toBeNull();
    expect(lastKeptWeek({ ...existing, currentWeek: null }, true)).toBeNull();
    expect(lastKeptWeek({ ...existing, currentWeek: 1 }, true)).toBeNull();
  });
});

describe("keepsEveryWeek", () => {
  it("keeps every week only once the program has ended", () => {
    expect(
      keepsEveryWeek(
        lastKeptWeek({ phaseCount: 0, weekCount: 11, currentWeek: 12 }, true),
        11,
      ),
    ).toBe(true);
    expect(keepsEveryWeek(10, 11)).toBe(false);
    expect(keepsEveryWeek(null, 11)).toBe(false);
  });
});

describe("weeklyProgramSaveInput", () => {
  it("sends the reviewed weeks and phases without row keys, trimmed", () => {
    const [first, second] = phaseRangeDraftsOf(weeklyProgramProposal().phases);
    if (!first || !second) throw new Error("fixture has phases");

    const input = weeklyProgramSaveInput({
      documentId: "doc-1",
      weeks: [weekDraftOf(programWeek(1, "  Yola Çık "))],
      phases: [
        { ...first, name: " Problemi Keşfet " },
        { ...second, expectedOutput: "  " },
      ],
      existing: { phaseCount: 0, weekCount: 0, currentWeek: null },
      keepPast: true,
    });

    expect(input).toEqual({
      documentId: "doc-1",
      weeks: [
        {
          week: 1,
          title: "Yola Çık",
          topics: ["Oturum:   Yola Çık", "Konuşmacı: Deniz Örnek"],
          activities: ["Workshop: Ekip çalışması"],
          deliverables: ["Haftalık görev"],
          inferred: false,
        },
      ],
      phases: [
        {
          name: "Problemi Keşfet",
          expectedOutput: "Problem tanımı",
          firstWeek: 1,
          lastWeek: 3,
        },
        {
          name: "Fikir ve Değer",
          expectedOutput: null,
          firstWeek: 4,
          lastWeek: 5,
        },
      ],
      seenPhaseCount: 0,
      seenWeekCount: 0,
      keepPast: true,
    });
  });

  it("sends back the plan the read counted, which must be confirmed when there is one", () => {
    const existing = { phaseCount: 3, weekCount: 0, currentWeek: null };

    expect(replacesExistingPlan(existing)).toBe(true);
    expect(
      replacesExistingPlan({ phaseCount: 0, weekCount: 0, currentWeek: null }),
    ).toBe(false);
    expect(
      weeklyProgramSaveInput({
        documentId: "doc-1",
        weeks: [],
        phases: [],
        existing,
        keepPast: false,
      }),
    ).toMatchObject({ seenPhaseCount: 3, seenWeekCount: 0 });
  });
});

describe("isStalePlanError", () => {
  it("is a 409 from the save, nothing else", () => {
    expect(isStalePlanError(new ClientApiError("changed", 409))).toBe(true);
    expect(isStalePlanError(new ClientApiError("bad", 400))).toBe(false);
    expect(isStalePlanError(new Error("network"))).toBe(false);
  });
});

describe("weekListLabel", () => {
  it("lists the weeks a warning is about in the reader's language", () => {
    expect(weekListLabel([8, 10], "tr")).toBe("8 ve 10");
    expect(weekListLabel([3, 8, 10], "en")).toBe("3, 8, and 10");
    expect(weekListLabel([5], "tr")).toBe("5");
  });
});
