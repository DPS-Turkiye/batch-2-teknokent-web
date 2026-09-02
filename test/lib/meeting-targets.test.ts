import { describe, expect, it } from "vitest";

import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import {
  ProgramMentorInvitedBy,
  ProgramMentorStatus,
  type Program,
} from "@/interfaces/program";
import {
  groupMeetingTargets,
  meetingRecipient,
  programsMentorHasJoined,
} from "@/lib/meeting-targets";

const program: Program = {
  id: "prog-1",
  name: "Metu Stars",
  coordinatorId: "coord-1",
  coordinatorName: "Koordinatör",
  createdAt: "2026-09-01T00:00:00.000Z",
  startups: [{ id: "org-1", name: "Döngü" }],
  mentors: [
    {
      mentorId: "mentor-1",
      fullName: "Mentor Yılmaz",
      email: "mentor@demo",
      status: ProgramMentorStatus.Accepted,
      invitedBy: ProgramMentorInvitedBy.Coordinator,
      createdAt: "2026-09-01T00:00:00.000Z",
    },
  ],
};

describe("programsMentorHasJoined", () => {
  it("keeps only programs this mentor accepted", () => {
    const pending: Program = {
      ...program,
      id: "prog-2",
      mentors: [
        {
          ...program.mentors[0],
          status: ProgramMentorStatus.Pending,
        },
      ],
    };

    expect(
      programsMentorHasJoined([program, pending], "mentor-1").map(
        (item) => item.id,
      ),
    ).toEqual(["prog-1"]);
  });
});

describe("groupMeetingTargets", () => {
  it("lists program startups even without a 1:1 mentorship", () => {
    const grouped = groupMeetingTargets([], [program]);

    expect(grouped.ungrouped).toEqual([]);
    expect(grouped.byProgram[0]?.items[0]).toMatchObject({
      organizationId: "org-1",
      organizationName: "Döngü",
      programId: "prog-1",
    });
  });

  it("attaches an accepted mentorship when the startup already has one", () => {
    const grouped = groupMeetingTargets(
      [
        {
          id: "req-1",
          requesterId: "mentee-1",
          organizationId: "org-1",
          organizationName: "Döngü",
          requesterName: "Gülse",
          mentorId: "mentor-1",
          mentorName: "Mentor Yılmaz",
          supportArea: "UX/UI Mentorluk",
          status: MentorshipRequestStatus.Accepted,
          mentorMessage: null,
          rejectionReason: null,
          createdAt: "2026-09-01T00:00:00.000Z",
          messages: [],
          recommendationSnapshot: null,
        },
      ],
      [program],
    );

    expect(grouped.byProgram[0]?.items[0]).toMatchObject({
      mentorshipRequestId: "req-1",
      requesterName: "Gülse",
    });
    expect(grouped.ungrouped).toEqual([]);
  });
});

describe("meetingRecipient", () => {
  it("prefers a mentorship id when the startup already has one", () => {
    expect(
      meetingRecipient({
        key: "req-1",
        organizationId: "org-1",
        organizationName: "Döngü",
        subtitle: "UX",
        mentorshipRequestId: "req-1",
        programId: "prog-1",
      }),
    ).toEqual({ mentorshipRequestId: "req-1" });
  });
});
