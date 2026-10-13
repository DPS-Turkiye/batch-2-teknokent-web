/** Shared Turkish calendar labels and date helpers used by the calendar views. */

export enum CalendarFilter {
  All = "all",
  Mentorship = "mentorship",
  Program = "program",
  Availability = "availability",
  Deliverable = "deliverable",
}

export const CALENDAR_FILTER_LABELS: Record<CalendarFilter, string> = {
  [CalendarFilter.All]: "Tümü",
  [CalendarFilter.Mentorship]: "Mentorluk",
  [CalendarFilter.Program]: "Program",
  [CalendarFilter.Availability]: "Müsaitlik",
  [CalendarFilter.Deliverable]: "Teslim",
};

export const MENTOR_CALENDAR_FILTERS = [
  CalendarFilter.All,
  CalendarFilter.Mentorship,
  CalendarFilter.Program,
  CalendarFilter.Availability,
];

export const MENTEE_CALENDAR_FILTERS = [
  CalendarFilter.All,
  CalendarFilter.Mentorship,
  CalendarFilter.Program,
  CalendarFilter.Deliverable,
];

export const DAY_SHORT_LABELS = [
  "Pzt",
  "Sal",
  "Çar",
  "Per",
  "Cum",
  "Cmt",
  "Paz",
] as const;

/** Monday–Friday, for the mentor week grid. */
export const WEEKDAY_SHORT_LABELS = DAY_SHORT_LABELS.slice(0, 5);

export const MONTH_LABELS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
] as const;

export function hourOf(iso: string) {
  return new Date(iso).getHours();
}

export function timeLabel(iso: string, locale = "tr") {
  return new Date(iso).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "Pzt" / "Mon" */
export function shortWeekday(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date);
}

export function isSameDay(iso: string, day: Date) {
  return new Date(iso).toDateString() === day.toDateString();
}

/** "31–4 Eylül" — the month comes from the last day so a spanning week reads correctly. */
export function weekRangeLabel(start: Date, end: Date) {
  return `${start.getDate()}–${end.getDate()} ${MONTH_LABELS[end.getMonth()]}`;
}

/** The mentee week grid runs 09:00–18:00, Monday to Friday. */
export const MENTEE_WEEK_HOURS = Array.from({ length: 10 }, (_, i) => 9 + i);

export function startOfWeek(date: Date) {
  const copy = new Date(date);
  // getDay() is Sunday-based; the grid starts on Monday.
  const offset = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - offset);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function weekDays(weekStart: Date, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + index);
    return day;
  });
}

export type MonthCell = { date: Date; inCurrentMonth: boolean };

/** A 7-wide grid of the month's days, padded with the trailing days of the
 * previous month so the first cell always falls on a Monday. */
export function monthGridCells(monthDate: Date): MonthCell[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;

  const cells: MonthCell[] = [];
  for (let i = leadingBlanks; i > 0; i -= 1) {
    const date = new Date(year, month, 1 - i);
    cells.push({ date, inCurrentMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ date: new Date(year, month, day), inCurrentMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    const date = new Date(last);
    date.setDate(date.getDate() + 1);
    cells.push({ date, inCurrentMonth: false });
  }
  return cells;
}

export function monthLabel(date: Date) {
  return `${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`;
}

export const MEETING_PICKER_HOURS = Array.from({ length: 10 }, (_, i) => 9 + i);
export const MEETING_PICKER_DAY_COUNT = 5;

export type MeetingPickerColumn = {
  key: string;
  heading: string;
  slots: Date[];
};

function dayHeading(day: Date) {
  return `${day.getDate()} ${DAY_SHORT_LABELS[(day.getDay() + 6) % 7]}`;
}

/** Next few days, 09:00–18:00, including hours the mentor is not marked free. */
export function upcomingHourColumns(
  now = new Date(),
  dayCount = MEETING_PICKER_DAY_COUNT,
  hours = MEETING_PICKER_HOURS,
): MeetingPickerColumn[] {
  const columns: MeetingPickerColumn[] = [];
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  for (let offset = 0; columns.length < dayCount && offset < 14; offset += 1) {
    const day = new Date(cursor);
    day.setDate(cursor.getDate() + offset);
    const slots = hours
      .map((hour) => {
        const at = new Date(day);
        at.setHours(hour, 0, 0, 0);
        return at;
      })
      .filter((at) => at.getTime() > now.getTime());
    if (slots.length === 0) continue;
    columns.push({
      key: day.toDateString(),
      heading: dayHeading(day),
      slots,
    });
  }
  return columns;
}
