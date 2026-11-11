import { describe, expect, it } from "vitest";

import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import {
  ProgramMentorInvitedBy,
  ProgramMentorStatus,
  ProgramStatus,
  type Program,
} from "@/interfaces/program";
import {
  describeMeetingParticipants,
  meetingCalendarTitle,
} from "@/lib/meeting-participants";

const meeting: MeetingItem = {
  id: "m1",
  organizationId: "org-1",
  organizationName: "Döngü",
  mentorId: "mentor-1",
  mentorName: "mentör yılmaz",
  scheduledAt: "2026-09-02T08:00:00.000Z",
  durationMinutes: 60,
  agenda: "Mentor: mentör yılmaz",
  status: MeetingStatus.Scheduled,
};

describe("meetingCalendarTitle", () => {
  it("prefers the startup name on the calendar chip", () => {
    expect(meetingCalendarTitle(meeting)).toBe("Döngü");
  });
});

describe("describeMeetingParticipants", () => {
  it("lists the startup, mentor, mentee, and other program mentors", () => {
    const program: Program = {
      id: "prog-1",
      name: "Ön kuluçka",
      coordinatorId: "coord-1",
      coordinatorName: "Koordinatör",
      createdAt: "2026-01-01T00:00:00.000Z",
      status: ProgramStatus.Active,
      startups: [{ id: "org-1", name: "Döngü" }],
      mentors: [
        {
          mentorId: "mentor-1",
          fullName: "mentör yılmaz",
          email: "a@example.com",
          status: ProgramMentorStatus.Accepted,
          invitedBy: ProgramMentorInvitedBy.Coordinator,
          createdAt: "2026-01-01T00:00:00.000Z",
        },
        {
          mentorId: "mentor-2",
          fullName: "Ayşe Kaya",
          email: "b@example.com",
          status: ProgramMentorStatus.Accepted,
          invitedBy: ProgramMentorInvitedBy.Coordinator,
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    };

    const rows = describeMeetingParticipants(meeting, {
      mentorships: [
        {
          id: "req-1",
          requesterId: "mentee-1",
          requesterName: "Gülse",
          organizationId: "org-1",
          organizationName: "Döngü",
          mentorId: "mentor-1",
          mentorName: "mentör yılmaz",
          supportArea: "UX",
          status: MentorshipRequestStatus.Accepted,
          mentorMessage: null,
          rejectionReason: null,
          createdAt: "2026-01-01T00:00:00.000Z",
          messages: [],
          recommendationSnapshot: null,
        },
      ],
      programs: [program],
    });

    expect(rows).toEqual([
      { label: "Startup", name: "Döngü" },
      { label: "Mentor", name: "mentör yılmaz" },
      { label: "Mentee", name: "Gülse" },
      { label: "Program", name: "Ön kuluçka" },
    ]);
  });

  it("lists every startup and mentor already in the meeting room", () => {
    const rows = describeMeetingParticipants(meeting, {
      peers: [
        meeting,
        {
          ...meeting,
          id: "m2",
          organizationId: "org-2",
          organizationName: "NovaMed",
          mentorId: "mentor-2",
          mentorName: "Ayşe Kaya",
        },
      ],
    });

    expect(rows).toEqual([
      { label: "Startup", name: "Döngü" },
      { label: "Mentor", name: "mentör yılmaz" },
      { label: "Startup", name: "NovaMed" },
      { label: "Mentor", name: "Ayşe Kaya" },
    ]);
  });
});
