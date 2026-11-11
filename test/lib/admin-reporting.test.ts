import { describe, expect, it } from "vitest";

import {
  BottleneckSeverity,
  type AdminBottleneck,
  type AdminMeetingMark,
  type AdminOverview,
  type AdminUser,
} from "@/interfaces/admin-overview";
import { MentorshipStatus } from "@/interfaces/coordinator-mentorship";
import { MeetingStatus } from "@/interfaces/meeting";
import { ProgramStatus, ProgramType } from "@/interfaces/program";
import { UserAccountStatus, UserRole } from "@/interfaces/session";
import {
  activityCounts,
  bottlenecksOpenedThisWeek,
  cellState,
  countSummaryRows,
  csvText,
  daysSinceInstant,
  flagCounts,
  flagListCounts,
  formatPercent,
  gapAtWeekEnd,
  gapTop,
  goalRate,
  hasLowGoals,
  meetingCount,
  meetingRate,
  meetingSummaryRows,
  pairsIn,
  pairsWithMeeting,
  pairWeekPoints,
  plannedInWeek,
  programsOfType,
  programSummaryRows,
  ratingsFromDay,
  REPORT_RANGES,
  reportProgram,
  reportTabs,
  weekLabel,
  weekStarts,
  type ReportPair,
} from "@/lib/admin-reporting";
import { ALL_PROGRAM_TYPES } from "@/lib/program-types";
import { HeatCell, ReportRange, ReportTab } from "@/types/admin-reporting";
import {
  adminMentorship,
  adminProgram,
  adminStartup,
} from "@test/fixtures/admin-programs";
import { translatorIn } from "@test/translators";

const t = translatorIn("tr", "adminReporting");

/** Wednesday 11 November 2026, 10:00 local time; its week starts on Monday the 9th. */
const NOW = new Date(2026, 10, 11, 10);
const MONDAY = new Date(2026, 10, 9);
const LAST_MONDAY = new Date(2026, 10, 2);

function day(month: number, date: number, hour = 10) {
  return new Date(2026, month - 1, date, hour);
}

function pair(overrides: Partial<ReportPair> = {}): ReportPair {
  return {
    ...adminMentorship({ startDate: "2026-09-01" }),
    bottlenecks: 0,
    stale: false,
    goalDone: 0,
    goalTotal: 0,
    ...overrides,
  };
}

function mark(
  at: Date,
  status: MeetingStatus,
  overrides: Partial<AdminMeetingMark> = {},
): AdminMeetingMark {
  return {
    mentorId: "mentor-1",
    organizationId: "org-1",
    scheduledAt: at.toISOString(),
    status,
    ...overrides,
  };
}

function bottleneck(overrides: Partial<AdminBottleneck> = {}): AdminBottleneck {
  return {
    id: "b-1",
    title: "Fiyatlama",
    severity: BottleneckSeverity.High,
    status: "OPEN",
    organizationId: "org-1",
    organizationName: "Lumen",
    createdAt: day(11, 10).toISOString(),
    ...overrides,
  };
}

function user(id: string, createdAt: string | null): AdminUser {
  return {
    id,
    email: `${id}@menton.test`,
    fullName: id,
    role: UserRole.Mentee,
    status: UserAccountStatus.Approved,
    organizationId: null,
    organizationName: null,
    jobTitle: null,
    createdAt,
  };
}

function overview(overrides: Partial<AdminOverview> = {}): AdminOverview {
  return {
    programs: [],
    users: [],
    mentorships: [],
    requests: [],
    bottlenecks: [],
    meetingsLast8Weeks: 0,
    ...overrides,
  };
}

describe("program choice", () => {
  const stars = adminProgram({ id: "stars", status: ProgramStatus.Draft });
  const peer = adminProgram({
    id: "peer",
    type: ProgramType.PeerMentoring,
  });
  const done = adminProgram({ id: "done", status: ProgramStatus.Completed });

  it("filters programs by type, or keeps all of them", () => {
    expect(programsOfType([stars, peer], ProgramType.PeerMentoring)).toEqual([
      peer,
    ]);
    expect(programsOfType([stars, peer], ALL_PROGRAM_TYPES)).toEqual([
      stars,
      peer,
    ]);
  });

  it("shows the picked program, else the first active one, else the first", () => {
    expect(reportProgram([stars, peer, done], "done")).toBe(done);
    expect(reportProgram([stars, peer, done], null)).toBe(peer);
    expect(reportProgram([stars, peer], "missing")).toBe(peer);
    expect(reportProgram([stars, done], null)).toBe(stars);
    expect(reportProgram([], null)).toBeNull();
  });

  it("hides Sistem Aktivitesi from a coordinator's program report", () => {
    expect(reportTabs(false)).toEqual([
      ReportTab.Program,
      ReportTab.Health,
      ReportTab.Activity,
    ]);
    expect(reportTabs(true)).toEqual([ReportTab.Program, ReportTab.Health]);
  });

  it("offers the ranges in order", () => {
    expect(REPORT_RANGES).toEqual([
      ReportRange.EightWeeks,
      ReportRange.Quarter,
      ReportRange.WholeProgram,
    ]);
  });
});

