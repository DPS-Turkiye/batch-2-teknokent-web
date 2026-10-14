import { describe, expect, it } from "vitest";

import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import {
  assistantStatusFor,
  isAssistantCalendarMeeting,
  matchCalendarMeetingId,
  toAssistantMeeting,
  withAssistantOverlay,
} from "@/lib/assistant-meetings";
import { parseMeetingUrl } from "@/lib/meeting-url";
import { MeetingStatus as AssistantStatus } from "@/types/assistant";

function meeting(overrides: Partial<MeetingItem> = {}): MeetingItem {
  return {
    id: "meeting-1",
    organizationId: "org-1",
    organizationName: "NovaMed",
    mentorName: "Leyla Aksoy",
    scheduledAt: "2026-09-02T12:00:00.000Z",
    durationMinutes: 60,
    agenda: "Ürün roadmap",
    meetLink: "https://meet.google.com/aaa-bbbb-ccc",
    transcribeRequested: true,
    status: MeetingStatus.Scheduled,
    ...overrides,
  };
}

const texts = { meetingFallback: "Mentorluk görüşmesi", locale: "tr" };

describe("parseMeetingUrl", () => {
  it("parses a Google Meet link", () => {
    expect(parseMeetingUrl("https://meet.google.com/aaa-bbbb-ccc")).toEqual({
      platform: "google_meet",
      nativeMeetingId: "aaa-bbbb-ccc",
    });
  });

  it("rejects an unsupported link", () => {
    expect(parseMeetingUrl("https://zoom.us/j/1")).toBeNull();
  });
});

describe("assistant calendar meetings", () => {
  it("keeps meetings that have a link or a requested transcript", () => {
    expect(isAssistantCalendarMeeting(meeting())).toBe(true);
    expect(
      isAssistantCalendarMeeting(
        meeting({ meetLink: "", transcribeRequested: false }),
      ),
    ).toBe(false);
  });

  it("marks a past meeting as completed so its transcript can stay in the list", () => {
    const now = Date.parse("2026-09-02T14:00:00.000Z");
    expect(assistantStatusFor(meeting(), now)).toBe(AssistantStatus.Completed);
    expect(toAssistantMeeting(meeting(), texts, now)).toMatchObject({
      id: "meeting-1",
      title: "Ürün roadmap",
      nativeMeetingId: "aaa-bbbb-ccc",
      status: AssistantStatus.Completed,
    });
  });

  it("matches a pasted Meet URL to the calendar row", () => {
    expect(
      matchCalendarMeetingId(
        [meeting()],
        "https://meet.google.com/aaa-bbbb-ccc",
      ),
    ).toBe("meeting-1");
  });

  it("keeps a ended meeting completed even if the bot overlay is still joining", () => {
    const now = Date.parse("2026-09-02T14:00:00.000Z");
    const mapped = toAssistantMeeting(meeting(), texts, now);
    expect(
      withAssistantOverlay(mapped, { status: AssistantStatus.Joining }).status,
    ).toBe(AssistantStatus.Completed);
  });
});
