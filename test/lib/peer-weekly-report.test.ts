import { describe, expect, it } from "vitest";

import { PeerMentorSkill, PeerReportStatus } from "@/interfaces/peer-reports";
import {
  formatReportDay,
  formatReportDeadline,
  formatReportTime,
  isWeeklyLate,
  latestOutcomeMeetingId,
  menteeFirstNames,
  missingMeetingReports,
  outcomeActionProgress,
  outcomeLines,
  peerMeetingReportHref,
  reportToday,
  toWeeklyInput,
  weeklyAnswers,
  weeklyChecklist,
  weeklyDayCards,
  weeklySkillBars,
  weeklySpan,
  weeklyStatusNote,
  weeklySubmitBlock,
  weeklySubmitReason,
} from "@/lib/peer-weekly-report";
import { PeerReportBadge } from "@/types/peer-reports";
import {
  WeeklyCheck,
  WeeklyQuestion,
  WeeklyStatusNote,
  WeeklySubmitBlock,
  type WeeklyAnswers,
} from "@/types/peer-weekly-report";
import {
  reportDay,
  weeklyReport,
  weeklySummary,
} from "@test/fixtures/peer-weekly-report";

const FILLED: WeeklyAnswers = {
  [WeeklyQuestion.NeedsObserved]: "CV desteği",
  [WeeklyQuestion.Growth]: "Açık uçlu sorular",
  [WeeklyQuestion.NextWeekPlan]: "Grup görüşmesi",
};

/** Friday 13 Kasım 2026, 18:30 in Istanbul: the week is open to send. */
const FRIDAY_EVENING = new Date("2026-11-13T15:30:00Z");

describe("weeklyAnswers and toWeeklyInput", () => {
  it("reads the saved answers, with empty text for a missing one", () => {
    expect(weeklyAnswers(weeklyReport({ growth: null }))).toEqual({
      ...FILLED,
      [WeeklyQuestion.Growth]: "",
    });
  });

  it("sends trimmed answers and null for a blank one", () => {
    expect(
      toWeeklyInput({
        ...FILLED,
        [WeeklyQuestion.NeedsObserved]: "  CV desteği \n",
        [WeeklyQuestion.NextWeekPlan]: "   ",
      }),
    ).toEqual({
      needsObserved: "CV desteği",
      growth: "Açık uçlu sorular",
      nextWeekPlan: null,
    });
  });
});

describe("weeklyChecklist", () => {
  it("lists the dailies, the meeting reports and the answered questions, in the frame's order", () => {
    expect(
      weeklyChecklist(weeklyReport({ dailySent: 4 }), {
        ...FILLED,
        [WeeklyQuestion.Growth]: " ",
      }),
    ).toEqual([
      {
        check: WeeklyCheck.DailyReports,
        done: 4,
        total: 5,
        complete: false,
        blocking: false,
      },
      {
        check: WeeklyCheck.MeetingReports,
        done: 6,
        total: 6,
        complete: true,
        blocking: true,
      },
      {
        check: WeeklyCheck.Evaluation,
        done: 2,
        total: 3,
        complete: false,
        blocking: true,
      },
    ]);
  });

  it("counts a week without meetings as having every meeting report", () => {
    const meetings = weeklyChecklist(
      weeklyReport({
        summary: weeklySummary({
          meetingReportsSent: 0,
          meetingReportsTotal: 0,
        }),
      }),
      FILLED,
    )[1];
    expect(meetings?.complete).toBe(true);
  });
});