describe("weekStarts", () => {
  it("ends with this week's Monday and counts back 8 or 13 weeks", () => {
    const eight = weekStarts(ReportRange.EightWeeks, undefined, NOW);
    expect(eight).toHaveLength(8);
    expect(eight.at(-1)).toEqual(MONDAY);
    expect(eight[0]).toEqual(new Date(2026, 8, 21));
    expect(weekStarts(ReportRange.Quarter, undefined, NOW)).toHaveLength(13);
  });

  it("covers the whole program from its creation week, between 1 and 16 weeks", () => {
    expect(
      weekStarts(ReportRange.WholeProgram, day(10, 21).toISOString(), NOW),
    ).toHaveLength(4);
    expect(
      weekStarts(ReportRange.WholeProgram, "2025-01-01T00:00:00Z", NOW),
    ).toHaveLength(16);
    expect(
      weekStarts(ReportRange.WholeProgram, day(12, 30).toISOString(), NOW),
    ).toEqual([MONDAY]);
  });

  it("falls back to eight weeks when the program's start is unknown", () => {
    expect(weekStarts(ReportRange.WholeProgram, undefined, NOW)).toHaveLength(
      8,
    );
  });
});

describe("ratingsFromDay", () => {
  it("starts the ratings at the first week, or not at all for the whole program", () => {
    expect(ratingsFromDay(ReportRange.EightWeeks, [MONDAY])).toBe("2026-11-09");
    expect(ratingsFromDay(ReportRange.WholeProgram, [MONDAY])).toBeNull();
    expect(ratingsFromDay(ReportRange.Quarter, [])).toBeNull();
  });
});

describe("pairsIn", () => {
  const lumen = adminStartup({ id: "org-1" });
  const nova = adminStartup({ id: "org-2", name: "Nova" });
  const program = adminProgram({ id: "program-1", startups: [lumen, nova] });

  it("keeps the program's active mentorships and adds their bottlenecks, staleness and goals", () => {
    const fresh = adminMentorship({
      id: "fresh",
      daysSinceMeeting: 2,
      goalDone: 1,
      goalTotal: 4,
      programId: "program-1",
    });
    const stale = adminMentorship({
      id: "stale",
      organizationId: "org-2",
      daysSinceMeeting: 20,
      programId: null,
    });
    const data = overview({
      mentorships: [
        fresh,
        stale,
        adminMentorship({ id: "paused", status: MentorshipStatus.Paused }),
        adminMentorship({ id: "elsewhere", programId: "program-9" }),
        adminMentorship({ id: "other-team", organizationId: "org-9" }),
      ],
      bottlenecks: [bottleneck(), bottleneck({ id: "b-2" })],
    });

    expect(pairsIn(data, program, NOW)).toEqual([
      { ...fresh, bottlenecks: 2, stale: false, goalDone: 1, goalTotal: 4 },
      { ...stale, bottlenecks: 0, stale: true, goalDone: 0, goalTotal: 0 },
    ]);
  });
});

describe("meetingRate", () => {
  const weeks = [LAST_MONDAY, MONDAY];

  it("is unknown when there are no meeting dates and no pair has met", () => {
    expect(meetingRate([pair()], [], weeks, NOW)).toBeNull();
  });

  it("is unknown when nothing was due in the range", () => {
    expect(
      meetingRate([pair({ daysSinceMeeting: 3 })], [], weeks, NOW),
    ).toBeNull();
    expect(
      meetingRate(
        [pair()],
        [mark(day(11, 10), MeetingStatus.Completed)],
        [],
        NOW,
      ),
    ).toBeNull();
  });

  it("divides held meetings by the ones that were due", () => {
    const meetings = [
      mark(day(11, 10), MeetingStatus.Completed),
      mark(day(11, 3), MeetingStatus.Scheduled),
      mark(day(11, 12), MeetingStatus.Scheduled),
      mark(day(11, 4), MeetingStatus.Cancelled),
      mark(day(10, 20), MeetingStatus.Completed),
      mark(day(11, 17), MeetingStatus.Completed),
      mark(day(11, 10), MeetingStatus.Completed, { mentorId: "mentor-9" }),
    ];
    expect(meetingRate([pair()], meetings, weeks, NOW)).toEqual({
      completed: 1,
      planned: 2,
      percent: 50,
    });
  });
});

