import { describe, expect, it } from "vitest";

import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import { activeMentorships } from "@/lib/startup-overview";
import { expectLength } from "@test/fixtures/list-assertions";

const NOW = new Date("2026-08-28T09:00:00Z");

function request(
  id: string,
  status: MentorshipRequestStatus,
  plannedSessionCount: number | null = null,
): MentorshipRequest {
  return {
    id,
    requesterId: "founder-1",
    organizationId: "org-1",
    mentorId: `mentor-${id}`,
    mentorName: "Nihan Öztürk",
    supportArea: "Ürün konumlandırma",
    status,
    mentorMessage: null,
    rejectionReason: null,
    createdAt: "2026-08-01T09:00:00Z",
    messages: [],
    recommendationSnapshot: null,
    plannedSessionCount,
  };
}

function meeting(
  id: string,
  requestId: string,
  scheduledAt: string,
  status: MeetingStatus,
): MeetingItem {
  return {
    id,
    organizationId: "org-1",
    mentorshipRequestId: requestId,
    scheduledAt,
    durationMinutes: 45,
    status,
  };
}

describe("activeMentorships", () => {
  it("counts held sessions and finds the next meeting of each accepted mentorship", () => {
    const rows = activeMentorships(
      [request("r1", MentorshipRequestStatus.Accepted, 6)],
      [
        meeting("m1", "r1", "2026-08-10T09:00:00Z", MeetingStatus.Completed),
        meeting("m2", "r1", "2026-08-20T09:00:00Z", MeetingStatus.Completed),
        meeting("m3", "r1", "2026-09-02T09:00:00Z", MeetingStatus.Scheduled),
        meeting("m4", "r1", "2026-08-30T09:00:00Z", MeetingStatus.Scheduled),
        meeting("m5", "r1", "2026-08-25T09:00:00Z", MeetingStatus.Cancelled),
      ],
      NOW,
    );

    expect(rows).toEqual([
      {
        id: "r1",
        mentorName: "Nihan Öztürk",
        supportArea: "Ürün konumlandırma",
        heldSessions: 2,
        plannedSessions: 6,
        nextMeetingAt: "2026-08-30T09:00:00Z",
      },
    ]);
  });

  it("leaves out requests that are not accepted and meetings of other mentorships", () => {
    const rows = activeMentorships(
      [
        request("r1", MentorshipRequestStatus.Accepted),
        request("r2", MentorshipRequestStatus.Pending),
      ],
      [
        meeting("m1", "r2", "2026-08-10T09:00:00Z", MeetingStatus.Completed),
        meeting("m2", "r1", "2026-09-02T09:00:00Z", MeetingStatus.Scheduled),
        meeting("m3", "r2", "2026-09-05T09:00:00Z", MeetingStatus.Scheduled),
      ],
      NOW,
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: "r1",
      heldSessions: 0,
      plannedSessions: null,
      nextMeetingAt: "2026-09-02T09:00:00Z",
    });
  });

  it("keeps a mentorship whose meeting is still running, without offering it as the next one", () => {
    const rows = activeMentorships(
      [request("r1", MentorshipRequestStatus.Accepted)],
      [meeting("m1", "r1", "2026-08-28T08:30:00Z", MeetingStatus.Scheduled)],
      NOW,
    );

    expectLength(rows, 1);
    expect(rows[0].nextMeetingAt).toBeNull();
  });

  it("leaves out accepted mentorships that are over or have no meeting yet, like the Aktif tab", () => {
    const rows = activeMentorships(
      [
        request("ended", MentorshipRequestStatus.Accepted),
        request("unscheduled", MentorshipRequestStatus.Accepted),
      ],
      [
        meeting("m1", "ended", "2026-08-20T09:00:00Z", MeetingStatus.Completed),
        meeting("m2", "ended", "2026-08-27T09:00:00Z", MeetingStatus.Scheduled),
      ],
      NOW,
    );

    expect(rows).toEqual([]);
  });
});