describe("weeklySubmitBlock", () => {
  it("lets a complete draft go once Friday 18:00 has passed", () => {
    expect(
      weeklySubmitBlock(weeklyReport(), FILLED, FRIDAY_EVENING),
    ).toBeNull();
  });

  it("waits for Friday 18:00", () => {
    expect(
      weeklySubmitBlock(
        weeklyReport(),
        FILLED,
        new Date("2026-11-13T14:59:00Z"),
      ),
    ).toBe(WeeklySubmitBlock.NotOpen);
  });

  it("is locked once sent: İncelemede and Onaylandı take no changes", () => {
    expect(
      weeklySubmitBlock(
        weeklyReport({ status: PeerReportStatus.InReview, editable: false }),
        FILLED,
        FRIDAY_EVENING,
      ),
    ).toBe(WeeklySubmitBlock.Locked);
  });

  it("waits for every meeting report, not for the dailies", () => {
    const missing = weeklyReport({
      summary: weeklySummary({ meetingReportsSent: 5 }),
    });
    expect(weeklySubmitBlock(missing, FILLED, FRIDAY_EVENING)).toBe(
      WeeklySubmitBlock.MeetingReports,
    );
    expect(
      weeklySubmitBlock(weeklyReport({ dailySent: 2 }), FILLED, FRIDAY_EVENING),
    ).toBeNull();
  });

  it("needs all three questions answered", () => {
    expect(
      weeklySubmitBlock(
        weeklyReport(),
        { ...FILLED, [WeeklyQuestion.NextWeekPlan]: "" },
        FRIDAY_EVENING,
      ),
    ).toBe(WeeklySubmitBlock.Evaluation);
  });

  it("keeps the week closed when its opening time can't be read", () => {
    expect(
      weeklySubmitBlock(
        weeklyReport({ opensAt: "not a time" }),
        FILLED,
        FRIDAY_EVENING,
      ),
    ).toBe(WeeklySubmitBlock.NotOpen);
  });

  it("still lets a late week be sent after Monday 23:59", () => {
    expect(
      weeklySubmitBlock(
        weeklyReport(),
        FILLED,
        new Date("2026-11-18T09:00:00Z"),
      ),
    ).toBeNull();
  });
});

describe("isWeeklyLate", () => {
  it("is late only while still unsent after the deadline", () => {
    const after = new Date("2026-11-16T21:00:00Z");
    expect(isWeeklyLate(weeklyReport(), after)).toBe(true);
    expect(isWeeklyLate(weeklyReport(), FRIDAY_EVENING)).toBe(false);
    expect(
      isWeeklyLate(
        weeklyReport({ status: PeerReportStatus.InReview, editable: false }),
        after,
      ),
    ).toBe(false);
  });
});

describe("weeklySkillBars", () => {
  it("orders the skills by use and sizes each bar against the week's meetings", () => {
    expect(weeklySkillBars(weeklySummary())).toEqual([
      { skill: PeerMentorSkill.ActiveListening, meetings: 6, percent: 100 },
      { skill: PeerMentorSkill.OpenQuestions, meetings: 5, percent: 83 },
      { skill: PeerMentorSkill.Feedback, meetings: 1, percent: 17 },
    ]);
  });

  it("keeps the catalogue order between equally used skills and never overflows", () => {
    expect(
      weeklySkillBars(
        weeklySummary({
          meetings: 2,
          skills: [
            { skill: PeerMentorSkill.Empathy, meetings: 3 },
            { skill: PeerMentorSkill.ActiveListening, meetings: 3 },
          ],
        }),
      ),
    ).toEqual([
      { skill: PeerMentorSkill.ActiveListening, meetings: 3, percent: 100 },
      { skill: PeerMentorSkill.Empathy, meetings: 3, percent: 100 },
    ]);
  });

  it("draws empty bars for a week without meetings", () => {
    expect(
      weeklySkillBars(
        weeklySummary({
          meetings: 0,
          skills: [{ skill: PeerMentorSkill.Feedback, meetings: 0 }],
        }),
      ),
    ).toEqual([{ skill: PeerMentorSkill.Feedback, meetings: 0, percent: 0 }]);
  });
});

