import type {
  AdminMentorship,
  AdminProgram,
  AdminStartup,
} from "@/interfaces/admin-overview";
import { MentorshipStatus } from "@/interfaces/coordinator-mentorship";
import { ProgramStatus, ProgramType } from "@/interfaces/program";

/** A startup as the admin overview lists it inside a program. */
export function adminStartup(
  overrides: Partial<AdminStartup> = {},
): AdminStartup {
  return {
    id: "org-1",
    name: "Lumen",
    sector: null,
    programId: "program-1",
    programName: "ODTÜ Stars 2026",
    ...overrides,
  };
}

/** An active startup-mentoring program with no members unless the overrides add them. */
export function adminProgram(
  overrides: Partial<AdminProgram> = {},
): AdminProgram {
  return {
    id: "program-1",
    name: "ODTÜ Stars 2026",
    status: ProgramStatus.Active,
    type: ProgramType.StartupMentoring,
    createdAt: "2026-01-01T00:00:00Z",
    coordinatorId: null,
    coordinatorName: null,
    startupCount: 0,
    acceptedMentorCount: 0,
    pendingMentorCount: 0,
    startups: [],
    mentors: [],
    ...overrides,
  };
}

/** An active mentorship of the startup "Lumen" (org-1). */
export function adminMentorship(
  overrides: Partial<AdminMentorship> = {},
): AdminMentorship {
  return {
    id: "m-1",
    mentorId: "mentor-1",
    mentorName: "Ayşe Demir",
    organizationId: "org-1",
    organizationName: "Lumen",
    status: MentorshipStatus.Active,
    startDate: "2026-01-01",
    endDate: null,
    progressPercent: 0,
    daysSinceMeeting: null,
    ...overrides,
  };
}
