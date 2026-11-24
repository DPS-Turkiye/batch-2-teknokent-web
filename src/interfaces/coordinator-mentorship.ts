import type { MeetingStatus } from "@/interfaces/meeting";

export enum MentorshipStatus {
  Planned = "PLANNED",
  Active = "ACTIVE",
  Paused = "PAUSED",
  Completed = "COMPLETED",
  Cancelled = "CANCELLED",
}

/** NEW until the mentorship is active, then graded by the program's meeting cadence. */
export enum CoordinatorMentorshipHealth {
  New = "NEW",
  Healthy = "HEALTHY",
  FollowUp = "FOLLOW_UP",
  Risky = "RISKY",
}

/** Where a coordinator's mentorship row comes from (backend `MentorshipSource`). */
export enum MentorshipSource {
  Mentorship = "MENTORSHIP",
  /** Accepting a request books a meeting but makes no mentorship row. */
  AcceptedRequest = "ACCEPTED_REQUEST",
}

/**
 * One row of the Mentorluklar table (`GET /api/coordinator/mentorships`). A row from an accepted request has no
 * mentorship: `id` is null and `requestId` names the request, so the drawer and reminders are not offered for it.
 */
export type CoordinatorMentorship = {
  id: string | null;
  programId: string;
  programName: string;
  mentorId: string;
  mentorName: string;
  mentorTitle: string | null;
  organizationId: string;
  organizationName: string;
  status: MentorshipStatus;
  health: CoordinatorMentorshipHealth;
  topic: string | null;
  startDate: string | null;
  lastMeetingAt: string | null;
  daysSinceLastMeeting: number | null;
  nextMeetingAt: string | null;
  openActions: number;
  overdueActions: number;
  missingNotes: number;
  source: MentorshipSource;
  requestId: string | null;
};

export type CoordinatorMentorshipMeeting = {
  id: string;
  title: string;
  scheduledAt: string | null;
  durationMinutes: number | null;
  status: MeetingStatus;
  hasNotes: boolean;
  /** The mentor marked that the startup did not come. */
  noShow?: boolean;
  noShowNote?: string | null;
};

/** The drawer. Goal titles stay between mentor and team, so only counts arrive. */
export type CoordinatorMentorshipDetail = {
  mentorship: CoordinatorMentorship;
  meetingFrequencyDays: number;
  staleAfterDays: number;
  pastMeetings: number;
  notedMeetings: number;
  lastNoteAt: string | null;
  goalsDone: number;
  goalsTotal: number;
  mentorLoad: number;
  mentorCapacity: number | null;
  founderName: string | null;
  memberCount: number;
  meetings: CoordinatorMentorshipMeeting[];
};