describe("goals and flags", () => {
  it("adds up the goals of the pairs that set any", () => {
    expect(goalRate([pair()])).toBeNull();
    expect(
      goalRate([
        pair({ goalDone: 1, goalTotal: 4 }),
        pair({ goalDone: 2, goalTotal: 4 }),
        pair(),
      ]),
    ).toEqual({ done: 3, total: 8, percent: 38 });
  });

  it("calls fewer than half of the goals done low", () => {
    expect(hasLowGoals(pair({ goalDone: 1, goalTotal: 4 }))).toBe(true);
    expect(hasLowGoals(pair({ goalDone: 2, goalTotal: 4 }))).toBe(false);
    expect(hasLowGoals(pair())).toBe(false);
  });

  it("flags stale pairs red and blocked or behind ones amber, once each", () => {
    const pairs = [
      pair({ stale: true, bottlenecks: 1 }),
      pair({ bottlenecks: 2 }),
      pair({ goalDone: 0, goalTotal: 2 }),
      pair(),
    ];
    expect(flagCounts(pairs)).toEqual({ red: 1, amber: 2 });
    expect(flagListCounts(pairs)).toEqual({
      stale: 1,
      bottleneck: 2,
      lowGoals: 1,
    });
  });

  it("counts the pairs' bottlenecks opened in the last seven days", () => {
    expect(daysSinceInstant(day(11, 4).toISOString(), NOW)).toBe(7);
    expect(
      bottlenecksOpenedThisWeek(
        [
          bottleneck(),
          bottleneck({ id: "old", createdAt: day(11, 3).toISOString() }),
          bottleneck({ id: "other", organizationId: "org-2" }),
        ],
        [pair()],
        NOW,
      ),
    ).toBe(1);
  });
});

describe("heatmap", () => {
  const meetings = [
    mark(day(11, 10), MeetingStatus.Completed),
    mark(day(11, 11, 9), MeetingStatus.Completed),
    mark(day(11, 12), MeetingStatus.Scheduled),
    mark(day(11, 3), MeetingStatus.Completed, { organizationId: "org-2" }),
  ];

  it("counts the pair's meetings with a status in a week", () => {
    expect(
      meetingCount(pair(), MONDAY, meetings, MeetingStatus.Completed),
    ).toBe(2);
    expect(
      meetingCount(pair(), MONDAY, meetings, MeetingStatus.Scheduled),
    ).toBe(1);
    expect(
      meetingCount(pair(), LAST_MONDAY, meetings, MeetingStatus.Completed),
    ).toBe(0);
  });

  it("marks a week held, missed or unknown", () => {
    expect(cellState(pair(), MONDAY, meetings, true, NOW)).toBe(HeatCell.Held);
    expect(cellState(pair(), LAST_MONDAY, meetings, true, NOW)).toBe(
      HeatCell.Missed,
    );
    expect(cellState(pair(), MONDAY, meetings, false, NOW)).toBe(
      HeatCell.Unknown,
    );
    expect(cellState(pair(), new Date(2026, 10, 16), meetings, true, NOW)).toBe(
      HeatCell.Unknown,
    );
    expect(
      cellState(
        pair({ startDate: "2026-11-09" }),
        LAST_MONDAY,
        meetings,
        true,
        NOW,
      ),
    ).toBe(HeatCell.Unknown);
  });

  it("counts the pairs with a held meeting in any week", () => {
    const pairs = [pair(), pair({ id: "m-2", organizationId: "org-3" })];
    expect(
      pairsWithMeeting(pairs, [LAST_MONDAY, MONDAY], meetings, true, NOW),
    ).toBe(1);
    expect(
      pairsWithMeeting(pairs, [LAST_MONDAY, MONDAY], meetings, false, NOW),
    ).toBe(0);
  });
});

