import { describe, expect, it } from "vitest";

import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import {
  endedMeetingsForRequest,
  formatRequestSentAt,
  isMeetingEnded,
  pickRequestMeeting,
} from "@/lib/mentorship-workspace";

const request: MentorshipRequest = {
  id: "req-1",
  requesterId: "requester-1",
  organizationId: "org-1",
  mentorId: "mentor-1",
  mentorName: "Nihan Öztürk",
  supportArea: "UX/UI",
  status: MentorshipRequestStatus.Accepted,
  mentorMessage: null,
  rejectionReason: null,
  createdAt: "2026-08-17T09:49:54.374504Z",
  messages: [],
  recommendationSnapshot: null,
};

const now = new Date("2026-09-10T12:00:00Z");

function meeting(id: string, overrides: Partial<MeetingItem>): MeetingItem {
  return {
    id,
    organizationId: "org-1",
    mentorId: "mentor-1",
    mentorshipRequestId: "req-1",
    scheduledAt: "2026-09-12T10:00:00Z",
    durationMinutes: 45,
    status: MeetingStatus.Scheduled,
    ...overrides,
  };
}

describe("pickRequestMeeting", () => {
  it("answers null for a request without meetings", () => {
    expect(pickRequestMeeting([], request, now)).toBeNull();
  });

  it("falls back to the earliest open meeting when none of them is upcoming", () => {
    const later = meeting("later", {
      scheduledAt: "2026-09-20T10:00:00Z",
      status: MeetingStatus.Cancelled,
    });
    const sooner = meeting("sooner", {
      scheduledAt: "2026-09-15T10:00:00Z",
      status: MeetingStatus.Cancelled,
    });

    expect(pickRequestMeeting([later, sooner], request, now)).toBe(sooner);
  });

  it("picks the most recent meeting once all of them have ended", () => {
    const first = meeting("first", {
      scheduledAt: "2026-09-01T10:00:00Z",
      status: MeetingStatus.Completed,
    });
    const last = meeting("last", { scheduledAt: "2026-09-08T10:00:00Z" });

    expect(pickRequestMeeting([first, last], request, now)).toBe(last);
  });
});

describe("endedMeetingsForRequest", () => {
  it("lists the ended meetings newest first and leaves open ones out", () => {
    const older = meeting("older", {
      scheduledAt: "2026-09-01T10:00:00Z",
      status: MeetingStatus.Completed,
    });
    const newer = meeting("newer", { scheduledAt: "2026-09-09T10:00:00Z" });
    const open = meeting("open", {});

    expect(
      endedMeetingsForRequest([older, open, newer], request, now).map(
        (item) => item.id,
      ),
    ).toEqual(["newer", "older"]);
  });
});

describe("isMeetingEnded", () => {
  it("never ends a meeting with an unreadable start time", () => {
    expect(isMeetingEnded(meeting("x", { scheduledAt: "soon" }), now)).toBe(
      false,
    );
  });

  it("counts a meeting without a length as an hour long", () => {
    const started = meeting("x", {
      scheduledAt: "2026-09-10T11:30:00Z",
      durationMinutes: 0,
    });

    expect(isMeetingEnded(started, now)).toBe(false);
    expect(isMeetingEnded(started, new Date("2026-09-10T12:31:00Z"))).toBe(
      true,
    );
  });
});

describe("formatRequestSentAt", () => {
  it("labels a request sent yesterday as yesterday with its time", () => {
    expect(
      formatRequestSentAt(
        "2026-09-09T07:42:00.000Z",
        new Date("2026-09-10T12:00:00.000Z"),
      ),
    ).toMatch(/^dün \d{2}:\d{2}$/);
  });

  it("names the day and month of an older request", () => {
    expect(
      formatRequestSentAt(
        "2026-09-01T07:42:00.000Z",
        new Date("2026-09-10T12:00:00.000Z"),
      ),
    ).toMatch(/^1 Eylül \d{2}:\d{2}$/);
  });

  it("writes English when asked", () => {
    expect(
      formatRequestSentAt(
        "2026-09-09T07:42:00.000Z",
        new Date("2026-09-10T12:00:00.000Z"),
        "en",
      ),
    ).toMatch(/^yesterday \d{1,2}:\d{2}/);
  });
});
