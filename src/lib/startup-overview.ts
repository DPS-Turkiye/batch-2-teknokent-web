import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import {
  meetingsForRequest,
  requestHasOpenMeeting,
} from "@/lib/mentorship-workspace";

export type ActiveMentorshipRow = {
  id: string;
  mentorName: string;
  supportArea: string;
  heldSessions: number;
  plannedSessions: number | null;
  nextMeetingAt: string | null;
};

/**
 * The mentorships Mentorluklarım lists under "Aktif": accepted, with a meeting
 * that hasn't ended. Sessions held are its completed meetings, and the next one
 * is its earliest meeting still to come.
 */
export function activeMentorships(
  requests: MentorshipRequest[],
  meetings: MeetingItem[],
  now: Date,
): ActiveMentorshipRow[] {
  return requests
    .filter(
      (request) =>
        request.status === MentorshipRequestStatus.Accepted &&
        requestHasOpenMeeting(meetings, request, now),
    )
    .map((request) => {
      const own = meetingsForRequest(meetings, request);
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
