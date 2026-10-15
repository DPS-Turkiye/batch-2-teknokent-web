import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import type { MobileMessagePreview } from "@/interfaces/mobile";
import { ProgramMentorStatus, type Program } from "@/interfaces/program";
import { UserRole } from "@/interfaces/session";
import {
  MOBILE_CALENDAR,
  MOBILE_STARTUPS,
  mobileClock,
  type MobileTexts,
} from "@/lib/mobile";
import { meetingLinkLabel } from "@/lib/mobile-calendar";
import { meetingDayAndTime, meetingTitle } from "@/lib/mobile-home";
import { groupedMentorshipConversations } from "@/lib/mobile-messages";
import { visibleMeetings } from "@/lib/startup-meetings";
import { initials } from "@/lib/utils";

export const MENTOR_HOME_MESSAGE_LIMIT = 2;

const MINUTE_MS = 60_000;

export type MentorMeetingSummary = {
  id: string;
  startupName: string;
  startupInitials: string;
  detail: string;
  timeLine: string;
  href: string;
};

export type MentorStartupRow = {
  id: string;
  name: string;
  initials: string;
  program: string | null;
  next: string;
  planned: boolean;
  href: string;
};

export type MentorMessagePreview = {
  message: MobileMessagePreview;
  unreadCount: number;
};

export function endOf(meeting: MeetingItem) {
  return (
    new Date(meeting.scheduledAt).getTime() +
    meeting.durationMinutes * MINUTE_MS
  );
}

export function upcomingFor(
  meetings: MeetingItem[],
  organizationId: string,
  now: Date,
) {
  return (
    meetings
      .filter(
        (meeting) =>
          meeting.organizationId === organizationId &&
          String(meeting.status).toUpperCase() === MeetingStatus.Scheduled &&
          endOf(meeting) > now.getTime(),
      )
      .sort((left, right) =>
        left.scheduledAt.localeCompare(right.scheduledAt),
      )[0] ?? null
  );
}

/** "Positioning · 4. görüşme" and "Bugün · 16:30–17:15 · Google Meet". */
export function mentorMeetingSummary(
  meeting: MeetingItem,
  meetings: MeetingItem[],
  requests: MentorshipRequest[],
  texts: MobileTexts,
  now = new Date(),
): MentorMeetingSummary {
  const { t, locale } = texts;
  const request = requests.find(
    (item) => item.id === meeting.mentorshipRequestId,
  );
  const ordinal = visibleMeetings(meetings).filter(
    (other) =>
      other.organizationId === meeting.organizationId &&
      other.scheduledAt <= meeting.scheduledAt,
  ).length;
  const start = new Date(meeting.scheduledAt);
  const parts = [
    meetingDayAndTime(meeting, locale, now).day,
    `${mobileClock(start, locale)}–${mobileClock(new Date(endOf(meeting)), locale)}`,
  ];
  if (meeting.meetLink) parts.push(meetingLinkLabel(meeting.meetLink, t));
  const startupName = meeting.organizationName ?? t("meeting.startup");
  const topic = request
    ? texts.topicLabel(request.supportArea)
    : meetingTitle(meeting, t);
  return {
    id: meeting.id,
    startupName,
    startupInitials: initials(startupName),
    detail: `${topic} · ${t("meeting.ordinal", { ordinal })}`,
    timeLine: parts.join(" · "),
    href: `${MOBILE_CALENDAR}?meeting=${encodeURIComponent(meeting.id)}`,
  };
}

// The mentor's own programs first; a startup in several programs shows the first it shares.
export function programNameFor(
  programs: Program[],
  organizationId: string,
  mentorId: string,
) {
  const holding = programs.filter((program) =>
    program.startups.some((startup) => startup.id === organizationId),
  );
  const shared = holding.find((program) =>
    program.mentors.some(
      (mentor) =>
        mentor.mentorId === mentorId &&
        mentor.status === ProgramMentorStatus.Accepted,
    ),
  );
  return (shared ?? holding[0])?.name ?? null;
}

/** One row per startup the mentor works with, planned meetings first. */
export function mentorStartupRows(
  requests: MentorshipRequest[],
  meetings: MeetingItem[],
  programs: Program[],
  mentorId: string,
  texts: MobileTexts,
  now = new Date(),
): MentorStartupRow[] {
  const { t, locale } = texts;
  const byOrganization = new Map<string, MentorshipRequest>();
  for (const request of requests) {
    if (
      request.status === MentorshipRequestStatus.Accepted &&
      !byOrganization.has(request.organizationId)
    ) {
      byOrganization.set(request.organizationId, request);
    }
  }
  const rows = [...byOrganization.values()].map((request) => {
    const name =
      request.organizationName ?? request.requesterName ?? t("meeting.startup");
    const next = upcomingFor(meetings, request.organizationId, now);
    const when = next ? meetingDayAndTime(next, locale, now) : null;
    const row: MentorStartupRow = {
      id: request.organizationId,
      name,
      initials: initials(name),
      program: programNameFor(programs, request.organizationId, mentorId),
      next: when ? t("home.nextPlanned", when) : t("home.notPlanned"),
      planned: Boolean(next),
      href: `${MOBILE_STARTUPS}/${encodeURIComponent(request.organizationId)}`,
    };
    return {
      row,
      sortKey: next
        ? new Date(next.scheduledAt).getTime()
        : Number.POSITIVE_INFINITY,
    };
  });
  return rows
    .sort((left, right) => left.sortKey - right.sortKey)
    .map((item) => item.row);
}

export function mentorMessagePreviews(
  requests: MentorshipRequest[],
  texts: MobileTexts,
  now = new Date(),
): MentorMessagePreview[] {
  return groupedMentorshipConversations(
    requests.filter((request) => request.messages.length > 0),
    UserRole.Mentor,
    texts,
    now,
  )
    .slice(0, MENTOR_HOME_MESSAGE_LIMIT)
    .map((conversation) => ({
      message: {
        id: conversation.id,
        name: conversation.name,
        initials: conversation.initials,
        preview: conversation.preview,
        time: conversation.time,
        href: conversation.href,
      },
      unreadCount: conversation.unreadCount,
    }));
}
