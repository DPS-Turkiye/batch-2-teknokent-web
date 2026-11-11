import {
  ProgramEventKind,
  type MemberProgramEvent,
} from "@/interfaces/coordinator-program";
import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import {
  monthGridCells,
  shortWeekday,
  startOfWeek,
  weekDays,
} from "@/lib/calendar";
import { mobileClock, mobileLongDay, type MobileTexts } from "@/lib/mobile";
import { meetingTitle } from "@/lib/mobile-home";
import { relativeDayLabel } from "@/lib/utils";

export enum MobileAgendaKind {
  Meeting = "meeting",
  Event = "event",
  Deadline = "deadline",
}

export type MobileAgendaEntry = {
  id: string;
  kind: MobileAgendaKind;
  startsAt: Date;
  endsAt: Date;
  time: string;
  length: string;
  title: string;
  detail: string;
  meeting: MeetingItem | null;
  event: MemberProgramEvent | null;
  startup: { name: string; initials: string } | null;
  /** A time the mentor has been offered but not yet approved; not a booked meeting. */
  awaitingApproval?: boolean;
  /** The request whose chat answers it, for times that are not a meeting yet. */
  requestId?: string | undefined;
};

export type MobileCalendarDay = {
  date: Date;
  weekday: string;
  dayNumber: number;
  isToday: boolean;
  isSelected: boolean;
  isWeekend: boolean;
  kinds: MobileAgendaKind[];
};

export type MobileAgendaDay = {
  key: string;
  heading: string;
  isToday: boolean;
  entries: MobileAgendaEntry[];
};

/** The meeting link opens this long before the start, for both roles. */
export const JOIN_LEAD_MINUTES = 10;
const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;
const WEEK_LENGTH = 7;
const SATURDAY_INDEX = 5;

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function sameDay(left: Date, right: Date) {
  return startOfDay(left).getTime() === startOfDay(right).getTime();
}

function dayOffset(day: Date, today: Date) {
  return Math.round(
    (startOfDay(day).getTime() - startOfDay(today).getTime()) / DAY_MS,
  );
}

function meetingEntry(
  meeting: MeetingItem,
  { t, locale }: MobileTexts,
): MobileAgendaEntry {
  const startsAt = new Date(meeting.scheduledAt);
  const people = [
    meeting.mentorName ?? t("meeting.mentor"),
    meeting.organizationName ?? t("meeting.startup"),
  ].join(" ↔ ");
  return {
    id: `meeting:${meeting.id}`,
    kind: MobileAgendaKind.Meeting,
    startsAt,
    endsAt: new Date(startsAt.getTime() + meeting.durationMinutes * MINUTE_MS),
    time: mobileClock(startsAt, locale),
    length: t("calendar.minutes", { minutes: meeting.durationMinutes }),
    title: meetingTitle(meeting, t),
    detail: meeting.meetLink ? `${people} · ${t("meeting.online")}` : people,
    meeting,
    event: null,
    startup: null,
  };
}

function programEntry(
  event: MemberProgramEvent,
  { t, locale }: MobileTexts,
): MobileAgendaEntry {
  const startsAt = new Date(event.startsAt);
  if (event.kind === ProgramEventKind.Deadline) {
    return {
      id: `event:${event.id}`,
      kind: MobileAgendaKind.Deadline,
      startsAt,
      endsAt: startsAt,
      time: mobileClock(startsAt, locale),
      length: t("calendar.kinds.deadline"),
      title: event.title,
      detail: t("calendar.deadlineDetail", { program: event.programName }),
      meeting: null,
      event,
      startup: null,
    };
  }
  const endsAt = event.endsAt ? new Date(event.endsAt) : startsAt;
  const minutes = Math.round(
    (endsAt.getTime() - startsAt.getTime()) / MINUTE_MS,
  );
  const place = event.description?.split("\n")[0]?.trim();
  return {
    id: `event:${event.id}`,
    kind: MobileAgendaKind.Event,
    startsAt,
    endsAt,
    time: mobileClock(startsAt, locale),
    length: minutes > 0 ? t("calendar.minutes", { minutes }) : "",
    title: event.title,
    detail: place
      ? `${t("calendar.kinds.event")} · ${place}`
      : t("calendar.kinds.event"),
    meeting: null,
    event,
    startup: null,
  };
}

export function agendaEntries(
  meetings: MeetingItem[],
  events: MemberProgramEvent[],
  texts: MobileTexts,
) {
  return [
    ...meetings
      .filter((meeting) => meeting.status !== MeetingStatus.Cancelled)
      .map((meeting) => meetingEntry(meeting, texts)),
    ...events.map((event) => programEntry(event, texts)),
  ].sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime());
}

function kindsOn(entries: MobileAgendaEntry[], day: Date) {
  return [
    ...new Set(
      entries
        .filter((entry) => sameDay(entry.startsAt, day))
        .map((entry) => entry.kind),
    ),
  ];
}

export function weekStrip(
  selected: Date,
  entries: MobileAgendaEntry[],
  today: Date,
  locale: string,
): MobileCalendarDay[] {
  return weekDays(startOfWeek(selected), WEEK_LENGTH).map((date, index) => ({
    date,
    weekday: shortWeekday(date, locale),
    dayNumber: date.getDate(),
    isToday: sameDay(date, today),
    isSelected: sameDay(date, selected),
    isWeekend: index >= SATURDAY_INDEX,
    kinds: kindsOn(entries, date),
  }));
}