describe("outcomes", () => {
  const [ayse] = weeklySummary().outcomes;

  it("keeps the written outcomes in meeting order, dropping blank ones", () => {
    expect(ayse && outcomeLines(ayse)).toEqual([
      {
        meetingId: "meeting-ayse-1",
        text: "6 şirketlik hedef listesi oluşturuldu.",
      },
    ]);
  });

  it("opens the mentee's latest report of the week", () => {
    expect(ayse && latestOutcomeMeetingId(ayse)).toBe("meeting-ayse-2");
    expect(
      latestOutcomeMeetingId({
        menteeId: "m",
        fullName: "M",
        meetings: 0,
        reports: [],
        actionsDone: 0,
        actionsTotal: 0,
      }),
    ).toBeNull();
  });

  it("links a meeting report page", () => {
    expect(peerMeetingReportHref("meeting/1")).toBe(
      "/student/peer-mentoring/reports/meetings/meeting%2F1",
    );
  });

  it("names the mentees by first name", () => {
    expect(menteeFirstNames(weeklySummary())).toEqual([
      "Ayşe",
      "Emre",
      "Deniz",
    ]);
  });
});

describe("formatting", () => {
  it("labels a day card as the frame does", () => {
    expect(formatReportDay("2026-11-09", "tr")).toEqual({
      weekday: "Pzt",
      date: "9 Kasım",
    });
  });

  it("shows a time as day, month and time in Turkey", () => {
    expect(formatReportTime("2026-11-13T15:00:00Z", "tr")).toBe(
      "13 Kasım, 18:00",
    );
  });

  it("shows a midnight deadline as the last minute of the day before", () => {
    expect(formatReportDeadline("2026-11-16T21:00:00Z", "tr")).toBe(
      "16 Kasım, 23:59",
    );
    expect(formatReportDeadline("x", "tr")).toBe("");
  });
});

describe("weeklyDayCards", () => {
  it("gives each day its pill, Eksik Bilgi for a missing meeting report, and marks today", () => {
    expect(
      weeklyDayCards(
        [
          reportDay({ date: "2026-11-09" }),
          reportDay({
            date: "2026-11-12",
            status: null,
            missingMeetingReports: 1,
          }),
          reportDay({ date: "2026-11-13", status: null }),
        ],
        "2026-11-13",
      ),
    ).toEqual([
      { date: "2026-11-09", badge: PeerReportBadge.Approved, isToday: false },
      {
        date: "2026-11-12",
        badge: PeerReportBadge.MissingInfo,
        isToday: false,
      },
      { date: "2026-11-13", badge: null, isToday: true },
    ]);
  });
});

describe("weeklyStatusNote", () => {
  const late = new Date("2026-11-17T08:00:00Z");

  it("explains a sent, approved or sent-back week", () => {
    expect(
      weeklyStatusNote(
        weeklyReport({ status: PeerReportStatus.InReview, editable: false }),
        late,
      ),
    ).toBe(WeeklyStatusNote.InReview);
    expect(
      weeklyStatusNote(
        weeklyReport({ status: PeerReportStatus.Approved, editable: false }),
        late,
      ),
    ).toBe(WeeklyStatusNote.Approved);
    expect(
      weeklyStatusNote(
        weeklyReport({ status: PeerReportStatus.RevisionRequested }),
        FRIDAY_EVENING,
      ),
    ).toBe(WeeklyStatusNote.Revision);
  });

  it("warns about an unsent week only after the deadline", () => {
    expect(weeklyStatusNote(weeklyReport(), FRIDAY_EVENING)).toBeNull();
    expect(
      weeklyStatusNote(weeklyReport({ status: null, id: null }), late),
    ).toBe(WeeklyStatusNote.Late);
  });
});

