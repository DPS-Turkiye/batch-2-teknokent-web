import { describe, expect, it } from "vitest";

import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import {
  googleCalendarAddUrl,
  icalFileContents,
  parseICalText,
  type CalendarEventText,
} from "@/lib/calendar-sync";
import { expectLength } from "@test/fixtures/list-assertions";

function meeting(overrides: Partial<MeetingItem> = {}): MeetingItem {
  return {
    id: "meeting-1",
    organizationId: "org-1",
    agenda: "Finansal model görüşmesi",
    scheduledAt: "2026-09-10T09:00:00.000Z",
    durationMinutes: 45,
    meetLink: "https://meet.example.com/abc",
    status: MeetingStatus.Scheduled,
    ...overrides,
  };
}

const text: CalendarEventText = {
  fallbackTitle: "Mentorluk Görüşmesi",
  description: (link) => `Teknokent Mentorluk Görüşmesi. Link: ${link}`,
};

describe("googleCalendarAddUrl", () => {
  it("builds a Google Calendar template link with the meeting's title and time", () => {
    const url = googleCalendarAddUrl(meeting(), text);
    expect(url).toContain("calendar.google.com/calendar/render");
    expect(url).toContain(encodeURIComponent("Finansal model görüşmesi"));
    expect(url).toContain("20260910T090000Z");
  });
});

describe("icalFileContents", () => {
  it("produces a valid VEVENT block with the meeting's link and time", () => {
    const ics = icalFileContents(meeting(), text);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("SUMMARY:Finansal model görüşmesi");
    expect(ics).toContain("DTSTART:20260910T090000Z");
    expect(ics).toContain("LOCATION:https://meet.example.com/abc");
    expect(ics).toContain("END:VEVENT");
  });

  it("falls back to the given title and describes the meeting with its link", () => {
    const { agenda: _agenda, ...untitled } = meeting();
    const ics = icalFileContents(untitled, text);
    expect(ics).toContain("SUMMARY:Mentorluk Görüşmesi");
    expect(ics).toContain(
      "DESCRIPTION:Teknokent Mentorluk Görüşmesi. Link: https://meet.example.com/abc",
    );
  });
});

describe("parseICalText", () => {
  it("parses one VEVENT into a MeetingItem", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "SUMMARY:Dış Toplantı",
      "DTSTART:20260910T090000Z",
      "DTEND:20260910T093000Z",
      "LOCATION:https://meet.example.com/xyz",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const events = parseICalText(ics);

    expectLength(events, 1);
    expect(events[0].agenda).toBe("Dış Toplantı");
    expect(events[0].scheduledAt).toBe("2026-09-10T09:00:00.000Z");
    expect(events[0].durationMinutes).toBe(30);
    expect(events[0].meetLink).toBe("https://meet.example.com/xyz");
    expect(events[0].status).toBe(MeetingStatus.GoogleCalendar);
  });

  it("parses multiple events and skips blocks with no start time", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "SUMMARY:First",
      "DTSTART:20260910T090000Z",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "SUMMARY:No start time",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "SUMMARY:Second",
      "DTSTART:20260911T140000Z",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const events = parseICalText(ics);

    expect(events).toHaveLength(2);
    expect(events.map((e) => e.agenda)).toEqual(["First", "Second"]);
  });

  it("returns an empty list for text with no events", () => {
    expect(parseICalText("not a calendar file")).toEqual([]);
  });

  it("defaults duration to 45 minutes when no end time is given", () => {
    const ics = [
      "BEGIN:VEVENT",
      "SUMMARY:No end",
      "DTSTART:20260910T090000Z",
      "END:VEVENT",
    ].join("\r\n");

    expect(parseICalText(ics)[0]?.durationMinutes).toBe(45);
  });
});
