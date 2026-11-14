import { describe, expect, it } from "vitest";

import { PeerReportStatus } from "@/interfaces/peer-reports";
import {
  dailyReportHref,
  fromIsoDay,
  isPeerReportEditable,
  meetingReportHref,
  peerReportBadge,
  reportDayOf,
  reportWeekDays,
  reportWeekStart,
  shiftReportWeek,
  splitMinutes,
} from "@/lib/peer-reports";
import { PeerReportBadge } from "@/types/peer-reports";

describe("peerReportBadge", () => {
  it("shows the stored status, and nothing for a report nobody started", () => {
    expect(peerReportBadge(PeerReportStatus.Draft)).toBe(PeerReportBadge.Draft);
    expect(peerReportBadge(PeerReportStatus.InReview)).toBe(
      PeerReportBadge.InReview,
    );
    expect(peerReportBadge(PeerReportStatus.Approved)).toBe(
      PeerReportBadge.Approved,
    );
    expect(peerReportBadge(PeerReportStatus.RevisionRequested)).toBe(
      PeerReportBadge.RevisionRequested,
    );
    expect(peerReportBadge(null)).toBeNull();
    expect(peerReportBadge(PeerReportStatus.Draft, 0)).toBe(
      PeerReportBadge.Draft,
    );
    expect(peerReportBadge(null, 0)).toBeNull();
  });

  it("says Eksik Bilgi while an open day still lacks a meeting report", () => {
    expect(peerReportBadge(null, 1)).toBe(PeerReportBadge.MissingInfo);
    expect(peerReportBadge(PeerReportStatus.Draft, 2)).toBe(
      PeerReportBadge.MissingInfo,
    );
    expect(peerReportBadge(PeerReportStatus.RevisionRequested, 1)).toBe(
      PeerReportBadge.MissingInfo,
    );
  });

  it("keeps a sent day's status even if a later meeting is unreported", () => {
    expect(peerReportBadge(PeerReportStatus.InReview, 1)).toBe(
      PeerReportBadge.InReview,
    );
    expect(peerReportBadge(PeerReportStatus.Approved, 1)).toBe(
      PeerReportBadge.Approved,
    );
  });
});

describe("isPeerReportEditable", () => {
  it("lets the mentor change a new, draft or sent-back report only", () => {
    expect(isPeerReportEditable(null)).toBe(true);
    expect(isPeerReportEditable(PeerReportStatus.Draft)).toBe(true);
    expect(isPeerReportEditable(PeerReportStatus.RevisionRequested)).toBe(true);
    expect(isPeerReportEditable(PeerReportStatus.InReview)).toBe(false);
    expect(isPeerReportEditable(PeerReportStatus.Approved)).toBe(false);
  });
});

describe("report weeks", () => {
  it("start on the Monday of the moment's week", () => {
    expect(reportWeekStart(new Date(2026, 10, 12, 15, 0))).toBe("2026-11-09");
    expect(reportWeekStart(new Date(2026, 10, 15, 23, 59))).toBe("2026-11-09");
    expect(reportWeekStart(new Date(2026, 10, 16, 0, 0))).toBe("2026-11-16");
  });

  it("move by whole weeks, across a month", () => {
    expect(shiftReportWeek("2026-11-09", 1)).toBe("2026-11-16");
    expect(shiftReportWeek("2026-11-02", -1)).toBe("2026-10-26");
  });

  it("list Monday to Friday", () => {
    expect(reportWeekDays("2026-11-09")).toEqual([
      "2026-11-09",
      "2026-11-10",
      "2026-11-11",
      "2026-11-12",
      "2026-11-13",
    ]);
  });

  it("read a day at local midnight", () => {
    const day = fromIsoDay("2026-11-12");
    expect([day.getFullYear(), day.getMonth(), day.getDate()]).toEqual([
      2026, 10, 12,
    ]);
    expect(day.getHours()).toBe(0);
  });
});

describe("splitMinutes", () => {
  it("splits recorded time into hours and minutes", () => {
    expect(splitMinutes(165)).toEqual({ hours: 2, minutes: 45 });
    expect(splitMinutes(35)).toEqual({ hours: 0, minutes: 35 });
    expect(splitMinutes(680)).toEqual({ hours: 11, minutes: 20 });
  });

  it("never shows a negative or fractional time", () => {
    expect(splitMinutes(-5)).toEqual({ hours: 0, minutes: 0 });
    expect(splitMinutes(59.6)).toEqual({ hours: 1, minutes: 0 });
  });
});

describe("report links", () => {
  it("go to the day of a moment and to a meeting's report", () => {
    expect(dailyReportHref("2026-11-12T11:00:00Z")).toBe(
      "/student/peer-mentoring?tab=report&view=daily&day=2026-11-12",
    );
    expect(meetingReportHref("meeting/1")).toBe(
      "/student/peer-mentoring/reports/meetings/meeting%2F1",
    );
  });
});

describe("reportDayOf", () => {
  it("counts days in Istanbul, wherever the browser is", () => {
    // 22:30 UTC is already the next day in Istanbul (UTC+3), and still the same day in UTC-5.
    expect(reportDayOf("2026-11-12T22:30:00Z")).toBe("2026-11-13");
    expect(reportDayOf("2026-11-12T20:59:00Z")).toBe("2026-11-12");
  });
});
