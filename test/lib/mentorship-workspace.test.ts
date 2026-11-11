import { describe, expect, it } from "vitest";

import { MeetingStatus } from "@/interfaces/meeting";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import {
  activeMentorshipHref,
  assistantMeetingHref,
  formatRequestSentAt,
  isMeetingEnded,
  meetingAboutHref,
  meetingCallHref,
  meetingFeedbackHref,
  menteeRequestDetailHref,
  menteeRequestStatusHref,
  mentorRequestMessagesHref,
  mentorRequestStartupHref,
  mentorshipRequestAllowsMessaging,
  pickRequestMeeting,
  requestHasConfirmedMeeting,
  requestHasEndedMeeting,
  requestHasOpenMeeting,
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

  it("does not attach another startup's calendar meeting via mentorId alone", () => {
    expect(
      requestHasConfirmedMeeting(
        [
          {
            id: "other-org",
            organizationId: "org-2",
            mentorId: "mentor-1",
            scheduledAt: "2099-08-30T11:00:00.000Z",
            durationMinutes: 45,
            status: MeetingStatus.Scheduled,
          },
        ],
        request,
      ),
    ).toBe(false);
  });

  it("attaches unlinked calendar meetings for the same mentor and startup", () => {
    expect(
      requestHasConfirmedMeeting(
        [
          {
            id: "calendar",
            organizationId: "org-1",
            mentorId: "mentor-1",
            scheduledAt: "2099-08-30T11:00:00.000Z",
            durationMinutes: 45,
            status: MeetingStatus.Scheduled,
          },
        ],
        request,
      ),
    ).toBe(true);
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
            mentorshipRequestId: "req-1",
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

  it("treats a meeting as ended after scheduledAt + duration", () => {
    const meeting = {
      id: "m1",
      organizationId: "org-1",
      mentorId: "mentor-1",
      mentorshipRequestId: "req-1",
      scheduledAt: "2026-09-10T10:00:00.000Z",
      durationMinutes: 45,
      status: MeetingStatus.Scheduled,
    };
    const during = new Date("2026-09-10T10:30:00.000Z");
    const after = new Date("2026-09-10T10:46:00.000Z");

    expect(isMeetingEnded(meeting, during)).toBe(false);
    expect(isMeetingEnded(meeting, after)).toBe(true);
    expect(
      isMeetingEnded({ ...meeting, status: MeetingStatus.Completed }, during),
    ).toBe(true);
  });

  it("keeps open meetings in Aktif and moves ended ones to Geçmiş helpers", () => {
    const openMeeting = {
      id: "open",
      organizationId: "org-1",
      mentorId: "mentor-1",
      mentorshipRequestId: "req-1",
      scheduledAt: "2099-08-30T11:00:00.000Z",
      durationMinutes: 45,
      status: MeetingStatus.Scheduled,
    };
    const endedMeeting = {
      id: "ended",
      organizationId: "org-1",
      mentorId: "mentor-1",
      mentorshipRequestId: "req-1",
      scheduledAt: "2020-01-01T10:00:00.000Z",
      durationMinutes: 45,
      status: MeetingStatus.Scheduled,
    };
    const now = new Date("2026-09-10T12:00:00.000Z");

    expect(requestHasOpenMeeting([openMeeting], request, now)).toBe(true);
    expect(requestHasEndedMeeting([openMeeting], request, now)).toBe(false);
    expect(requestHasOpenMeeting([endedMeeting], request, now)).toBe(false);
    expect(requestHasEndedMeeting([endedMeeting], request, now)).toBe(true);
  });

  it("builds feedback and call deep links from the meeting id", () => {
    expect(meetingFeedbackHref("meeting-9")).toBe(
      "/meetings/research/feedback?id=meeting-9",
    );
    expect(meetingCallHref("meeting-9")).toBe(
      "/meetings/research?id=meeting-9",
    );
    expect(meetingAboutHref("meeting-9")).toBe(
      "/meetings/research/about?id=meeting-9",
    );
    expect(assistantMeetingHref("meeting-9")).toBe(
      "/assistant?meetingId=meeting-9",
    );
    expect(menteeRequestStatusHref("req-1")).toBe(
      "/mentor-request/status?id=req-1",
    );
    expect(menteeRequestDetailHref("req 1")).toBe(
      "/mentor-request/detail?id=req%201",
    );
  });

  it("routes calendar-origin active cards to the meeting context page", () => {
    const meeting = {
      id: "meeting-cal",
      organizationId: "org-1",
      mentorId: "mentor-1",
      mentorshipRequestId: "req-1",
      scheduledAt: "2026-09-20T10:00:00.000Z",
      durationMinutes: 60,
      status: MeetingStatus.Scheduled,
    };
    const calendarRequest: MentorshipRequest = {
      ...request,
      supportArea: "Takvim toplantısı",
      summary: "Takvim toplantısı",
      mentorMessage: "Takvimden oluşturuldu",
    };

    expect(activeMentorshipHref(calendarRequest, meeting, true)).toBe(
      "/meetings/research?id=meeting-cal",
    );
    expect(activeMentorshipHref(request, meeting, false)).toBe(
      "/meetings/research?id=meeting-cal",
    );
    expect(activeMentorshipHref(request, null, true)).toBe(
      mentorRequestStartupHref(request.id),
    );
  });

  it("opens the mentor messages inbox for a request", () => {
    expect(mentorRequestMessagesHref("req-1")).toBe(
      "/mentor-dashboard/messages?request=req-1",
    );
    expect(
      mentorshipRequestAllowsMessaging(MentorshipRequestStatus.Pending),
    ).toBe(true);
    expect(
      mentorshipRequestAllowsMessaging(MentorshipRequestStatus.Declined),
    ).toBe(false);
  });
});
