import { describe, expect, it } from "vitest";

import {
  nextFreeWeek,
  programTotalWeeks,
  programWeekCardState,
  ProgramWeekCardState,
  programWeekDays,
  weekDraftOf,
  weekInputOf,
  weekPhase,
  weekPlanProblem,
  WeekPlanProblem,
  type WeekDraft,
} from "@/lib/program-week";
import { itemAt } from "@test/fixtures/list-assertions";
import { planWeek, thisWeek } from "@test/fixtures/program-week";

function draft(week: number, title = `Hafta ${week}`): WeekDraft {
  return {
    key: `week-${week}`,
    week,
    title,
    topics: "",
    activities: "",
    deliverables: "",
    inferred: false,
  };
}

describe("the Bu hafta card state", () => {
  it("is ready with a plan or a phase, empty with neither, and says when the program hasn't started or has ended", () => {
    expect(programWeekCardState(thisWeek())).toBe(ProgramWeekCardState.Ready);
    expect(programWeekCardState(thisWeek({ plan: null }))).toBe(
      ProgramWeekCardState.Ready,
    );
    expect(programWeekCardState(thisWeek({ plan: null, phases: [] }))).toBe(
      ProgramWeekCardState.Empty,
    );
    expect(
      programWeekCardState(thisWeek({ notStarted: true, week: null })),
    ).toBe(ProgramWeekCardState.NotStarted);
    expect(programWeekCardState(thisWeek({ ended: true, week: null }))).toBe(
      ProgramWeekCardState.Ended,
    );
  });

  it("names the phase running today, else the first one in the week", () => {
    const first = itemAt(thisWeek().phases, 0);
    const later = { ...first, id: "phase-2", name: "Prototip", current: false };
    expect(
      weekPhase(
        thisWeek({
          phases: [
            { ...first, current: false },
            { ...later, current: true },
          ],
        }),
      )?.name,
    ).toBe("Prototip");
    expect(
      weekPhase(thisWeek({ phases: [{ ...first, current: false }, later] }))
        ?.name,
    ).toBe("Fikir doğrulama");
    expect(weekPhase(thisWeek({ phases: [] }))).toBeNull();
  });
});

describe("program week arithmetic, as the backend's ProgramCalendar counts it", () => {
  it("runs seven days from the start and cuts the last week at the end", () => {
    expect(programWeekDays("2026-10-05", "2026-10-28", 1)).toEqual({
      start: "2026-10-05",
      end: "2026-10-11",
    });
    expect(programWeekDays("2026-10-05", "2026-10-28", 4)).toEqual({
      start: "2026-10-26",
      end: "2026-10-28",
    });
    expect(programWeekDays("2026-12-28", null, 2)).toEqual({
      start: "2027-01-04",
      end: "2027-01-10",
    });
    expect(programWeekDays(null, "2026-10-28", 1)).toBeNull();
  });

  it("counts a partial last week", () => {
    expect(programTotalWeeks("2026-10-05", "2026-10-28")).toBe(4);
    expect(programTotalWeeks("2026-10-05", "2026-12-27")).toBe(12);
    expect(programTotalWeeks("2026-10-05", null)).toBeNull();
  });
});

describe("the weekly plan editor's rules", () => {
  it("round-trips a week, dropping blank lines and keeping at most eight per list", () => {
    const week = planWeek({ topics: ["A", "B"] });
    expect(weekInputOf(weekDraftOf(week))).toEqual({
      week: 2,
      title: "Kullanıcı görüşmeleri",
      topics: ["A", "B"],
      activities: ["5 kullanıcıyla görüş"],
      deliverables: ["Görüşme notları"],
      inferred: false,
    });
    const many = {
      ...draft(1),
      title: "  Tanışma ",
      topics: "\n1\n2\n3\n4\n5\n6\n7\n8\n9\n",
    };
    expect(weekInputOf(many).title).toBe("Tanışma");
    expect(weekInputOf(many).topics).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
    ]);
  });

  it("adds the first free week inside the program, and none when every week is planned", () => {
    expect(nextFreeWeek([draft(1), draft(3)], 4)).toBe(2);
    expect(nextFreeWeek([draft(1), draft(2)], 2)).toBeNull();
    expect(nextFreeWeek([], null)).toBe(1);
  });

  it("refuses an untitled week, a repeated week and a week past the end", () => {
    expect(weekPlanProblem([draft(1), draft(2)], 4)).toBeNull();
    expect(weekPlanProblem([draft(1, "  ")], 4)).toBe(
      WeekPlanProblem.MissingTitle,
    );
    expect(weekPlanProblem([draft(1), draft(1, "Yine")], 4)).toBe(
      WeekPlanProblem.RepeatedWeek,
    );
    expect(weekPlanProblem([draft(5)], 4)).toBe(WeekPlanProblem.PastTheEnd);
    expect(weekPlanProblem([draft(0)], 4)).toBe(WeekPlanProblem.PastTheEnd);
  });
});
