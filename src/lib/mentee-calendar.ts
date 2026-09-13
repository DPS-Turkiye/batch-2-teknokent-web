import { ActionItemStatus } from "@/interfaces/action-item";
import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import {
  CalendarFilter,
  DAY_SHORT_LABELS,
  MENTEE_WEEK_HOURS,
  MONTH_LABELS,
  timeLabel,
} from "@/lib/calendar";
import { calendarDay } from "@/lib/utils";

export enum CalendarEntryKind {
  Mentorship = "mentorship",
  Program = "program",
  Deliverable = "deliverable",
}

export enum PrepStatus {
  Overdue = "overdue",
  InProgress = "in-progress",
}

export const PREP_STATUS_LABELS: Record<PrepStatus, string> = {
  [PrepStatus.Overdue]: "Gecikti",
  [PrepStatus.InProgress]: "Devam ediyor",
};

export const MENTEE_CALENDAR_FILTERS = [
  CalendarFilter.All,
  CalendarFilter.Mentorship,
  CalendarFilter.Program,
  CalendarFilter.Deliverable,
];

export const MENTEE_WEEK_DAY_COUNT = 5;
export const HOUR_ROW_HEIGHT = 42;
export const DAY_HEADER_HEIGHT = 34;
const MIN_EVENT_HEIGHT = 26;
// A deliverable has a due date but no time, so it sits at the end of the working day.
const DELIVERABLE_HOUR = 17;

const FILTER_KINDS: Partial<Record<CalendarFilter, CalendarEntryKind>> = {
  [CalendarFilter.Mentorship]: CalendarEntryKind.Mentorship,
  [CalendarFilter.Program]: CalendarEntryKind.Program,
  [CalendarFilter.Deliverable]: CalendarEntryKind.Deliverable,
};

const OPEN_STATUSES = new Set<string>([
  ActionItemStatus.Open,
  ActionItemStatus.InProgress,
]);

/** Anything with a due date the mentee has to hand in: a mentorship action item or a Süreç assignment. */
export type Deliverable = {
  id: string;
  title: string;
  dueDate?: string | null;
  status: ActionItemStatus;
};

export type CalendarEntry = {
  id: string;
  kind: CalendarEntryKind;
  gridLabel: string;
  title: string;
  detail: string;
  startsAt: Date;
  durationMinutes: number;
  meeting: MeetingItem | null;
};

export function isOpenDeliverable(item: Deliverable) {
  return OPEN_STATUSES.has(item.status);
}

export function meetingEntries(meetings: MeetingItem[]): CalendarEntry[] {
  return meetings
    .filter((meeting) => meeting.status !== MeetingStatus.Cancelled)
    .map((meeting) => ({
      id: `meeting:${meeting.id}`,
      kind: CalendarEntryKind.Mentorship,
      gridLabel: meeting.mentorName ?? meeting.agenda ?? "Görüşme",
      title: meeting.agenda ?? "Mentorluk görüşmesi",
      detail: meeting.mentorName
        ? `${meeting.mentorName} · mentorluk`
        : "mentorluk",
      startsAt: new Date(meeting.scheduledAt),
      durationMinutes: meeting.durationMinutes,
      meeting,
    }));
}

export function deliverableEntries(items: Deliverable[]): CalendarEntry[] {
  // Süreç assignments are action items too, so the same item can arrive from both sources.
  const byId = new Map<string, CalendarEntry>();
  for (const item of items) {
    if (!item.dueDate || !isOpenDeliverable(item) || byId.has(item.id)) {
      continue;
    }
    const startsAt = calendarDay(item.dueDate);
    startsAt.setHours(DELIVERABLE_HOUR, 0, 0, 0);
    byId.set(item.id, {
      id: `deliverable:${item.id}`,
      kind: CalendarEntryKind.Deliverable,
      gridLabel: "Teslim",
      title: item.title,
      detail: "Teslim tarihi",
      startsAt,
      durationMinutes: 0,
      meeting: null,
    });
  }
  return [...byId.values()];
}

export function filterEntries(
  entries: CalendarEntry[],
  filter: CalendarFilter,
) {
  if (filter === CalendarFilter.All) return entries;
  const kind = FILTER_KINDS[filter];
  return kind ? entries.filter((entry) => entry.kind === kind) : [];
}

function byStart(left: CalendarEntry, right: CalendarEntry) {
  return left.startsAt.getTime() - right.startsAt.getTime();
}

export function entriesOnDay(entries: CalendarEntry[], day: Date) {
  return entries
    .filter((entry) => entry.startsAt.toDateString() === day.toDateString())
    .sort(byStart);
}

/** Where an entry sits in its day column, or null when it falls outside 09:00–19:00. */
export function eventBox(entry: CalendarEntry) {
  const firstHour = MENTEE_WEEK_HOURS[0];
  const endHour = MENTEE_WEEK_HOURS[MENTEE_WEEK_HOURS.length - 1] + 1;
  const hours = entry.startsAt.getHours() + entry.startsAt.getMinutes() / 60;
  if (hours < firstHour || hours >= endHour) return null;
  const top = DAY_HEADER_HEIGHT + (hours - firstHour) * HOUR_ROW_HEIGHT;
  const bottom = DAY_HEADER_HEIGHT + (endHour - firstHour) * HOUR_ROW_HEIGHT;
  const height = Math.max(
    MIN_EVENT_HEIGHT,
    (entry.durationMinutes / 60) * HOUR_ROW_HEIGHT,
  );
  return { top, height: Math.min(height, bottom - top) };
}

/** "Bu hafta 2 mentorluk görüşmesi · 1 teslim" — program events only once there are some. */
export function weekSummary(entries: CalendarEntry[]) {
  const count = (kind: CalendarEntryKind) =>
    entries.filter((entry) => entry.kind === kind).length;
  const parts = [`${count(CalendarEntryKind.Mentorship)} mentorluk görüşmesi`];
  const programs = count(CalendarEntryKind.Program);
  if (programs > 0) parts.push(`${programs} program etkinliği`);
  parts.push(`${count(CalendarEntryKind.Deliverable)} teslim`);
  return `Bu hafta ${parts.join(" · ")}`;
}

export function upcomingEntries(
  entries: CalendarEntry[],
  now: Date,
  limit: number,
) {
  return entries
    .filter((entry) => entry.startsAt >= now)
    .sort(byStart)
    .slice(0, limit);
}

/** "Çar 28 · 10:00", or "Per 29" for a deliverable, which has no time. */
export function entryWhenLabel(entry: CalendarEntry) {
  const day = `${DAY_SHORT_LABELS[(entry.startsAt.getDay() + 6) % 7]} ${entry.startsAt.getDate()}`;
  return entry.kind === CalendarEntryKind.Deliverable
    ? day
    : `${day} · ${timeLabel(entry.startsAt.toISOString())}`;
}

export function prepStatus(item: Deliverable, now: Date) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return item.dueDate && calendarDay(item.dueDate) < today
    ? PrepStatus.Overdue
    : PrepStatus.InProgress;
}

/** "Cuma 28 Ağustos · Nihan Öztürk görüşmesi" */
export function prepHeading(meeting: MeetingItem) {
  const at = new Date(meeting.scheduledAt);
  const weekday = new Intl.DateTimeFormat("tr-TR", { weekday: "long" }).format(
    at,
  );
  const day = `${weekday} ${at.getDate()} ${MONTH_LABELS[at.getMonth()]}`;
  return meeting.mentorName ? `${day} · ${meeting.mentorName} görüşmesi` : day;
}
