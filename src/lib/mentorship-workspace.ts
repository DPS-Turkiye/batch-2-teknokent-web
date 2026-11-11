import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import { meetingCallHref as callHref } from "@/lib/meeting-context";
import { pickUpcomingMeetings } from "@/lib/upcoming-meetings";

export function meetingsForRequest(
  meetings: MeetingItem[],
  request: MentorshipRequest,
) {
  const linked = meetings.filter(
    (meeting) => meeting.mentorshipRequestId === request.id,
  );
  if (linked.length > 0) return linked;
  return meetings.filter(
    (meeting) =>
      !meeting.mentorshipRequestId &&
      meeting.mentorId === request.mentorId &&
      meeting.organizationId === request.organizationId,
  );
}

export function isMeetingEnded(meeting: MeetingItem, now = new Date()) {
  if (meeting.status === MeetingStatus.Completed) {
    return true;
  }
  const startMs = new Date(meeting.scheduledAt).getTime();
  if (Number.isNaN(startMs)) return false;
  const durationMs = Math.max(1, meeting.durationMinutes || 60) * 60_000;
  return now.getTime() > startMs + durationMs;
}

export function requestHasConfirmedMeeting(
  meetings: MeetingItem[],
  request: MentorshipRequest,
) {
  return meetingsForRequest(meetings, request).length > 0;
}

export function pickRequestMeeting(
  meetings: MeetingItem[],
  request: MentorshipRequest,
  now = new Date(),
) {
  const related = meetingsForRequest(meetings, request);
  const open = related.filter((meeting) => !isMeetingEnded(meeting, now));
  if (open.length > 0) {
    const upcoming = pickUpcomingMeetings(open).nextMeeting;
    if (upcoming) return upcoming;
    return (
      open
        .slice()
        .sort(
          (left, right) =>
            new Date(left.scheduledAt).getTime() -
            new Date(right.scheduledAt).getTime(),
        )[0] ?? null
    );
  }

  return (
    related
      .slice()
      .sort(
        (left, right) =>
          new Date(right.scheduledAt).getTime() -
          new Date(left.scheduledAt).getTime(),
      )[0] ?? null
  );
}

export function requestHasOpenMeeting(
  meetings: MeetingItem[],
  request: MentorshipRequest,
  now = new Date(),
) {
  return meetingsForRequest(meetings, request).some(
    (meeting) => !isMeetingEnded(meeting, now),
  );
}

export function requestHasEndedMeeting(
  meetings: MeetingItem[],
  request: MentorshipRequest,
  now = new Date(),
) {
  return meetingsForRequest(meetings, request).some((meeting) =>
    isMeetingEnded(meeting, now),
  );
}

export function meetingCallHref(meetingId: string) {
  return callHref(meetingId);
}

export function menteeRequestStatusHref(id: string) {
  return `/mentor-request/status?id=${encodeURIComponent(id)}`;
}

export function menteeRequestDetailHref(id: string) {
  return `/mentor-request/detail?id=${encodeURIComponent(id)}`;
}

export function activeMentorshipHref(
  request: MentorshipRequest,
  meeting: MeetingItem | null | undefined,
  viewerIsMentor: boolean,
) {
  if (meeting) {
    return meetingCallHref(meeting.id);
  }
  return viewerIsMentor
    ? mentorRequestStartupHref(request.id)
    : menteeRequestStatusHref(request.id);
}

export function meetingAboutHref(meetingId: string) {
  return `/meetings/research/about?id=${encodeURIComponent(meetingId)}`;
}

export function meetingFeedbackHref(meetingId: string) {
  return `/meetings/research/feedback?id=${encodeURIComponent(meetingId)}`;
}

export function assistantMeetingHref(meetingId: string) {
  return `/assistant?meetingId=${encodeURIComponent(meetingId)}`;
}

export function endedMeetingsForRequest(
  meetings: MeetingItem[],
  request: MentorshipRequest,
  now = new Date(),
) {
  return meetingsForRequest(meetings, request)
    .filter((meeting) => isMeetingEnded(meeting, now))
    .sort(
      (left, right) =>
        new Date(right.scheduledAt).getTime() -
        new Date(left.scheduledAt).getTime(),
    );
}

export function mentorshipPeriodLabel(
  meetings: MeetingItem[],
  request: MentorshipRequest,
  locale: string,
) {
  const format = new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "numeric",
  });
  const times = meetingsForRequest(meetings, request)
    .map((meeting) => new Date(meeting.scheduledAt).getTime())
    .filter((time) => !Number.isNaN(time));
  if (times.length === 0) {
    const created = new Date(request.createdAt);
    return Number.isNaN(created.getTime()) ? "" : format.format(created);
  }
  const first = format.format(new Date(Math.min(...times)));
  const last = format.format(new Date(Math.max(...times)));
  return first === last ? first : `${first} – ${last}`;
}

export function mentorshipTopics(
  meetings: MeetingItem[],
  request: MentorshipRequest,
) {
  const agendas = meetingsForRequest(meetings, request)
    .map((meeting) => meeting.agenda?.trim())
    .filter((agenda): agenda is string => Boolean(agenda));
  const unique = [...new Set(agendas)];
  return unique.length > 0 ? unique.join(", ") : request.supportArea;
}

export function requestProgressPercent(
  meetings: MeetingItem[],
  request: MentorshipRequest,
) {
  const related = meetingsForRequest(meetings, request);
  const completed = related.filter(
    (meeting) => meeting.status === MeetingStatus.Completed,
  ).length;
  return Math.min(90, 8 + completed * 18);
}

export function mentorWorkspaceName(
  request: MentorshipRequest,
  fallback: string,
) {
  return (
    request.organizationName ||
    request.requestedForName ||
    request.requesterName ||
    fallback
  );
}

export function mentorWorkspacePerson(request: MentorshipRequest) {
  return request.requestedForName || request.requesterName || "";
}

export function menteeRequestOwnerLabel(request: MentorshipRequest) {
  return (
    request.requestedForName?.trim() || request.requesterName?.trim() || ""
  );
}

export function mentorRequestMessagesHref(id: string) {
  return `/mentor-dashboard/messages?request=${encodeURIComponent(id)}`;
}

export function mentorshipRequestAllowsMessaging(
  status: MentorshipRequestStatus,
) {
  return (
    status === MentorshipRequestStatus.Pending ||
    status === MentorshipRequestStatus.MoreInfoRequested ||
    status === MentorshipRequestStatus.CounterProposed ||
    status === MentorshipRequestStatus.Accepted
  );
}

export function mentorRequestStartupHref(id: string) {
  return `/mentorships/requests/${encodeURIComponent(id)}`;
}

export function formatRequestSentAt(
  createdAt: string,
  now = new Date(),
  locale = "tr",
) {
  const date = new Date(createdAt);
  const time = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  const sameDay = (left: Date, right: Date) =>
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate();
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (sameDay(date, now)) return `${relative.format(0, "day")} ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, yesterday)) {
    return `${relative.format(-1, "day")} ${time}`;
  }
  const day = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
  }).format(date);
  return `${day} ${time}`;
}
