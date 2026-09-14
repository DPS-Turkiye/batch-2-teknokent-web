import { type MeetingItem, MeetingStatus } from "@/interfaces/meeting";
import {
  type MentorshipRequest,
  MentorshipRequestStatus,
} from "@/interfaces/mentorship-request";

export type ActiveMentorshipRow = {
  id: string;
  mentorName: string;
  supportArea: string;
  heldSessions: number;
  plannedSessions: number | null;
  nextMeetingAt: string | null;
};

/**
 * One row per accepted mentorship: sessions held are its completed meetings,
 * and the next one is its earliest meeting still to come.
 */
export function activeMentorships(
  requests: MentorshipRequest[],
  meetings: MeetingItem[],
  now: Date,
): ActiveMentorshipRow[] {
  return requests
    .filter((request) => request.status === MentorshipRequestStatus.Accepted)
    .map((request) => {
      const own = meetings.filter(
        (meeting) => meeting.mentorshipRequestId === request.id,
      );
      const upcoming = own
        .filter(
          (meeting) =>
            meeting.status === MeetingStatus.Scheduled &&
            new Date(meeting.scheduledAt) >= now,
        )
        .map((meeting) => meeting.scheduledAt)
        .sort((left, right) => left.localeCompare(right));
      return {
        id: request.id,
        mentorName: request.mentorName,
        supportArea: request.supportArea,
        heldSessions: own.filter(
          (meeting) => meeting.status === MeetingStatus.Completed,
        ).length,
        plannedSessions: request.plannedSessionCount ?? null,
        nextMeetingAt: upcoming[0] ?? null,
      };
    });
}
