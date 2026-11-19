import { describe, expect, it } from "vitest";

import { WeekVisibility } from "@/interfaces/program-week";
import {
  nextFreeWeek,
  pastWeeks,
  planDayLabel,
  programTotalWeeks,
  programWeekCardState,
  ProgramWeekCardState,
  programWeekDays,
  savedVisibilities,
  upcomingWeeks,
  weekDaysOf,
  weekDraftOf,
  weekInputOf,
  weekPhase,
  weekPlanProblem,
  WeekPlanProblem,
  type WeekDraft,
} from "@/lib/program-week";
import { itemAt } from "@test/fixtures/list-assertions";
import {
  planSession,
  planWeek,
  specialDay,
  thisWeek,
  weekSoFar,
} from "@test/fixtures/program-week";

function draft(week: number, title = `Hafta ${week}`): WeekDraft {
  return {
    key: `week-${week}`,
    week,
    title,
    topics: "",
    activities: "",
    deliverables: "",
    inferred: false,
    startDate: null,
    endDate: null,
    sessions: [],
  };
}

describe("the Bu hafta card state", () => {
  it("is hidden when the coordinator hid the running week, unless the program has not started or has ended", () => {
    expect(
      programWeekCardState(
        thisWeek({ planHidden: true, plan: null, phases: [] }),
      ),
    ).toBe(ProgramWeekCardState.Hidden);
    expect(
      programWeekCardState(thisWeek({ planHidden: true, ended: true })),
    ).toBe(ProgramWeekCardState.Ended);
  });

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

describe("the past weeks list", () => {
  it("leaves out the running week and puts the newest past week first", () => {
    const weeks = pastWeeks([
      weekSoFar(1),
      weekSoFar(3, { current: true }),
      weekSoFar(2),
    ]);

    expect(weeks.map((week) => week.plan.week)).toEqual([2, 1]);
  });

  it("is empty when only the running week has begun", () => {
    expect(pastWeeks([weekSoFar(1, { current: true })])).toEqual([]);
  });

  it("leaves a week opened early to the upcoming list, soonest first", () => {
    const weeks = [
      weekSoFar(1),
      weekSoFar(2, { current: true }),
      weekSoFar(5, { upcoming: true }),
      weekSoFar(4, { upcoming: true }),
    ];

    expect(pastWeeks(weeks).map((week) => week.plan.week)).toEqual([1]);
    expect(upcomingWeeks(weeks).map((week) => week.plan.week)).toEqual([4, 5]);
    expect(upcomingWeeks([weekSoFar(1)])).toEqual([]);
  });
});

describe("a saved week's mentee visibility", () => {
  it("is read by week number, a week without a setting counting as automatic", () => {
    const visibilities = savedVisibilities([
      planWeek({ week: 1, menteeVisibility: WeekVisibility.Hidden }),
      planWeek({ week: 2, menteeVisibility: WeekVisibility.Shown }),
      planWeek({ week: 3, menteeVisibility: null }),
    ]);

    expect(visibilities.get(1)).toBe(WeekVisibility.Hidden);
    expect(visibilities.get(2)).toBe(WeekVisibility.Shown);
    expect(visibilities.get(3)).toBe(WeekVisibility.Auto);
    expect(visibilities.has(4)).toBe(false);
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
      startDate: null,
      endDate: null,
      sessions: [],
    });
    const many = {
      ...draft(1),
      title: "  Tanışma ",
      topics: "\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12\n13\n",
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
      "9",
      "10",
      "11",
      "12",
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

it("round-trips printed dates and sessions without converting computed dates into overrides", () => {
  const session = {
    date: "2026-11-11",
    startTime: "10:00",
    endTime: "12:00",
    place: "Salon",
    title: "Atölye",
  };
  const printed = planWeek({
    datesFromSource: true,
    startDate: "2026-11-09",
    endDate: "2026-11-13",
    sessions: [session],
  });
  const input = weekInputOf(weekDraftOf(printed));
  expect(input.startDate).toBe("2026-11-09");
  expect(input.endDate).toBe("2026-11-13");
  expect(input.sessions).toEqual([session]);
  expect(weekInputOf(weekDraftOf(planWeek())).startDate).toBeNull();
});

it("rejects partial or reversed week dates and permits a dated week beyond configured length", () => {
  const row = draft(5);
  expect(weekPlanProblem([{ ...row, startDate: "2026-11-09" }], 4)).toBe(
    WeekPlanProblem.InvalidDates,
  );
  expect(
    weekPlanProblem(
      [{ ...row, startDate: "2026-11-09", endDate: "2026-11-08" }],
      4,
    ),
  ).toBe(WeekPlanProblem.InvalidDates);
  expect(
    weekPlanProblem(
      [{ ...row, startDate: "2026-11-09", endDate: "2026-11-13" }],
      4,
    ),
  ).toBeNull();
  expect(weekInputOf({ ...row, endDate: "2026-11-13" }).startDate).toBeNull();
});

describe("the syllabus's own dates", () => {
  it("uses a week's printed days, and the program calendar for a week without them", () => {
    const printed = {
      ...draft(1),
      startDate: "2026-10-27",
      endDate: "2026-11-02",
    };
    const drafts = [printed, draft(2)];

    expect(weekDaysOf(drafts, 1, "2026-10-26", "2027-01-09")).toEqual({
      start: "2026-10-27",
      end: "2026-11-02",
    });
    expect(weekDaysOf(drafts, 2, "2026-10-26", "2027-01-09")).toEqual({
      start: "2026-11-02",
      end: "2026-11-08",
    });
    expect(weekDaysOf(drafts, 3, null, null)).toBeNull();
  });

  it("labels a session and a special day with the day, time and place the file prints", () => {
    expect(planDayLabel(planSession(), "tr")).toBe(
      "Pzt 9 Kas · 18:00–20:00 · Online · Yapılandırılmış eğitim",
    );
    expect(planDayLabel(specialDay(), "tr")).toBe(
      "Sal 15 Ara · 15:00 · KKM · Demo Günü",
    );
    expect(
      planDayLabel(
        planSession({ startTime: null, endTime: null, place: null }),
        "en",
      ),
    ).toBe("Mon Nov 9 · Yapılandırılmış eğitim");
  });

  it("shows a week with only a special day in it, not the empty state", () => {
    expect(
      programWeekCardState(
        thisWeek({ plan: null, phases: [], specialDays: [specialDay()] }),
      ),
    ).toBe(ProgramWeekCardState.Ready);
  });
});
