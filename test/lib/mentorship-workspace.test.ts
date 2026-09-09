import { describe, expect, it } from "vitest";

import { MeetingStatus } from "@/interfaces/meeting";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import {
  formatRequestSentAt,
  pickRequestMeeting,
  requestProgressPercent,
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

describe("mentorship workspace helpers", () => {
  it("picks the next upcoming meeting for a request", () => {
    const meeting = pickRequestMeeting(
      [
        {
          id: "past",
          organizationId: "org-1",
          mentorId: "mentor-1",
          mentorshipRequestId: "req-1",
          scheduledAt: "2020-01-01T10:00:00.000Z",
          durationMinutes: 45,
          status: MeetingStatus.Completed,
        },
        {
          id: "next",
          organizationId: "org-1",
          mentorId: "mentor-1",
          mentorshipRequestId: "req-1",
          scheduledAt: "2099-08-30T11:00:00.000Z",
          durationMinutes: 45,
          status: MeetingStatus.Scheduled,
        },
      ],
      request,
    );

    expect(meeting?.id).toBe("next");
  });

  it("grows progress as completed meetings increase", () => {
    expect(requestProgressPercent([], request)).toBe(8);
    expect(
      requestProgressPercent(
        [
          {
            id: "done",
            organizationId: "org-1",
            mentorId: "mentor-1",
            scheduledAt: "2026-08-01T10:00:00.000Z",
            durationMinutes: 45,
            status: MeetingStatus.Completed,
          },
        ],
        request,
      ),
    ).toBe(26);
  });

  it("labels a request sent today with the local time", () => {
    expect(
      formatRequestSentAt(
        "2026-09-09T07:42:00.000Z",
        new Date("2026-09-09T12:00:00.000Z"),
      ),
    ).toMatch(/^bugün \d{2}:\d{2}$/);
  });
});
