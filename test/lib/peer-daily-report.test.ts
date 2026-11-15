import { describe, expect, it } from "vitest";

import {
  PeerActivityType,
  PeerMentorSkill,
  PeerReportStatus,
} from "@/interfaces/peer-reports";
import {
  activityInput,
  activityTimeLabel,
  answeredDailyParts,
  bannerWindow,
  dailyReportForm,
  dailyReportInput,
  dailyReportReady,
  emptyActivityForm,
  invalidActivityFields,
  latestUnreportedMeeting,
  meetingRowBadge,
  parseReportSearch,
  reportDayCards,
  reportWeekLabel,
  weekCardCounts,
} from "@/lib/peer-daily-report";
import { PeerReportBadge, PeerReportView } from "@/types/peer-reports";
import { peerDailyReportFixture } from "@test/fixtures/peer-reports";
import { reportDay, weeklyReport } from "@test/fixtures/peer-weekly-report";

const complete = {
  didToday: "İki görüşme.",
  challenge: "Çekingen mentee.",
  skills: [PeerMentorSkill.Empathy],
  learned: "Önce güven.",
  tomorrowPlan: "Rehberi bitirmek.",
};

describe("the day's form", () => {
  it("starts a never-saved day with the meeting reports' skills", () => {
    expect(dailyReportForm(peerDailyReportFixture()).skills).toEqual([
      PeerMentorSkill.ActiveListening,
    ]);
    expect(
      dailyReportForm(
        peerDailyReportFixture({ id: "day-1", skills: [], didToday: "Var" }),
      ),
    ).toMatchObject({ skills: [], didToday: "Var" });
  });

  it("sends blank answers as null", () => {
    expect(
      dailyReportInput({ ...complete, challenge: "  ", learned: " x " }),
    ).toEqual({ ...complete, challenge: null, learned: "x" });
  });

  it("counts the five parts and knows when the day can be sent", () => {
    expect(answeredDailyParts(complete)).toBe(5);
    expect(answeredDailyParts({ ...complete, skills: [], learned: "" })).toBe(
      3,
    );
    const day = peerDailyReportFixture({ missingMeetingReports: 0 });
    expect(dailyReportReady(day, complete)).toBe(true);
    expect(dailyReportReady(day, { ...complete, tomorrowPlan: "" })).toBe(
      false,
    );
    expect(dailyReportReady(peerDailyReportFixture(), complete)).toBe(false);
    expect(dailyReportReady({ ...day, editable: false }, complete)).toBe(false);
  });

  it("calls a meeting done once its report is sent", () => {
    const [meeting] = peerDailyReportFixture().meetings;
    if (!meeting) throw new Error("fixture meeting missing");
    expect(meetingRowBadge(meeting)).toBe(PeerReportBadge.AwaitingOutput);
    expect(
      meetingRowBadge({ ...meeting, reportStatus: PeerReportStatus.Draft }),
    ).toBe(PeerReportBadge.AwaitingOutput);
    expect(
      meetingRowBadge({ ...meeting, reportStatus: PeerReportStatus.InReview }),
    ).toBe(PeerReportBadge.Completed);
    expect(
      meetingRowBadge({ ...meeting, reportStatus: PeerReportStatus.Approved }),
    ).toBe(PeerReportBadge.Completed);
  });
});

describe("the week strip", () => {
  it("shows five days with their pills, today and the chosen one", () => {
    const cards = reportDayCards(
      "2026-11-09",
      [reportDay({ date: "2026-11-09" })],
      "2026-11-10",
      "2026-11-12",
    );
    expect(cards).toHaveLength(5);
    expect(cards[0]).toMatchObject({ badge: PeerReportBadge.Approved });
    expect(cards[1]).toMatchObject({ isSelected: true, badge: null });
    expect(cards[3]).toMatchObject({ isToday: true, isFuture: false });
    expect(cards[4]).toMatchObject({ isFuture: true });
  });

  it("labels the week across a month too", () => {
    expect(reportWeekLabel("2026-11-09", "tr")).toBe("9–13 Kasım 2026");
    expect(reportWeekLabel("2026-11-30", "tr")).toBe(
      "30 Kasım\u2009–\u20094 Aralık 2026",
    );
  });

  it("shows an activity's time on the program's clock", () => {
    expect(activityTimeLabel("2026-11-12T12:00:00Z", "tr")).toBe("15:00");
  });
});