/** "Bugün · Çarşamba 23 Eylül", "Yarın · …", then just the day. */
export function dayHeading(day: Date, today: Date, texts: MobileTexts) {
  const offset = dayOffset(day, today);
  const long = mobileLongDay(day, texts);
  return offset === 0 || offset === 1
    ? `${relativeDayLabel(offset, texts.locale)} · ${long}`
    : long;
}

/** The selected day and the rest of its week, skipping days with nothing on them. */
export function agendaDays(
  selected: Date,
  entries: MobileAgendaEntry[],
  today: Date,
  texts: MobileTexts,
): MobileAgendaDay[] {
  const weekEnd = addDays(startOfWeek(selected), WEEK_LENGTH);
  const days: MobileAgendaDay[] = [];
  for (let day = startOfDay(selected); day < weekEnd; day = addDays(day, 1)) {
    const onDay = entries.filter((entry) => sameDay(entry.startsAt, day));
    if (onDay.length > 0) {
      days.push({
        key: day.toISOString(),
        heading: dayHeading(day, today, texts),
        isToday: sameDay(day, today),
        entries: onDay,
      });
    }
  }
  return days;
}

/** The first booked entry that has not finished yet. */
export function nextEntry(entries: MobileAgendaEntry[], now: Date) {
  return (
    entries.find((entry) => !entry.awaitingApproval && entry.endsAt > now) ??
    null
  );
}

/** "2 saat sonra", "15 dk sonra", "şimdi", then "yarın" or "3 gün sonra". */
export function startsInLabel(
  entry: MobileAgendaEntry,
  now: Date,
  t: MobileTexts["t"],
) {
  const minutes = Math.round(
    (entry.startsAt.getTime() - now.getTime()) / MINUTE_MS,
  );
  if (minutes <= 0) return t("calendar.startsIn.now");
  if (minutes < 60) return t("calendar.startsIn.minutes", { minutes });
  const days = dayOffset(entry.startsAt, now);
  if (days === 0) {
    return t("calendar.startsIn.hours", { hours: Math.round(minutes / 60) });
  }
  if (days === 1) return t("calendar.startsIn.tomorrow");
  return t("calendar.startsIn.days", { days });
}

export function nextEntryLabel(
  entry: MobileAgendaEntry,
  now: Date,
  t: MobileTexts["t"],
) {
  return t("calendar.nextLabel", { when: startsInLabel(entry, now, t) });
}

export function canJoin(entry: MobileAgendaEntry, now: Date) {
  return (
    Boolean(entry.meeting?.meetLink) &&
    now.getTime() >= entry.startsAt.getTime() - JOIN_LEAD_MINUTES * MINUTE_MS &&
    now < entry.endsAt
  );
}

/** "Perşembe 24 Eylül · 14:00–15:00" */
export function entryTimeLine(entry: MobileAgendaEntry, texts: MobileTexts) {
  const { locale } = texts;
  const range =
    entry.endsAt > entry.startsAt
      ? `${mobileClock(entry.startsAt, locale)}–${mobileClock(entry.endsAt, locale)}`
      : mobileClock(entry.startsAt, locale);
  return `${mobileLongDay(entry.startsAt, texts)} · ${range}`;
}

/** "60 dk · yarın" */
export function entryTimeHint(
  entry: MobileAgendaEntry,
  today: Date,
  t: MobileTexts["t"],
) {
  const offset = dayOffset(entry.startsAt, today);
  const when =
    offset === 0
      ? t("calendar.when.today")
      : offset === 1
        ? t("calendar.when.tomorrow")
        : offset < 0
          ? t("calendar.when.past")
          : t("calendar.startsIn.days", { days: offset });
  return entry.length ? `${entry.length} · ${when}` : when;
}

/** "Google Meet" for a Meet link, otherwise the link's host. */
export function meetingLinkLabel(link: string, t: MobileTexts["t"]) {
  try {
    const host = new URL(link).hostname.replace(/^www\./, "");
    return host === "meet.google.com" ? "Google Meet" : host;
  } catch {
    return t("meeting.linkFallback");
  }
}

export function meetingLinkText(link: string) {
  return link.replace(/^https?:\/\//, "");
}

export type MobileMonthCell = {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  kinds: MobileAgendaKind[];
};

export function monthCells(
  month: Date,
  entries: MobileAgendaEntry[],
  selected: Date,
  today: Date,
): MobileMonthCell[] {
  return monthGridCells(month).map((cell) => ({
    date: cell.date,
    inMonth: cell.inCurrentMonth,
    isToday: sameDay(cell.date, today),
    isSelected: sameDay(cell.date, selected),
    kinds: kindsOn(entries, cell.date),
  }));
}

/** The weeks around a month, so the strip and the month grid both have their events. */
export function eventRangeFor(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const next = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  return {
    from: addDays(first, -WEEK_LENGTH),
    to: addDays(next, WEEK_LENGTH),
  };
}

export function shiftMonth(month: Date, by: number) {
  return new Date(month.getFullYear(), month.getMonth() + by, 1);
}
