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

/** One row of the Mentorluklar table (`GET /api/coordinator/mentorships`). */
export type CoordinatorMentorship = {
  id: string;
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
};

export type CoordinatorMentorshipMeeting = {
  id: string;
  title: string;
  scheduledAt: string | null;
  durationMinutes: number | null;
  status: MeetingStatus;
  hasNotes: boolean;
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
