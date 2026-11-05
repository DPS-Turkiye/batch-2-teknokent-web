import { describe, expect, it } from "vitest";

import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import { TRANSCRIPT_BOT_LEAD_MS } from "@/lib/const";
import {
  isTranscriptBotDue,
  nextTranscriptBotAction,
} from "@/lib/transcript-bot";

function meeting(overrides: Partial<MeetingItem> = {}): MeetingItem {
  return {
    id: "m-1",
    organizationId: "org-1",
    scheduledAt: "2026-09-02T12:00:00.000Z",
    durationMinutes: 60,
    meetLink: "https://meet.google.com/aaa-bbbb-ccc",
    transcribeRequested: true,
    status: MeetingStatus.Scheduled,
    ...overrides,
  };
}

describe("transcript bot timing", () => {
  const start = Date.parse("2026-09-02T12:00:00.000Z");

  it("is due from one minute before the start until the meeting ends", () => {
    expect(isTranscriptBotDue(meeting(), start - TRANSCRIPT_BOT_LEAD_MS)).toBe(
      true,
    );
    expect(isTranscriptBotDue(meeting(), start)).toBe(true);
    expect(isTranscriptBotDue(meeting(), start + 59 * 60_000)).toBe(true);
    expect(
      isTranscriptBotDue(meeting(), start - TRANSCRIPT_BOT_LEAD_MS - 1),
    ).toBe(false);
    expect(isTranscriptBotDue(meeting(), start + 60 * 60_000)).toBe(true);
    expect(isTranscriptBotDue(meeting(), start + 60 * 60_000 + 1)).toBe(false);
  });

  it("waits until one minute before start instead of polling", () => {
    const twoHoursBefore = start - 2 * 60 * 60_000;
    expect(nextTranscriptBotAction([meeting()], twoHoursBefore)).toEqual({
      meetingId: "m-1",
      meetLink: "https://meet.google.com/aaa-bbbb-ccc",
      delayMs: 2 * 60 * 60_000 - TRANSCRIPT_BOT_LEAD_MS,
      alreadyDispatched: false,
    });
  });

  it("fires immediately once the meeting window is open", () => {
    expect(nextTranscriptBotAction([meeting()], start)?.delayMs).toBe(0);
  });

  it("skips meetings that already sent the bot, have no link, or did not ask for a transcript", () => {
    expect(
      nextTranscriptBotAction([meeting({ transcribeRequested: false })], start),
    ).toBeNull();
    expect(
      nextTranscriptBotAction([meeting({ meetLink: "" })], start),
    ).toBeNull();
    expect(
      nextTranscriptBotAction(
        [meeting({ botDispatchedAt: "2026-09-02T11:59:00.000Z" })],
        start,
      ),
    ).toBeNull();
  });
});
