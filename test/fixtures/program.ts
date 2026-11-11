import {
  ProgramMentorInvitedBy,
  ProgramMentorStatus,
  ProgramStatus,
  type Program,
  type ProgramMentor,
} from "@/interfaces/program";

/** An active program with no startups or mentors yet, as `GET /api/programs` lists it. */
export function program(overrides: Partial<Program> = {}): Program {
  return {
    id: "prog-1",
    name: "Seed 2026",
    coordinatorId: "coord-1",
    coordinatorName: "Demo Coordinator",
    createdAt: "2026-09-01T08:00:00Z",
    status: ProgramStatus.Active,
    startups: [],
    mentors: [],
    ...overrides,
  };
}

/** A mentor who accepted a coordinator's invitation to a program. */
export function programMentor(
  overrides: Partial<ProgramMentor> = {},
): ProgramMentor {
  return {
    mentorId: "mentor-1",
    fullName: "Leyla Aksoy",
    email: "leyla@mentor.test",
    status: ProgramMentorStatus.Accepted,
    invitedBy: ProgramMentorInvitedBy.Coordinator,
    createdAt: "2026-09-02T08:00:00Z",
    ...overrides,
  };
}
