import { describe, expect, it } from "vitest";

import { MeetingStatus } from "@/interfaces/meeting";
import { didNotTakePlace } from "@/lib/meeting-status";

describe("didNotTakePlace", () => {
  it.each([
    [{ status: MeetingStatus.Cancelled }, true],
    [
      { status: MeetingStatus.Completed, noShowAt: "2026-11-24T12:00:00Z" },
      true,
    ],
    [{ status: MeetingStatus.Completed, noShowAt: null }, false],
    [{ status: MeetingStatus.Scheduled }, false],
  ])("reads %o as %s", (meeting, expected) => {
    expect(didNotTakePlace(meeting)).toBe(expected);
  });
});
