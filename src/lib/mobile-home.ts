import type { MeetingItem } from "@/interfaces/meeting";
import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import type {
  MobileMeetingSummary,
  MobileMessagePreview,
  MobileTaskPreview,
} from "@/interfaces/mobile";
import { conversationTime } from "@/lib/coordinator-messages";
import { mentorshipRequestAllowsMessaging } from "@/lib/mentorship-workspace";
import type { HomeTask } from "@/lib/mentee-home";
import { MOBILE_CALENDAR, MOBILE_MESSAGES, MOBILE_TASKS } from "@/lib/mobile";
import { visibleMeetings } from "@/lib/startup-meetings";
import { initials } from "@/lib/utils";

export const HOME_TASK_LIMIT = 3;
export const HOME_MESSAGE_LIMIT = 2;

const DEFAULT_MEETING_TITLE = "Mentorluk görüşmesi";
const DEFAULT_MENTOR_NAME = "Mentörün";
const DAY_MS = 86_400_000;

const time = new Intl.DateTimeFormat("tr-TR", {
  hour: "2-digit",
  minute: "2-digit",
});
const dayMonth = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
});
const weekday = new Intl.DateTimeFormat("tr-TR", { weekday: "long" });

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayOffset(date: Date, now: Date) {
  return Math.round(
    (startOfDay(date).getTime() - startOfDay(now).getTime()) / DAY_MS,
  );
}

/** "Bugün · 14:00", "Yarın · 14:00", then "24 Eylül · 14:00". */
export function meetingWhenChip(meeting: MeetingItem, now = new Date()) {
  const start = new Date(meeting.scheduledAt);
  const offset = dayOffset(start, now);
  const day =
    offset === 0 ? "Bugün" : offset === 1 ? "Yarın" : dayMonth.format(start);
  return `${day} · ${time.format(start)}`;
}

/** "Perşembe 24 Eylül · 14:00–15:00 · Online" */
export function meetingTimeLine(meeting: MeetingItem) {
  const start = new Date(meeting.scheduledAt);
  const end = new Date(start.getTime() + meeting.durationMinutes * 60_000);
  const parts = [
    `${weekday.format(start)} ${dayMonth.format(start)}`,
    `${time.format(start)}–${time.format(end)}`,
  ];
  if (meeting.meetLink) parts.push("Online");
  return parts.join(" · ");
}

function meetingTitle(meeting: MeetingItem) {
  const firstLine = meeting.agenda?.split("\n")[0]?.trim();
  return firstLine || DEFAULT_MEETING_TITLE;
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
  now = new Date(),
): MobileMeetingSummary {
  const mentorName = meeting.mentorName || DEFAULT_MENTOR_NAME;
  const ordinal = meeting.mentorId ? meetingOrdinal(meeting, meetings) : 0;
  return {
    id: meeting.id,
    title: meetingTitle(meeting),
    whenChip: meetingWhenChip(meeting, now),
    mentorName,
    mentorInitials: initials(mentorName),
    mentorDetail: ordinal > 0 ? `${ordinal}. görüşme` : "Mentor",
    timeLine: meetingTimeLine(meeting),
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
  now = new Date(),
): MobileMessagePreview[] {
  return requests
    .filter(
      (request) =>
        mentorshipRequestAllowsMessaging(request.status) &&
        request.messages.length > 0,
    )
    .map((request) => ({
      request,
      last: request.messages.reduce((latest, message) =>
        message.createdAt > latest.createdAt ? message : latest,
      ),
    }))
    .sort((left, right) =>
      right.last.createdAt.localeCompare(left.last.createdAt),
    )
    .slice(0, HOME_MESSAGE_LIMIT)
    .map(({ request, last }) => ({
      id: request.id,
      name: request.mentorName,
      initials: initials(request.mentorName),
      preview: last.body,
      time: conversationTime(last.createdAt, now),
      href: `${MOBILE_MESSAGES}?conversation=${encodeURIComponent(request.id)}`,
    }));
}
