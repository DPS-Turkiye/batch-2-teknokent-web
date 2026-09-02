import { describe, expect, it } from "vitest";

import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import { pickUpcomingMeetings } from "@/lib/upcoming-meetings";

function meeting(overrides: Partial<MeetingItem> = {}): MeetingItem {
  return {
    id: "m1",
    organizationId: "org-1",
    scheduledAt: "2026-09-10T10:00:00.000Z",
    durationMinutes: 45,
    agenda: "Görüşme",
    status: MeetingStatus.Scheduled,
    ...overrides,
  };
}

describe("pickUpcomingMeetings", () => {
  const now = new Date("2026-09-02T12:00:00.000Z");

  it("keeps the soonest future scheduled meeting as next", () => {
    const later = meeting({
      id: "later",
      scheduledAt: "2026-09-20T10:00:00.000Z",
    });
    const sooner = meeting({
      id: "sooner",
      scheduledAt: "2026-09-05T10:00:00.000Z",
    });

    const result = pickUpcomingMeetings([later, sooner], { now });

    expect(result.nextMeeting?.id).toBe("sooner");
    expect(result.upcomingMeetings.map((item) => item.id)).toEqual([
      "sooner",
      "later",
    ]);
  });

  it("drops past, cancelled, and completed meetings", () => {
    const result = pickUpcomingMeetings(
      [
        meeting({
          id: "past",
          scheduledAt: "2026-09-01T10:00:00.000Z",
        }),
        meeting({
          id: "cancelled",
          scheduledAt: "2026-09-08T10:00:00.000Z",
          status: MeetingStatus.Cancelled,
        }),
        meeting({
          id: "done",
          scheduledAt: "2026-09-08T11:00:00.000Z",
          status: MeetingStatus.Completed,
        }),
        meeting({ id: "live" }),
      ],
      { now },
    );

    expect(result.upcomingMeetings.map((item) => item.id)).toEqual(["live"]);
  });

  it("keeps a meeting that has started but not yet ended", () => {
    const result = pickUpcomingMeetings(
      [
        meeting({
          id: "in-progress",
          scheduledAt: "2026-09-02T11:30:00.000Z",
          durationMinutes: 60,
        }),
      ],
      { now },
    );

    expect(result.nextMeeting?.id).toBe("in-progress");
    expect(result.upcomingMeetings.map((item) => item.id)).toEqual([
      "in-progress",
    ]);
  });

  it("returns every upcoming meeting, not only the next few", () => {
    const meetings = Array.from({ length: 6 }, (_, index) =>
      meeting({
        id: `m${index + 1}`,
        scheduledAt: `2026-09-${10 + index}T10:00:00.000Z`,
      }),
    );

    const result = pickUpcomingMeetings(meetings, { now });

    expect(result.upcomingMeetings.map((item) => item.id)).toEqual([
      "m1",
      "m2",
      "m3",
      "m4",
      "m5",
      "m6",
    ]);
  });
});