describe("pair charts", () => {
  it("measures the days without a meeting at each week's end, or now for this week", () => {
    const held = [mark(day(11, 3), MeetingStatus.Completed)];
    expect(gapAtWeekEnd(pair(), LAST_MONDAY, held, NOW)).toBe(5);
    expect(gapAtWeekEnd(pair(), MONDAY, held, NOW)).toBe(8);
    expect(
      gapAtWeekEnd(pair({ startDate: "2026-11-01" }), LAST_MONDAY, [], NOW),
    ).toBe(8);
    expect(
      gapAtWeekEnd(pair({ startDate: "2026-11-20" }), MONDAY, [], NOW),
    ).toBeNull();
    expect(
      gapAtWeekEnd(
        pair({ startDate: "2026-11-01" }),
        LAST_MONDAY,
        [mark(day(11, 10), MeetingStatus.Completed)],
        NOW,
      ),
    ).toBe(8);
  });

  it("counts held meetings and past scheduled ones as planned", () => {
    const meetings = [
      mark(day(11, 9), MeetingStatus.Completed),
      mark(day(11, 10), MeetingStatus.Scheduled),
      mark(day(11, 13), MeetingStatus.Scheduled),
      mark(day(11, 10, 11), MeetingStatus.Cancelled),
      mark(day(11, 3), MeetingStatus.Completed),
      mark(day(11, 10), MeetingStatus.Completed, { mentorId: "mentor-9" }),
    ];
    expect(plannedInWeek(pair(), MONDAY, meetings, NOW)).toBe(2);
    expect(plannedInWeek(pair(), LAST_MONDAY, meetings, NOW)).toBe(1);
  });

  it("builds the chart rows with running totals", () => {
    const meetings = [
      mark(day(11, 3), MeetingStatus.Completed),
      mark(day(11, 9), MeetingStatus.Completed),
      mark(day(11, 10), MeetingStatus.Scheduled),
    ];
    const weeks = [LAST_MONDAY, MONDAY];
    expect(
      pairWeekPoints(pair(), weeks, meetings, (index) => `H${index + 1}`, NOW),
    ).toEqual([
      { week: "H1", gap: 5, planned: 1, completed: 1 },
      { week: "H2", gap: 2, planned: 3, completed: 2 },
    ]);
  });

  it("tops the gap chart a whole number of weeks above the peak, at least four weeks", () => {
    expect(gapTop([])).toBe(28);
    expect(gapTop([{ week: "H1", gap: null, planned: 0, completed: 0 }])).toBe(
      28,
    );
    expect(gapTop([{ week: "H1", gap: 40, planned: 0, completed: 0 }])).toBe(
      49,
    );
  });
});

describe("activityCounts", () => {
  it("counts the pairs' meetings and bottlenecks and the new accounts since the first week", () => {
    const data = overview({
      meetings: [
        mark(day(11, 10), MeetingStatus.Completed),
        mark(day(11, 12), MeetingStatus.Scheduled),
        mark(day(11, 10), MeetingStatus.Cancelled),
        mark(day(10, 1), MeetingStatus.Completed),
        mark(day(11, 10), MeetingStatus.Completed, { organizationId: "org-9" }),
      ],
      bottlenecks: [
        bottleneck(),
        bottleneck({ id: "old", createdAt: day(10, 1).toISOString() }),
        bottleneck({ id: "other", organizationId: "org-9" }),
      ],
      users: [
        user("new", day(11, 3).toISOString()),
        user("old", day(10, 1).toISOString()),
        user("unknown", null),
      ],
    });
    expect(activityCounts(data, [pair()], LAST_MONDAY)).toEqual({
      meetings: 2,
      completed: 1,
      bottlenecks: 1,
      accounts: 1,
    });
    expect(
      activityCounts(overview({ users: data.users }), [], LAST_MONDAY),
    ).toEqual({ meetings: 0, completed: 0, bottlenecks: 0, accounts: 1 });
  });
});

describe("formatting and exports", () => {
  it("labels a week by its first and last day", () => {
    const label = weekLabel(MONDAY, "tr");
    expect(label).toContain("9");
    expect(label).toContain("15");
  });

  it("formats a percentage the locale's way", () => {
    expect(formatPercent(75, "tr")).toBe("%75");
    expect(formatPercent(75, "en")).toBe("75%");
  });

  it("writes the program summary, with blanks when there is no program", () => {
    const program = adminProgram({
      name: "ODTÜ Stars",
      coordinatorName: "Deniz Acar",
      startupCount: 3,
      acceptedMentorCount: 2,
      pendingMentorCount: 1,
    });
    expect(programSummaryRows(program, t)).toEqual([
      ["Program", "Koordinatör", "Takım", "Mentor", "Bekleyen davet"],
      ["ODTÜ Stars", "Deniz Acar", "3", "2", "1"],
    ]);
    expect(programSummaryRows(null, t)[1]).toEqual(["", "", "0", "0", "0"]);
  });

  it("writes one meeting row per pair and the counts", () => {
    const pairs = [
      pair({ daysSinceMeeting: 4, goalDone: 1, goalTotal: 3, bottlenecks: 2 }),
      pair({ id: "m-2", mentorName: "Can Kaya", stale: true }),
    ];
    expect(meetingSummaryRows(pairs, t).slice(1)).toEqual([
      ["Ayşe Demir", "Lumen", "4", "1", "3", "2"],
      ["Can Kaya", "Lumen", "", "0", "0", "0"],
    ]);
    expect(countSummaryRows(pairs, t)).toEqual([
      ["Aktif eşleşme", "14+ gün görüşme yok", "Açık darboğazı olan"],
      ["2", "1", "1"],
    ]);
  });

  it("quotes every cell and doubles the quotes inside", () => {
    expect(
      csvText([
        ["a", 'say "hi"'],
        ["b", "c"],
      ]),
    ).toBe('"a","say ""hi"""\n"b","c"');
  });
});
