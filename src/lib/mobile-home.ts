import type { MeetingItem } from "@/interfaces/meeting";
import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import type {
  MobileMeetingSummary,
  MobileMessagePreview,
  MobileTaskPreview,
} from "@/interfaces/mobile";
import { UserRole } from "@/interfaces/session";
import type { HomeTask } from "@/lib/mentee-home";
import {
  MOBILE_CALENDAR,
  MOBILE_TASKS,
  mobileClock,
  mobileDayMonth,
  mobileLongDay,
  type MobileTexts,
} from "@/lib/mobile";
import { groupedMentorshipConversations } from "@/lib/mobile-messages";
import { visibleMeetings } from "@/lib/startup-meetings";
import { initials, relativeDayLabel } from "@/lib/utils";

export const HOME_TASK_LIMIT = 3;
export const HOME_MESSAGE_LIMIT = 2;

const DAY_MS = 86_400_000;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayOffset(date: Date, now: Date) {
  return Math.round(
    (startOfDay(date).getTime() - startOfDay(now).getTime()) / DAY_MS,
  );
}

/** "Bugün", "Yarın" or "24 Eylül", and "14:00". */
export function meetingDayAndTime(
  meeting: MeetingItem,
  locale: string,
  now = new Date(),
) {
  const start = new Date(meeting.scheduledAt);
  const offset = dayOffset(start, now);
  const day =
    offset === 0 || offset === 1
      ? relativeDayLabel(offset, locale)
      : mobileDayMonth(start, locale);
  return { day, time: mobileClock(start, locale) };
}

/** "Bugün · 14:00", "Yarın · 14:00", then "24 Eylül · 14:00". */
export function meetingWhenChip(
  meeting: MeetingItem,
  locale: string,
  now = new Date(),
) {
  const when = meetingDayAndTime(meeting, locale, now);
  return `${when.day} · ${when.time}`;
}

/** "Perşembe 24 Eylül · 14:00–15:00 · Online" */
export function meetingTimeLine(meeting: MeetingItem, texts: MobileTexts) {
  const start = new Date(meeting.scheduledAt);
  const end = new Date(start.getTime() + meeting.durationMinutes * 60_000);
  const parts = [
    mobileLongDay(start, texts),
    `${mobileClock(start, texts.locale)}–${mobileClock(end, texts.locale)}`,
  ];
  if (meeting.meetLink) parts.push(texts.t("meeting.online"));
  return parts.join(" · ");
}

export function meetingTitle(meeting: MeetingItem, t: MobileTexts["t"]) {
  const firstLine = meeting.agenda?.split("\n")[0]?.trim();
  return firstLine || t("meeting.defaultTitle");
}

// Counts every non-cancelled meeting with the same mentor up to this one.
function meetingOrdinal(meeting: MeetingItem, meetings: MeetingItem[]) {
  return visibleMeetings(meetings).filter(
    (other) =>
      other.mentorId === meeting.mentorId &&
      other.scheduledAt <= meeting.scheduledAt,
  ).length;
}

export function meetingSummary(
  meeting: MeetingItem,
  meetings: MeetingItem[],
  texts: MobileTexts,
  now = new Date(),
): MobileMeetingSummary {
  const { t } = texts;
  const mentorName = meeting.mentorName || t("meeting.yourMentor");
  const ordinal = meeting.mentorId ? meetingOrdinal(meeting, meetings) : 0;
  return {
    id: meeting.id,
    title: meetingTitle(meeting, t),
    whenChip: meetingWhenChip(meeting, texts.locale, now),
    mentorName,
    mentorInitials: initials(mentorName),
    mentorDetail:
      ordinal > 0 ? t("meeting.ordinal", { ordinal }) : t("meeting.mentor"),
    timeLine: meetingTimeLine(meeting, texts),
    href: `${MOBILE_CALENDAR}?meeting=${encodeURIComponent(meeting.id)}`,
  };
}

export function taskPreviews(tasks: HomeTask[]): MobileTaskPreview[] {
  return tasks.slice(0, HOME_TASK_LIMIT).map((task) => ({
    id: task.id,
    title: task.title,
    subtitle: task.subtitle,
    dueLabel: task.dueLabel,
    dueTone: task.dueTone,
    href: MOBILE_TASKS,
  }));
}

/** The latest message of each thread that can still be written in, newest first, as Mesajlar lists them. */
export function messagePreviews(
  requests: MentorshipRequest[],
  texts: MobileTexts,
  now = new Date(),
): MobileMessagePreview[] {
  return groupedMentorshipConversations(
    requests.filter((request) => request.messages.length > 0),
    UserRole.Mentee,
    texts,
    now,
  )
    .slice(0, HOME_MESSAGE_LIMIT)
    .map((conversation) => ({
      id: conversation.id,
      name: conversation.name,
      initials: conversation.initials,
      preview: conversation.preview,
      time: conversation.time,
      href: conversation.href,
    }));
}
