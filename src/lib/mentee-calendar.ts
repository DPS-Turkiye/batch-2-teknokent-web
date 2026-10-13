import type { useTranslations } from "next-intl";

import { ActionItemStatus } from "@/interfaces/action-item";
import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import {
  CalendarFilter,
  MENTEE_WEEK_HOURS,
  shortWeekday,
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

/** The calendar's translator and language, for the labels built here. */
export type CalendarTexts = {
  t: ReturnType<typeof useTranslations<"calendar">>;
  locale: string;
};

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

export function meetingEntries(
  meetings: MeetingItem[],
  { t }: CalendarTexts,
): CalendarEntry[] {
  return meetings
    .filter((meeting) => meeting.status !== MeetingStatus.Cancelled)
    .map((meeting) => ({
      id: `meeting:${meeting.id}`,
      kind: CalendarEntryKind.Mentorship,
      gridLabel: meeting.mentorName ?? meeting.agenda ?? t("meetingFallback"),
      title: meeting.agenda ?? t("meetingTitleFallback"),
      detail: meeting.mentorName
        ? t("mentorshipDetail", { mentor: meeting.mentorName })
        : t("mentorshipOnly"),
      startsAt: new Date(meeting.scheduledAt),
      durationMinutes: meeting.durationMinutes,
      meeting,
    }));
}

export function deliverableEntries(
  items: Deliverable[],
  { t }: CalendarTexts,
): CalendarEntry[] {
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
      gridLabel: t("deliverable"),
      title: item.title,
      detail: t("deliverableDetail"),
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

/**
 * Where an entry sits in its day column. Outside working hours it is pinned to
 * the nearest edge rather than dropped, so nothing the summary counts goes missing.
 */
export function eventBox(entry: CalendarEntry) {
  const firstHour = MENTEE_WEEK_HOURS[0];
  const endHour = MENTEE_WEEK_HOURS[MENTEE_WEEK_HOURS.length - 1] + 1;
  const gridBottom =
    DAY_HEADER_HEIGHT + (endHour - firstHour) * HOUR_ROW_HEIGHT;
  const hours = entry.startsAt.getHours() + entry.startsAt.getMinutes() / 60;
  const top = Math.min(
    Math.max(
      DAY_HEADER_HEIGHT + (hours - firstHour) * HOUR_ROW_HEIGHT,
      DAY_HEADER_HEIGHT,
    ),
    gridBottom - MIN_EVENT_HEIGHT,
  );
  const height = Math.max(
    MIN_EVENT_HEIGHT,
    (entry.durationMinutes / 60) * HOUR_ROW_HEIGHT,
  );
  return { top, height: Math.min(height, gridBottom - top) };
}

export type PositionedEntry = {
  entry: CalendarEntry;
  top: number;
  height: number;
  lane: number;
  lanes: number;
};

/** A day's entries with their boxes, sharing the column width wherever they overlap. */
export function layoutDay(entries: CalendarEntry[]): PositionedEntry[] {
  const placed = entries
    .map((entry) => ({ entry, ...eventBox(entry), lane: 0, lanes: 1 }))
    .sort((left, right) => left.top - right.top);
  let cluster: PositionedEntry[] = [];
  let clusterBottom = -Infinity;
  let laneBottoms: number[] = [];
  const closeCluster = () => {
    for (const item of cluster) item.lanes = laneBottoms.length;
  };
  for (const item of placed) {
    if (item.top >= clusterBottom) {
      closeCluster();
      cluster = [];
      laneBottoms = [];
      clusterBottom = -Infinity;
    }
    let lane = laneBottoms.findIndex((bottom) => bottom <= item.top);
    if (lane === -1) {
      lane = laneBottoms.length;
      laneBottoms.push(0);
    }
    laneBottoms[lane] = item.top + item.height;
    item.lane = lane;
    cluster.push(item);
    clusterBottom = Math.max(clusterBottom, item.top + item.height);
  }
  closeCluster();
  return placed;
}

/** "Bu hafta 2 mentorluk görüşmesi · 1 teslim" — program events only once there are some. */
export function weekSummary(entries: CalendarEntry[], { t }: CalendarTexts) {
  const count = (kind: CalendarEntryKind) =>
    entries.filter((entry) => entry.kind === kind).length;
  const parts = [
    t("mentorships", { count: count(CalendarEntryKind.Mentorship) }),
  ];
  const programs = count(CalendarEntryKind.Program);
  if (programs > 0) parts.push(t("programs", { count: programs }));
  parts.push(
    t("deliverables", { count: count(CalendarEntryKind.Deliverable) }),
  );
  return t("summary", { parts: parts.join(" · ") });
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
export function entryWhenLabel(entry: CalendarEntry, locale: string) {
  const day = `${shortWeekday(entry.startsAt, locale)} ${entry.startsAt.getDate()}`;
  return entry.kind === CalendarEntryKind.Deliverable
    ? day
    : `${day} · ${timeLabel(entry.startsAt.toISOString(), locale)}`;
}

export function prepStatus(item: Deliverable, now: Date) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return item.dueDate && calendarDay(item.dueDate) < today
    ? PrepStatus.Overdue
    : PrepStatus.InProgress;
}

/** "Cuma 28 Ağustos · Nihan Öztürk görüşmesi" */
export function prepHeading(
  meeting: MeetingItem,
  { t, locale }: CalendarTexts,
) {
  const day = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(meeting.scheduledAt));
  return meeting.mentorName
    ? t("prep.heading", { day, mentor: meeting.mentorName })
    : day;
}
