import {
  CoordinatorMentorshipHealth,
  MentorshipStatus,
  type CoordinatorMentorship,
  type CoordinatorMentorshipDetail,
} from "@/interfaces/coordinator-mentorship";
import { MeetingStatus } from "@/interfaces/meeting";

const DAY = 86_400_000;

export function coordinatorMentorship(
  overrides: Partial<CoordinatorMentorship> = {},
): CoordinatorMentorship {
  return {
    id: "mentorship-1",
    programId: "program-1",
    programName: "METU Stars 2026",
    mentorId: "mentor-1",
    mentorName: "Ayşe Demir",
    mentorTitle: "Satış & GTM",
    organizationId: "org-1",
    organizationName: "Lumen",
    status: MentorshipStatus.Active,
    health: CoordinatorMentorshipHealth.Risky,
    topic: "Finansal model",
    startDate: "2026-06-02",
    lastMeetingAt: new Date(Date.now() - 18 * DAY).toISOString(),
    daysSinceLastMeeting: 18,
    nextMeetingAt: null,
    openActions: 2,
    overdueActions: 1,
    missingNotes: 0,
    ...overrides,
  };
}

export function coordinatorMentorshipDetail(
  overrides: Partial<CoordinatorMentorshipDetail> = {},
): CoordinatorMentorshipDetail {
  return {
    mentorship: coordinatorMentorship(),
    meetingFrequencyDays: 14,
    staleAfterDays: 14,
    pastMeetings: 4,
    notedMeetings: 4,
    lastNoteAt: "2026-09-04T09:00:00Z",
    goalsDone: 7,
    goalsTotal: 12,
    mentorLoad: 2,
    mentorCapacity: 3,
    founderName: "Deniz Ak",
    memberCount: 3,
    meetings: [
      {
        id: "meeting-1",
        title: "Nakit akışı",
        scheduledAt: "2026-09-04T09:00:00Z",
        durationMinutes: 60,
        status: MeetingStatus.Completed,
        hasNotes: true,
      },
    ],
    ...overrides,
  };
}