describe("view helpers", () => {
  const [ayse] = weeklySummary().outcomes;

  it("summarises a mentee's action steps", () => {
    expect(ayse && outcomeActionProgress(ayse)).toEqual({
      done: 2,
      total: 3,
      all: false,
    });
    expect(ayse && outcomeActionProgress({ ...ayse, actionsDone: 3 })).toEqual({
      done: 3,
      total: 3,
      all: true,
    });
    expect(
      ayse &&
        outcomeActionProgress({ ...ayse, actionsDone: 0, actionsTotal: 0 }),
    ).toBeNull();
  });

  it("counts the meeting reports still missing, never below zero", () => {
    expect(
      missingMeetingReports(weeklySummary({ meetingReportsSent: 4 })),
    ).toBe(2);
    expect(
      missingMeetingReports(weeklySummary({ meetingReportsSent: 7 })),
    ).toBe(0);
  });

  it("gives a reason only for a week that can still be sent", () => {
    expect(weeklySubmitReason(WeeklySubmitBlock.Locked)).toBeNull();
    expect(weeklySubmitReason(null)).toBeNull();
    expect(weeklySubmitReason(WeeklySubmitBlock.NotOpen)).toBe(
      WeeklySubmitBlock.NotOpen,
    );
  });

  it("spans the report's working days, or its Monday without days", () => {
    expect(weeklySpan(weeklyReport())).toEqual({
      first: "2026-11-09",
      last: "2026-11-13",
    });
    expect(weeklySpan(weeklyReport({ days: [] }))).toEqual({
      first: "2026-11-09",
      last: "2026-11-09",
    });
  });
});

describe("edge cases", () => {
  it("opens exactly at Friday 18:00 and is late only after 23:59 has passed", () => {
    const report = weeklyReport();
    expect(
      weeklySubmitBlock(report, FILLED, new Date(report.opensAt)),
    ).toBeNull();
    expect(isWeeklyLate(report, new Date("2026-11-16T20:59:59Z"))).toBe(false);
    expect(isWeeklyLate(report, new Date(report.deadline))).toBe(true);
  });

  it("names the first blocker: closed before missing reports, reports before answers", () => {
    const missing = weeklyReport({
      summary: weeklySummary({ meetingReportsSent: 1 }),
    });
    const empty = { ...FILLED, [WeeklyQuestion.Growth]: "" };
    expect(
      weeklySubmitBlock(missing, empty, new Date("2026-11-12T09:00:00Z")),
    ).toBe(WeeklySubmitBlock.NotOpen);
    expect(weeklySubmitBlock(missing, empty, FRIDAY_EVENING)).toBe(
      WeeklySubmitBlock.MeetingReports,
    );
  });

  it("keeps saying a sent-back week needs changes after the deadline", () => {
    expect(
      weeklyStatusNote(
        weeklyReport({ status: PeerReportStatus.RevisionRequested }),
        new Date("2026-11-17T08:00:00Z"),
      ),
    ).toBe(WeeklyStatusNote.Revision);
  });

  it("orders outcomes by meeting time whatever order they arrive in", () => {
    const outcome = {
      menteeId: "m",
      fullName: "Mentee",
      meetings: 2,
      actionsDone: 0,
      actionsTotal: 0,
      reports: [
        {
          meetingId: "later",
          scheduledAt: "2026-11-12T11:00:00Z",
          outcome: "İkinci",
        },
        {
          meetingId: "earlier",
          scheduledAt: "2026-11-10T11:00:00Z",
          outcome: "Birinci",
        },
      ],
    };
    expect(outcomeLines(outcome).map((line) => line.text)).toEqual([
      "Birinci",
      "İkinci",
    ]);
    expect(latestOutcomeMeetingId(outcome)).toBe("later");
  });

  it("shows nothing for a time it can't read", () => {
    expect(formatReportTime("x", "tr")).toBe("");
  });

  it("takes today from the program's clock, not the browser's", () => {
    // 23:30 UTC on Sunday is already Monday in Istanbul.
    expect(reportToday(new Date("2026-11-15T23:30:00Z"))).toBe("2026-11-16");
  });
});
