import { describe, expect, it } from "vitest";

import {
  ProgramMentorInvitedBy,
  ProgramMentorStatus,
  ProgramStatus,
  type Program,
} from "@/interfaces/program";
import { programsAwaitingReview } from "@/lib/program-invitations";

function program(
  id: string,
  mentorId: string,
  status: ProgramMentorStatus,
  invitedBy: ProgramMentorInvitedBy,
): Program {
  return {
    id,
    name: id,
    coordinatorId: "c",
    coordinatorName: "C",
    createdAt: "2026-10-01T09:00:00Z",
    status: ProgramStatus.Active,
    startups: [],
    mentors: [
      {
        mentorId,
        fullName: "M",
        email: "m@example.com",
        status,
        invitedBy,
        createdAt: "2026-10-01T09:00:00Z",
      },
    ],
  };
}

describe("programsAwaitingReview", () => {
  it("keeps only the mentor's own pending joins", () => {
    const programs = [
      program(
        "mine",
        "m1",
        ProgramMentorStatus.Pending,
        ProgramMentorInvitedBy.Mentor,
      ),
      program(
        "invited",
        "m1",
        ProgramMentorStatus.Pending,
        ProgramMentorInvitedBy.Coordinator,
      ),
      program(
        "accepted",
        "m1",
        ProgramMentorStatus.Accepted,
        ProgramMentorInvitedBy.Mentor,
      ),
      program(
        "someone-else",
        "m2",
        ProgramMentorStatus.Pending,
        ProgramMentorInvitedBy.Mentor,
      ),
    ];

    expect(programsAwaitingReview(programs, "m1").map((p) => p.id)).toEqual([
      "mine",
    ]);
    expect(programsAwaitingReview(programs, undefined)).toEqual([]);
  });
});
