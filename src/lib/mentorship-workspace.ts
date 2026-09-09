import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import { pickUpcomingMeetings } from "@/lib/upcoming-meetings";

export function meetingsForRequest(
  meetings: MeetingItem[],
  request: MentorshipRequest,
) {
  return meetings.filter(
    (meeting) =>
      meeting.mentorshipRequestId === request.id ||
      meeting.mentorId === request.mentorId,
  );
}

export function pickRequestMeeting(
  meetings: MeetingItem[],
  request: MentorshipRequest,
) {
  const related = meetingsForRequest(meetings, request);
  const upcoming = pickUpcomingMeetings(related).nextMeeting;
  if (upcoming) return upcoming;

  return (
    related
      .slice()
      .sort(
        (left, right) =>
          new Date(left.scheduledAt).getTime() -
          new Date(right.scheduledAt).getTime(),
      )[0] ?? null
  );
}

export function requestProgressPercent(
  meetings: MeetingItem[],
  request: MentorshipRequest,
) {
  const related = meetingsForRequest(meetings, request);
  const completed = related.filter(
    (meeting) =>
      String(meeting.status).toUpperCase() === MeetingStatus.Completed,
  ).length;
  return Math.min(90, 8 + completed * 18);
}
