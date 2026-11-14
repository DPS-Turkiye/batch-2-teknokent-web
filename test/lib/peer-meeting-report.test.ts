import { describe, expect, it } from "vitest";

import {
  PeerActionOwner,
  PeerMeetingTopic,
  PeerReportStatus,
} from "@/interfaces/peer-reports";
import {
  meetingDayLabel,
  meetingReportForm,
  meetingReportInput,
  meetingReportShownStatus,
  meetingSlotLabel,
  missingMeetingReportSections,
  newActionRow,
  parseDuration,
  productivityChoice,
  productivityValue,
  supportChoice,
  supportValue,
  toggled,
} from "@/lib/peer-meeting-report";
import {
  MeetingReportSection,
  SupportChoice,
} from "@/types/peer-meeting-report";
import {
  completePeerMeetingReportFixture,
  peerMeetingReportFixture,
} from "@test/fixtures/peer-reports";

describe("meetingReportForm and meetingReportInput", () => {
  it("round-trip a complete report, sending blank text as null", () => {
    const form = meetingReportForm(completePeerMeetingReportFixture());

    const input = meetingReportInput({ ...form, approach: "   " });

    expect(input.actualDurationMinutes).toBe(30);
    expect(input.approach).toBeNull();
    expect(input.discussion).toBe("Hedef şirket listesi çıkardık.");
    expect(input.actions).toEqual([
      {
        id: "action-1",
        text: "CV'yi yeniden yaz",
        owner: PeerActionOwner.Mentee,
        dueDate: "2026-11-15",
        done: false,
      },
    ]);
  });

  it("leaves out blank action rows and a follow-up time nobody asked for", () => {
    const form = meetingReportForm(peerMeetingReportFixture());
    const input = meetingReportInput({
      ...form,
      actualDurationMinutes: "",
      actions: [newActionRow()],
      followUpNeeded: false,
      followUpAt: "2026-11-19T14:00",
    });

    expect(input.actualDurationMinutes).toBeNull();
    expect(input.actions).toEqual([]);
    expect(input.followUpAt).toBeNull();
  });

  it("sends a chosen follow-up time as an instant", () => {
    const form = meetingReportForm(peerMeetingReportFixture());
    const input = meetingReportInput({
      ...form,
      followUpNeeded: true,
      followUpAt: "2026-11-19T14:00",
    });

    expect(input.followUpAt).toBe(new Date("2026-11-19T14:00").toISOString());
  });

  it("reads a saved follow-up back as a datetime-local value", () => {
    const at = new Date(2026, 10, 19, 14, 0).toISOString();
    const form = meetingReportForm(
      peerMeetingReportFixture({ followUpNeeded: true, followUpAt: at }),
    );
    expect(form.followUpAt).toBe("2026-11-19T14:00");
  });
});

describe("missingMeetingReportSections", () => {
  it("names nothing for a complete report", () => {
    expect(
      missingMeetingReportSections(
        meetingReportForm(completePeerMeetingReportFixture()),
      ),
    ).toEqual([]);
  });

  it("names every section with a required answer still empty, in the form's order", () => {
    expect(
      missingMeetingReportSections(
        meetingReportForm(
          peerMeetingReportFixture({ meetingType: null, meetingFormat: null }),
        ),
      ),
    ).toEqual([
      MeetingReportSection.Meeting,
      MeetingReportSection.Topic,
      MeetingReportSection.Details,
      MeetingReportSection.Skills,
      MeetingReportSection.Outcomes,
      MeetingReportSection.Evaluation,
    ]);
  });

  it("refuses a duration the backend would refuse, and a follow-up without a time", () => {
    const form = meetingReportForm(completePeerMeetingReportFixture());
    expect(
      missingMeetingReportSections({ ...form, actualDurationMinutes: "601" }),
    ).toEqual([MeetingReportSection.Meeting]);
    expect(
      missingMeetingReportSections({
        ...form,
        followUpNeeded: true,
        followUpAt: "",
      }),
    ).toEqual([MeetingReportSection.Outcomes]);
  });
});

describe("small helpers", () => {
  it("toggle a value in or out, keeping the order", () => {
    const topics = [PeerMeetingTopic.CvPreparation];
    expect(toggled(topics, PeerMeetingTopic.Other)).toEqual([
      PeerMeetingTopic.CvPreparation,
      PeerMeetingTopic.Other,
    ]);
    expect(toggled(topics, PeerMeetingTopic.CvPreparation)).toEqual([]);
  });

  it("start a new action for the mentee, with its own key", () => {
    const first = newActionRow();
    expect(first).toMatchObject({ id: null, owner: PeerActionOwner.Mentee });
    expect(newActionRow().key).not.toBe(first.key);
  });

  it("map the support answer both ways", () => {
    expect(supportChoice(null)).toBeNull();
    expect(supportChoice(true)).toBe(SupportChoice.Yes);
    expect(supportChoice(false)).toBe(SupportChoice.No);
    expect(supportValue(SupportChoice.Yes)).toBe(true);
    expect(supportValue(SupportChoice.No)).toBe(false);
  });

  it("show a never-saved report as a draft", () => {
    expect(meetingReportShownStatus(null)).toBe(PeerReportStatus.Draft);
    expect(meetingReportShownStatus(PeerReportStatus.InReview)).toBe(
      PeerReportStatus.InReview,
    );
  });

  it("label the day and the planned slot", () => {
    const at = new Date(2026, 10, 12, 14, 0).toISOString();
    expect(meetingDayLabel(at, "tr")).toBe("12 Kasım 2026, Perşembe");
    expect(meetingSlotLabel(at, 30, "tr")).toBe("14:00 – 14:30");
  });
});

describe("parseDuration", () => {
  it.each([
    ["35", 35],
    [" 600 ", 600],
    ["1", 1],
  ])("reads %j as %d minutes", (text, minutes) => {
    expect(parseDuration(text)).toBe(minutes);
  });

  it.each(["", "0", "-1", "601", "35abc", "35.9", "1e2", "abc", "1000"])(
    "refuses %j instead of guessing",
    (text) => {
      expect(parseDuration(text)).toBeNull();
    },
  );
});

describe("productivity choice", () => {
  it("maps the scale both ways and refuses anything off it", () => {
    expect(productivityChoice(4)).toBe("4");
    expect(productivityChoice(null)).toBeNull();
    expect(productivityValue("5")).toBe(5);
    expect(productivityValue("6")).toBeNull();
  });
});

describe("one missing answer names its own section", () => {
  const complete = meetingReportForm(completePeerMeetingReportFixture());

  it.each([
    [{ menteeNeed: "   " }, MeetingReportSection.Topic],
    [{ approach: "" }, MeetingReportSection.Details],
    [{ skillExample: "" }, MeetingReportSection.Skills],
    [{ productivity: null }, MeetingReportSection.Evaluation],
    [{ coordinatorSupportNeeded: null }, MeetingReportSection.Evaluation],
    [{ actualDurationMinutes: "35abc" }, MeetingReportSection.Meeting],
  ])("%j", (patch, section) => {
    expect(missingMeetingReportSections({ ...complete, ...patch })).toEqual([
      section,
    ]);
  });

  it("accepts a follow-up with its time", () => {
    expect(
      missingMeetingReportSections({
        ...complete,
        followUpNeeded: true,
        followUpAt: "2026-11-19T14:00",
      }),
    ).toEqual([]);
  });
});
