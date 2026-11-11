import { describe, expect, it } from "vitest";

import {
  CoordinatorAgendaKind,
  type CoordinatorAgendaItem,
  type CoordinatorNextMeeting,
} from "@/interfaces/coordinator-overview";
import {
  agendaForToday,
  agendaWhen,
  hasOpenActions,
  meetingSlotLabel,
  type CoordinatorHomeTexts,
} from "@/lib/coordinator-home";
import { translatorIn } from "@test/translators";

function texts(locale: "tr" | "en"): CoordinatorHomeTexts {
  return {
    t: translatorIn(locale, "coordinatorHome"),
    locale,
  };
}

const now = new Date(2026, 8, 24, 10, 0);

function item(at: Date, allDay = false): CoordinatorAgendaItem {
  return {
    kind: CoordinatorAgendaKind.Event,
    title: "Atölye",
    subtitle: null,
    at: at.toISOString(),
    allDay,
  };
}

describe("coordinator home helpers", () => {
  it("keeps only today's agenda items", () => {
    const today = item(new Date(2026, 8, 24, 16, 0));
    const later = item(new Date(2026, 8, 26, 9, 0));
    expect(agendaForToday([today, later], now)).toEqual([today]);
  });

  it("labels today and other days, and hides the time of a due date", () => {
    expect(
      agendaWhen(item(new Date(2026, 8, 24, 16, 0)), texts("tr"), now),
    ).toEqual({ day: "Bugün", time: "16:00" });
    expect(
      agendaWhen(item(new Date(2026, 8, 26, 0, 0), true), texts("tr"), now),
    ).toEqual({ day: "26 Eyl", time: "Gün içinde" });
    expect(
      agendaWhen(item(new Date(2026, 8, 26, 0, 0), true), texts("en"), now),
    ).toEqual({ day: "Sep 26", time: "During the day" });
  });

  it("describes the next meeting's slot", () => {
    const meeting: CoordinatorNextMeeting = {
      meetingId: "meeting-1",
      title: "Finansal model",
      scheduledAt: new Date(2026, 8, 25, 14, 0).toISOString(),
      durationMinutes: 60,
      meetLink: null,
      sequence: 1,
      mentorId: "mentor-1",
      mentorName: "Ahmet Can",
      mentorTitle: null,
      organizationId: "org-1",
      organizationName: "Nova Robotics",
      founderName: null,
    };
    expect(meetingSlotLabel(meeting, "tr", now)).toBe("Yarın · 14:00–15:00");
    expect(meetingSlotLabel(meeting, "en", now)).toMatch(
      /^Tomorrow · 2:00\s–\s3:00\sPM$/,
    );
  });

  it("knows whether anything needs a decision", () => {
    expect(
      hasOpenActions({
        pendingMentors: [],
        awaitingTeams: [],
        missingNotes: [],
      }),
    ).toBe(false);
    expect(
      hasOpenActions({
        pendingMentors: [],
        awaitingTeams: [{}],
        missingNotes: [],
      }),
    ).toBe(true);
  });
});
