import { describe, expect, it } from "vitest";

import { ActionItemStatus, type ActionItem } from "@/interfaces/action-item";
import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import {
  isOverdueActionItem,
  meetingsAwaitingReview,
  mentorshipProgress,
  mentorWeekMeetingCount,
} from "@/lib/mentor-dashboard";

function item(overrides: Partial<ActionItem> = {}): ActionItem {
  return {
    id: "action-1",
    organizationId: "org-1",
    ownerId: "owner-1",
    title: "İş",
    status: ActionItemStatus.Open,
    createdAt: "2026-09-01T09:00:00.000Z",
    updatedAt: "2026-09-01T09:00:00.000Z",
    ...overrides,
  };
}

function pastMeeting(overrides: Partial<MeetingItem> = {}): MeetingItem {
  return {
    id: "meeting-1",
    organizationId: "org-1",
    scheduledAt: "2026-09-05T09:00:00.000Z",
    durationMinutes: 45,
    status: MeetingStatus.Scheduled,
    ...overrides,
  };
}

function meeting(
  scheduledAt: string,
  status = MeetingStatus.Scheduled,
): MeetingItem {
  return {
    id: scheduledAt,
    organizationId: "org",
    scheduledAt,
    durationMinutes: 45,
    status,
  };
}
describe("mentorWeekMeetingCount", () => {
  it("uses Monday-to-Sunday Istanbul boundaries, includes completed meetings, and excludes cancelled ones", () => {
    const meetings = [
      meeting("2026-09-06T20:59:59Z"),
      meeting("2026-09-06T21:00:00Z", MeetingStatus.Completed),
      meeting("2026-09-09T09:00:00Z"),
      meeting("2026-09-10T09:00:00Z", MeetingStatus.Cancelled),
      meeting("2026-09-13T20:59:59Z"),
      meeting("2026-09-13T21:00:00Z"),
      meeting("invalid"),
    ];
    expect(
      mentorWeekMeetingCount(meetings, new Date("2026-09-09T12:00:00Z")),
    ).toBe(3);
  });
  it("changes week at midnight in Istanbul even while UTC is still Sunday", () => {
    const meetings = [meeting("2026-09-13T21:00:00Z")];
    expect(
      mentorWeekMeetingCount(meetings, new Date("2026-09-13T21:01:00Z")),
    ).toBe(1);
    expect(mentorWeekMeetingCount([], new Date("2026-09-13T21:01:00Z"))).toBe(
      0,
    );
  });
});

describe("mentorshipProgress", () => {
  it("returns null when the mentorship has no action items", () => {
    expect(mentorshipProgress([])).toBeNull();
  });

  it("returns the completed share, ignoring cancelled items", () => {
    expect(
      mentorshipProgress([
        item({ id: "1", status: ActionItemStatus.Completed }),
        item({ id: "2", status: ActionItemStatus.Open }),
        item({ id: "3", status: ActionItemStatus.Cancelled }),
      ]),
    ).toBe(50);
  });

  it("returns null when every item was cancelled", () => {
    expect(
      mentorshipProgress([item({ status: ActionItemStatus.Cancelled })]),
    ).toBeNull();
  });
});

describe("isOverdueActionItem", () => {
  const now = new Date("2026-09-10T12:00:00.000Z");

  it("flags an open item past its due date", () => {
    expect(
      isOverdueActionItem(item({ dueDate: "2026-09-08T09:00:00.000Z" }), now),
    ).toBe(true);
  });

  it("does not flag an item that is still due", () => {
    expect(
      isOverdueActionItem(item({ dueDate: "2026-09-20T09:00:00.000Z" }), now),
    ).toBe(false);
  });

  it("does not flag a completed item", () => {
    expect(
      isOverdueActionItem(
        item({
          dueDate: "2026-09-08T09:00:00.000Z",
          status: ActionItemStatus.Completed,
        }),
        now,
      ),
    ).toBe(false);
  });

  it("does not flag an item without a due date", () => {
    expect(isOverdueActionItem(item({ dueDate: null }), now)).toBe(false);
  });
});

describe("meetingsAwaitingReview", () => {
  const now = new Date("2026-09-10T12:00:00.000Z");

  it("keeps a past meeting that has no write-up", () => {
    const past = pastMeeting();
    expect(meetingsAwaitingReview([past], now)).toEqual([past]);
  });

  it("ignores meetings that are still ahead", () => {
    expect(
      meetingsAwaitingReview(
        [pastMeeting({ scheduledAt: "2026-09-20T09:00:00.000Z" })],
        now,
      ),
    ).toEqual([]);
  });

  it("ignores a cancelled meeting", () => {
    expect(
      meetingsAwaitingReview(
        [pastMeeting({ status: MeetingStatus.Cancelled })],
        now,
      ),
    ).toEqual([]);
  });

  it("ignores a meeting with both notes and outcomes", () => {
    expect(
      meetingsAwaitingReview(
        [pastMeeting({ notes: "not", outcomes: "çıktı" })],
        now,
      ),
    ).toEqual([]);
  });

  it("returns the most recent meeting first", () => {
    const older = pastMeeting({
      id: "older",
      scheduledAt: "2026-09-01T09:00:00.000Z",
    });
    const newer = pastMeeting({
      id: "newer",
      scheduledAt: "2026-09-08T09:00:00.000Z",
    });
    expect(
      meetingsAwaitingReview([older, newer], now).map((m) => m.id),
    ).toEqual(["newer", "older"]);
  });
});