describe("parseReportSearch", () => {
  const today = "2026-11-12";

  it("defaults to today's day in the daily view", () => {
    expect(parseReportSearch({}, today)).toEqual({
      view: PeerReportView.Daily,
      week: "2026-11-09",
      day: today,
    });
  });

  it("keeps a valid view, week and day", () => {
    expect(
      parseReportSearch(
        { view: "weekly", week: "2026-11-02", day: "2026-11-04" },
        today,
      ),
    ).toEqual({
      view: PeerReportView.Weekly,
      week: "2026-11-02",
      day: "2026-11-04",
    });
  });

  it("refuses a made-up view, an impossible day and a week that is not a Monday", () => {
    expect(
      parseReportSearch(
        { view: "monthly", week: "2026-11-11", day: "2026-02-30" },
        today,
      ),
    ).toEqual({ view: PeerReportView.Daily, week: "2026-11-09", day: today });
  });

  it("takes the week's last working day up to today when the day is outside it", () => {
    expect(
      parseReportSearch({ week: "2026-11-02", day: "2026-11-12" }, today).day,
    ).toBe("2026-11-06");
    expect(parseReportSearch({ day: "2026-11-14" }, "2026-11-14")).toEqual({
      view: PeerReportView.Daily,
      week: "2026-11-09",
      day: "2026-11-13",
    });
    expect(parseReportSearch({ week: "2026-11-16" }, today).day).toBe(
      "2026-11-16",
    );
  });
});

describe("Faaliyet ekle", () => {
  it("starts on the day, as resource preparation", () => {
    expect(emptyActivityForm("2026-11-12")).toMatchObject({
      activityDate: "2026-11-12",
      type: PeerActivityType.ResourcePrep,
    });
  });

  it("sends a valid activity, trimmed, with no mentee as null", () => {
    expect(
      activityInput({
        ...emptyActivityForm("2026-11-12"),
        title: "  Rehber ",
        durationMinutes: "90",
      }),
    ).toEqual({
      activityDate: "2026-11-12",
      type: PeerActivityType.ResourcePrep,
      title: "Rehber",
      durationMinutes: 90,
      menteeId: null,
      description: null,
    });
  });

  it.each(["", "0", "721", "9x", "1e2"])(
    "refuses %j minutes",
    (durationMinutes) => {
      expect(
        activityInput({
          ...emptyActivityForm("2026-11-12"),
          title: "Rehber",
          durationMinutes,
        }),
      ).toBeNull();
    },
  );

  it.each(["", "2026-02-30", "12.11.2026"])(
    "refuses the day %j",
    (activityDate) => {
      expect(
        activityInput({
          ...emptyActivityForm("2026-11-12"),
          activityDate,
          title: "Rehber",
          durationMinutes: "10",
        }),
      ).toBeNull();
    },
  );

  it("names each field that stops an activity", () => {
    expect(
      invalidActivityFields({
        ...emptyActivityForm(""),
        title: "Rehber",
        durationMinutes: "721",
      }),
    ).toEqual({ title: false, activityDate: true, durationMinutes: true });
  });

  it("refuses a blank title", () => {
    expect(
      activityInput({
        ...emptyActivityForm("2026-11-12"),
        title: " ",
        durationMinutes: "10",
      }),
    ).toBeNull();
  });
});

describe("Menteelerim's report banner", () => {
  it("asks for the latest held meeting whose report is not sent", () => {
    const [meeting] = peerDailyReportFixture().meetings;
    if (!meeting) throw new Error("fixture meeting missing");
    const older = {
      ...meeting,
      meetingId: "older",
      scheduledAt: "2026-11-10T09:00:00Z",
    };
    const newer = {
      ...meeting,
      meetingId: "newer",
      scheduledAt: "2026-11-12T09:00:00Z",
      reportStatus: PeerReportStatus.Draft,
    };
    const sent = {
      ...meeting,
      meetingId: "sent",
      scheduledAt: "2026-11-13T09:00:00Z",
      reportStatus: PeerReportStatus.InReview,
    };
    expect(latestUnreportedMeeting([older, sent, newer])?.meetingId).toBe(
      "newer",
    );
    expect(latestUnreportedMeeting([sent])).toBeNull();
    // Times may come with an offset; the order is by the instant, not the text.
    const offset = {
      ...meeting,
      meetingId: "offset",
      scheduledAt: "2026-11-12T14:00:00+03:00",
    };
    expect(latestUnreportedMeeting([offset, newer])?.meetingId).toBe("offset");
    expect(latestUnreportedMeeting([])).toBeNull();
  });

  it("looks back over the last seven days, across a month", () => {
    expect(bannerWindow("2026-12-03")).toEqual({
      from: "2026-11-27",
      to: "2026-12-03",
    });
  });
});

describe("weekCardCounts", () => {
  it("counts the week's meetings and activities, and asks for the evaluation until it is sent", () => {
    expect(weekCardCounts(weeklyReport())).toEqual({
      added: 11,
      waitingForAnswers: true,
    });
    expect(
      weekCardCounts(weeklyReport({ status: null, id: null }))
        .waitingForAnswers,
    ).toBe(true);
    expect(
      weekCardCounts(
        weeklyReport({ status: PeerReportStatus.Approved, editable: false }),
      ).waitingForAnswers,
    ).toBe(false);
  });
});
