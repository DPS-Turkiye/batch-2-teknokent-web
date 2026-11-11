import type { AdminOverview } from "@/interfaces/admin-overview";
import { ProgramStatus, ProgramType } from "@/interfaces/program";
import {
  MeetingFeedbackSide,
  type ProgramMeetingFeedback,
  type ProgramMeetingRatings,
} from "@/interfaces/program-report";

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
        status: ProgramStatus.Active,
        type: ProgramType.StartupMentoring,
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

export function programMeetingFeedback(
  overrides: Partial<ProgramMeetingFeedback> = {},
): ProgramMeetingFeedback {
  return {
    id: "feedback-1",
    meetingAt: "2026-11-05T11:00:00Z",
    meetingTitle: "UX Flow Review",
    mentorName: "Leyla Aksoy",
    organizationName: "Lumen",
    authorName: "Gülse Buran",
    side: MeetingFeedbackSide.Mentee,
    ratings: [5, 4, 4, 3],
    qualities: ["Somut aksiyonlar belirlemek"],
    note: "Satış hunisini bir dahaki sefere konuşalım.",
    submittedAt: "2026-11-05T12:30:00Z",
    ...overrides,
  };
}

/** useProgramMeetingFeedback's result; an empty first page unless told otherwise. */
export function meetingFeedbackState(
  overrides: Partial<{
    feedback: ProgramMeetingFeedback[];
    total: number;
    page: number;
    totalPages: number;
    isLoading: boolean;
    error: Error | null;
    hasPrevious: boolean;
    hasNext: boolean;
    previous: () => void;
    next: () => void;
  }> = {},
) {
  return {
    feedback: [],
    total: 0,
    page: 0,
    totalPages: 0,
    isLoading: false,
    error: null,
    hasPrevious: false,
    hasNext: false,
    previous: () => undefined,
    next: () => undefined,
    ...overrides,
  };
}
