import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import { pickUpcomingMeetings } from "@/lib/upcoming-meetings";

export function meetingsForRequest(
  meetings: MeetingItem[],
  request: MentorshipRequest,
) {
  const linked = meetings.filter(
    (meeting) => meeting.mentorshipRequestId === request.id,
  );
  if (linked.length > 0) return linked;
  return meetings.filter((meeting) => meeting.mentorId === request.mentorId);
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

export function mentorWorkspaceName(request: MentorshipRequest) {
  return (
    request.organizationName ||
    request.requestedForName ||
    request.requesterName ||
    "Girişim"
  );
}

export function mentorWorkspacePerson(request: MentorshipRequest) {
  return request.requestedForName || request.requesterName || "";
}

export function mentorRequestHref(id: string) {
  return `/mentor-dashboard/mentorship/${encodeURIComponent(id)}`;
}

export function formatRequestSentAt(createdAt: string, now = new Date()) {
  const date = new Date(createdAt);
  const time = new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  const sameDay = (left: Date, right: Date) =>
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate();
  if (sameDay(date, now)) return `bugün ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, yesterday)) return `dün ${time}`;
  const day = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
  }).format(date);
  return `${day} ${time}`;
}
