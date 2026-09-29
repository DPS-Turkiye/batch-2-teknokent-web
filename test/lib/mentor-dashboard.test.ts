import { describe, expect, it } from "vitest";

import { ActionItemStatus, type ActionItem } from "@/interfaces/action-item";
import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import type { DocumentRequestItem } from "@/interfaces/document-request";
import {
  conversationMeetingLabel,
  isOverdueActionItem,
  meetingDayLabel,
  meetingsAwaitingReview,
  meetingWhenLabel,
  mentorshipFileRow,
  mentorshipProgress,
  mentorshipTaskRatio,
  mentorTodayActions,
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
describe("conversationMeetingLabel", () => {
  const now = new Date("2026-09-22T13:00:00.000Z");

  it("calls a past meeting the last one, not the next one", () => {
    expect(
      conversationMeetingLabel(meeting("2026-09-11T12:35:00.000Z"), now),
    ).toMatch(/^Son görüşme /);
  });

  it("calls an upcoming meeting the next one", () => {
    expect(
      conversationMeetingLabel(meeting("2026-09-24T09:00:00.000Z"), now),
    ).toMatch(/^Sonraki görüşme /);
  });

  it("returns nothing without a meeting", () => {
    expect(conversationMeetingLabel(null, now)).toBeNull();
  });
});

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

describe("mentorshipTaskRatio", () => {
  it("counts finished work against what still counts", () => {
    expect(
      mentorshipTaskRatio([
        item({ id: "a", status: ActionItemStatus.Completed }),
        item({ id: "b", status: ActionItemStatus.Open }),
        item({ id: "c", status: ActionItemStatus.Cancelled }),
      ]),
    ).toEqual({ done: 1, total: 2 });
  });

  it("has nothing to show without work", () => {
    expect(mentorshipTaskRatio([])).toBeNull();
    expect(
      mentorshipTaskRatio([item({ status: ActionItemStatus.Cancelled })]),
    ).toBeNull();
  });
});

describe("meetingDayLabel and meetingWhenLabel", () => {
  // Built in the runtime's own zone, so the labels read the same wherever CI runs.
  const at = (day: number, hour: number) =>
    new Date(2026, 8, day, hour, 0, 0).toISOString();
  const now = new Date(2026, 8, 11, 9, 0, 0);

  it("names today and tomorrow, then falls back to the date", () => {
    expect(meetingDayLabel(at(11, 15), now)).toBe("Bugün");
    expect(meetingDayLabel(at(12, 15), now)).toBe("Yarın");
    expect(meetingDayLabel(at(20, 15), now)).toMatch(/Eyl/);
  });

  it("reads out the whole slot", () => {
    expect(
      meetingWhenLabel(
        { ...pastMeeting({ scheduledAt: at(12, 14) }), durationMinutes: 45 },
        now,
      ),
    ).toBe("Yarın · 14:00 · 45 dk · Online");
  });
});

describe("mentorTodayActions", () => {
  it("asks for a write-up first, then the open work, flagging what is late", () => {
    const rows = mentorTodayActions(
      [
        pastMeeting({
          id: "m1",
          organizationName: "Döngü",
          agenda: "UX Flow Review",
        }),
      ],
      [
        item({
          id: "a1",
          organizationName: "Döngü",
          title: "Dosya bekleniyor",
          dueDate: "2026-09-01T09:00:00.000Z",
        }),
      ],
      new Date("2026-09-11T09:00:00.000Z"),
    );

    expect(rows).toEqual([
      {
        id: "m1",
        icon: "star",
        startup: "Döngü",
        detail: "UX Flow Review · değerlendirme bekliyor",
        chip: null,
        action: "Değerlendir",
        href: "/mentor-dashboard/meetings/m1/evaluation",
      },
      {
        id: "a1",
        icon: "paper",
        startup: "Döngü",
        detail: "Dosya bekleniyor",
        chip: "Gecikti",
        action: "Hatırlat",
        href: "/mentorships",
      },
    ]);
  });

  it("leaves work that is not late without a chip", () => {
    const [row] = mentorTodayActions(
      [],
      [item({ id: "a2", dueDate: "2026-09-30T09:00:00.000Z" })],
      new Date("2026-09-11T09:00:00.000Z"),
    );

    expect(row.chip).toBeNull();
    expect(row.action).toBe("Aç");
    expect(row.startup).toBe("Mentorluk");
  });
});

describe("mentorshipFileRow", () => {
  const request: DocumentRequestItem = {
    id: "req-1",
    title: "kullanici-akisi-v2.pdf",
    sortOrder: 0,
    dueDate: null,
    organizationId: "org-1",
    mentorshipRequestId: "request-1",
    meetingId: null,
    mentorshipId: null,
    programId: null,
    createdById: "mentor-1",
    createdByName: "Nihan",
    createdAt: "2026-09-11T09:00:00.000Z",
    uploads: [],
  };

  it("reads as waiting until the startup answers", () => {
    expect(mentorshipFileRow(request)).toEqual({
      id: "req-1",
      title: "kullanici-akisi-v2.pdf",
      detail: expect.stringContaining("Nihan talep etti · "),
      status: "Bekliyor",
    });
  });

  it("switches to the newest upload once one arrives", () => {
    const row = mentorshipFileRow({
      ...request,
      uploads: [
        {
          id: "u1",
          storedDocumentId: "d1",
          originalFilename: "eski.pdf",
          contentType: "application/pdf",
          sizeBytes: 1024,
          uploadedById: "mentee-1",
          uploadedByName: "Gülse",
          createdAt: "2026-09-12T09:00:00.000Z",
        },
        {
          id: "u2",
          storedDocumentId: "d2",
          originalFilename: "onboarding-v4.fig",
          contentType: "application/octet-stream",
          sizeBytes: 8_600_000,
          uploadedById: "mentee-1",
          uploadedByName: "Gülse",
          createdAt: "2026-09-13T09:00:00.000Z",
        },
      ],
    });

    expect(row.title).toBe("onboarding-v4.fig");
    expect(row.status).toBe("Yüklendi");
    expect(row.detail).toContain("Gülse yükledi");
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
