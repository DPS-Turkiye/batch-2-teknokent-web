import type { AdminOverview } from "@/interfaces/admin-overview";
import type { ProgramMeetingRatings } from "@/interfaces/program-report";

export function programMeetingRatings(
  overrides: Partial<ProgramMeetingRatings> = {},
): ProgramMeetingRatings {
  return {
    programId: "program-1",
    heldMeetingCount: 12,
    ratedMeetingCount: 9,
    feedbackCount: 9,
    average: 4.25,
    questionAverages: [4.5, 4, 3.8, 4.7],
    distribution: [0, 1, 4, 12, 19],
    ...overrides,
  };
}

export function reportOverview(overrides: Partial<AdminOverview> = {}) {
  return {
    programs: [
      {
        id: "program-1",
        name: "ODTÜ Stars 2026",
        status: "ACTIVE",
        createdAt: "2026-01-01T00:00:00Z",
        coordinatorId: "coord-1",
        coordinatorName: "Deniz Acar",
        startupCount: 1,
        acceptedMentorCount: 1,
        pendingMentorCount: 0,
        startups: [
          {
            id: "org-1",
            name: "Lumen",
            sector: null,
            programId: "program-1",
            programName: "ODTÜ Stars 2026",
          },
        ],
        mentors: [],
      },
    ],
    users: [],
    mentorships: [],
    requests: [],
    bottlenecks: [],
    meetingsLast8Weeks: 0,
    meetings: [],
    ...overrides,
  } satisfies AdminOverview;
}
