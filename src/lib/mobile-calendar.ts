import {
  ProgramEventKind,
  type MemberProgramEvent,
} from "@/interfaces/coordinator-program";
import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import {
  DAY_SHORT_LABELS,
  monthGridCells,
  startOfWeek,
  weekDays,
} from "@/lib/calendar";
import { meetingTitle } from "@/lib/mobile-home";

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

const time = new Intl.DateTimeFormat("tr-TR", {
  hour: "2-digit",
  minute: "2-digit",
});
const weekday = new Intl.DateTimeFormat("tr-TR", { weekday: "long" });
const dayMonth = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
});

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

/** "Perşembe 24 Eylül" */
export function longDay(date: Date) {
  return `${weekday.format(date)} ${dayMonth.format(date)}`;
}

function meetingEntry(meeting: MeetingItem): MobileAgendaEntry {
  const startsAt = new Date(meeting.scheduledAt);
  const people = [
    meeting.mentorName ?? "Mentör",
    meeting.organizationName ?? "Startup",
  ].join(" ↔ ");
  return {
    id: `meeting:${meeting.id}`,
    kind: MobileAgendaKind.Meeting,
    startsAt,
    endsAt: new Date(startsAt.getTime() + meeting.durationMinutes * MINUTE_MS),
    time: time.format(startsAt),
    length: `${meeting.durationMinutes} dk`,
    title: meetingTitle(meeting),
    detail: meeting.meetLink ? `${people} · Online` : people,
    meeting,
    event: null,
    startup: null,
  };
}

function programEntry(event: MemberProgramEvent): MobileAgendaEntry {
  const startsAt = new Date(event.startsAt);
  if (event.kind === ProgramEventKind.Deadline) {
    return {
      id: `event:${event.id}`,
      kind: MobileAgendaKind.Deadline,
      startsAt,
      endsAt: startsAt,
      time: time.format(startsAt),
      length: "Son tarih",
      title: event.title,
      detail: `${event.programName} · son tarih`,
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
    time: time.format(startsAt),
    length: minutes > 0 ? `${minutes} dk` : "",
    title: event.title,
    detail: place ? `Program etkinliği · ${place}` : "Program etkinliği",
    meeting: null,
    event,
    startup: null,
  };
}

export function agendaEntries(
  meetings: MeetingItem[],
  events: MemberProgramEvent[],
) {
  return [
    ...meetings
      .filter(
        (meeting) =>
          String(meeting.status).toUpperCase() !== MeetingStatus.Cancelled,
      )
      .map(meetingEntry),
    ...events.map(programEntry),
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
): MobileCalendarDay[] {
  return weekDays(startOfWeek(selected), WEEK_LENGTH).map((date, index) => ({
    date,
    weekday: DAY_SHORT_LABELS[index],
    dayNumber: date.getDate(),
    isToday: sameDay(date, today),
    isSelected: sameDay(date, selected),
    isWeekend: index >= SATURDAY_INDEX,
    kinds: kindsOn(entries, date),
  }));
}

/** "Bugün · Çarşamba 23 Eylül", "Yarın · …", then just the day. */
export function dayHeading(day: Date, today: Date) {
  const offset = dayOffset(day, today);
  if (offset === 0) return `Bugün · ${longDay(day)}`;
  if (offset === 1) return `Yarın · ${longDay(day)}`;
  return longDay(day);
}

/** The selected day and the rest of its week, skipping days with nothing on them. */
export function agendaDays(
  selected: Date,
  entries: MobileAgendaEntry[],
  today: Date,
): MobileAgendaDay[] {
  const weekEnd = addDays(startOfWeek(selected), WEEK_LENGTH);
  const days: MobileAgendaDay[] = [];
  for (let day = startOfDay(selected); day < weekEnd; day = addDays(day, 1)) {
    const onDay = entries.filter((entry) => sameDay(entry.startsAt, day));
    if (onDay.length > 0) {
      days.push({
        key: day.toISOString(),
        heading: dayHeading(day, today),
        isToday: sameDay(day, today),
        entries: onDay,
      });
    }
  }
  return days;
}

/** The first entry that has not finished yet. */
export function nextEntry(entries: MobileAgendaEntry[], now: Date) {
  return entries.find((entry) => entry.endsAt > now) ?? null;
}

/** "2 saat sonra", "15 dk sonra", "şimdi", then "yarın" or "3 gün sonra". */
export function startsInLabel(entry: MobileAgendaEntry, now: Date) {
  const minutes = Math.round(
    (entry.startsAt.getTime() - now.getTime()) / MINUTE_MS,
  );
  if (minutes <= 0) return "şimdi";
  if (minutes < 60) return `${minutes} dk sonra`;
  const days = dayOffset(entry.startsAt, now);
  if (days === 0) return `${Math.round(minutes / 60)} saat sonra`;
  if (days === 1) return "yarın";
  return `${days} gün sonra`;
}

export function nextEntryLabel(entry: MobileAgendaEntry, now: Date) {
  return `Sıradaki · ${startsInLabel(entry, now)}`;
}

export function canJoin(entry: MobileAgendaEntry, now: Date) {
  return (
    Boolean(entry.meeting?.meetLink) &&
    now.getTime() >= entry.startsAt.getTime() - JOIN_LEAD_MINUTES * MINUTE_MS &&
    now < entry.endsAt
  );
}

/** "Perşembe 24 Eylül · 14:00–15:00" */
export function entryTimeLine(entry: MobileAgendaEntry) {
  const range =
    entry.endsAt > entry.startsAt
      ? `${time.format(entry.startsAt)}–${time.format(entry.endsAt)}`
      : time.format(entry.startsAt);
  return `${longDay(entry.startsAt)} · ${range}`;
}

/** "60 dk · yarın" */
export function entryTimeHint(entry: MobileAgendaEntry, today: Date) {
  const offset = dayOffset(entry.startsAt, today);
  const when =
    offset === 0
      ? "bugün"
      : offset === 1
        ? "yarın"
        : offset < 0
          ? "geçti"
          : `${offset} gün sonra`;
  return entry.length ? `${entry.length} · ${when}` : when;
}

export const ENTRY_KIND_LABELS: Record<MobileAgendaKind, string> = {
  [MobileAgendaKind.Meeting]: "Mentorluk görüşmesi",
  [MobileAgendaKind.Event]: "Program etkinliği",
  [MobileAgendaKind.Deadline]: "Son tarih",
};

/** "Google Meet" for a Meet link, otherwise the link's host. */
export function meetingLinkLabel(link: string) {
  try {
    const host = new URL(link).hostname.replace(/^www\./, "");
    return host === "meet.google.com" ? "Google Meet" : host;
  } catch {
    return "Toplantı bağlantısı";
  }
}

export function meetingLinkText(link: string) {
  return link.replace(/^https?:\/\//, "");
}

export const MONTH_WEEKDAY_LABELS = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];

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
