import type {
  AcademicianAppointment,
  AcademicianAvailability,
  OfficeHoursOneOff,
  OfficeHoursRequest,
} from "@/interfaces/academician-office-hours";
import {
  AppointmentStatus,
  type AppointmentTime,
} from "@/interfaces/appointment";
import type {
  MentorAvailabilityException,
  MentorAvailabilityRule,
  Weekday,
} from "@/interfaces/mentor";
import { isDayOff } from "@/lib/academician-availability";
import {
  turkeyWallClock,
  waitsForAcademician,
} from "@/lib/academician-office-hours";
import {
  monthGridCells,
  monthLabel,
  placeInLanes,
  type GridHours,
  type Placed,
} from "@/lib/calendar";
import { addDays, isoDay, startOfWeek } from "@/lib/coordinator-calendar";
import { isEnumValue } from "@/lib/enum";
import { formatDateRange } from "@/lib/format";
import { weekdayOf } from "@/lib/mentor-availability";
import { minutesOfDay } from "@/lib/utils";
import {
  AppointmentsCalendarView,
  AppointmentsFilter,
  CalendarEntryKind,
  RequestFit,
} from "@/types/academician-calendar";

/** Cancelling closer than this to the start needs a reason for the student. */
export const LATE_CANCEL_MS = 24 * 60 * 60 * 1000;

const HOUR_MS = 60 * 60 * 1000;

/** The design's grid runs 09:00–18:00; it grows only when something falls outside. */
const DEFAULT_GRID = { startHour: 9, endHour: 18 };

/* ---------------------------------------------------------------- URL state */

/** What Randevularım shows, kept in the URL so a link, Back and a reload land on the same view. */
export type AppointmentsSearch = {
  view: AppointmentsCalendarView;
  /** The day the view is anchored on ("YYYY-MM-DD"); null means today. */
  date: string | null;
  filter: AppointmentsFilter;
  /** The request whose drawer is open. */
  request: string | null;
  /** The appointment whose drawer is open. */
  appointment: string | null;
};

export const DEFAULT_APPOINTMENTS_SEARCH: AppointmentsSearch = {
  view: AppointmentsCalendarView.Week,
  date: null,
  filter: AppointmentsFilter.All,
  request: null,
  appointment: null,
};

type RawSearch = Record<string, string | string[] | undefined>;

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** A real calendar day as "YYYY-MM-DD", or null for anything else (the URL is untrusted). */
function validDay(value: string | undefined) {
  if (value === undefined || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year = 0, month = 0, day = 0] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return isoDay(date) === value ? value : null;
}

function idOrNull(value: string | undefined) {
  return value === undefined || value === "" ? null : value;
}

/** Reads the search params once, at the boundary; unknown values fall back to the defaults. */
export function parseAppointmentsSearch(raw: RawSearch): AppointmentsSearch {
  const view = single(raw.view);
  const filter = single(raw.filter);
  return {
    view: isEnumValue(AppointmentsCalendarView, view)
      ? view
      : DEFAULT_APPOINTMENTS_SEARCH.view,
    date: validDay(single(raw.date)),
    filter: isEnumValue(AppointmentsFilter, filter)
      ? filter
      : DEFAULT_APPOINTMENTS_SEARCH.filter,
    request: idOrNull(single(raw.request)),
    appointment: idOrNull(single(raw.appointment)),
  };
}

/** A link into Randevularım; defaults are left out so the plain page stays "/academician/appointments". */
export function appointmentsHref(
  base: string,
  search: Partial<AppointmentsSearch>,
) {
  const params = new URLSearchParams();
  const full = { ...DEFAULT_APPOINTMENTS_SEARCH, ...search };
  if (full.view !== DEFAULT_APPOINTMENTS_SEARCH.view) {
    params.set("view", full.view);
  }
  if (full.date !== null) params.set("date", full.date);
  if (full.filter !== DEFAULT_APPOINTMENTS_SEARCH.filter) {
    params.set("filter", full.filter);
  }
  if (full.request !== null) params.set("request", full.request);
  if (full.appointment !== null) params.set("appointment", full.appointment);
  const query = params.toString();
  return query === "" ? base : `${base}?${query}`;
}

/** The anchor day of a view: the date in the URL, or today in Turkey. */
export function anchorDay(date: string | null, now: Date) {
  if (date === null) {
    const today = turkeyWallClock(now);
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }
  const [year = 0, month = 0, day = 0] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/* ------------------------------------------------------------------ entries */

export type CalendarSpan = { start: Date; end: Date };

type Timed = { key: string; day: string; span: CalendarSpan };

export type ConfirmedEntry = Timed & {
  kind: CalendarEntryKind.Confirmed;
  appointment: AcademicianAppointment;
};

export type RequestEntry = Timed & {
  kind: CalendarEntryKind.PendingRequest | CalendarEntryKind.AwaitingStudent;
  request: OfficeHoursRequest;
  /** The first time waiting for the academician; the product tour points at it. */
  tourAnchor: boolean;
};

export type RecurringEntry = Timed & {
  kind: CalendarEntryKind.Recurring;
  rule: MentorAvailabilityRule;
};

export type OneOffEntry = Timed & {
  kind: CalendarEntryKind.OneOff;
  oneOff: OfficeHoursOneOff;
};

export type UnavailableEntry = {
  kind: CalendarEntryKind.Unavailable;
  key: string;
  day: string;
  exception: MentorAvailabilityException;
};

export type TimedEntry =
  ConfirmedEntry | RequestEntry | RecurringEntry | OneOffEntry;

export type CalendarEntry = TimedEntry | UnavailableEntry;

export type CalendarSource = {
  requests: OfficeHoursRequest[];
  appointments: AcademicianAppointment[];
  availability: AcademicianAvailability;
};

/** Spans are on Turkey's wall clock (see turkeyWallClock), like everything the grid draws. */
function spanOf(time: AppointmentTime): CalendarSpan {
  return {
    start: turkeyWallClock(time.startsAt),
    end: turkeyWallClock(time.endsAt),
  };
}

/** An "HH:mm" time on a wall-clock day; the Date constructor carries minutes past 59 into the hours. */
function atTime(day: Date, time: string) {
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    0,
    minutesOfDay(time),
  );
}

/** The times a request is about right now and whose move it is; none once it is settled. */
function openTimes(request: OfficeHoursRequest): {
  kind: RequestEntry["kind"];
  times: AppointmentTime[];
} {
  if (waitsForAcademician(request)) {
    return {
      kind: CalendarEntryKind.PendingRequest,
      times: request.requestedTimes,
    };
  }
  if (request.status === AppointmentStatus.AlternativeProposed) {
    return {
      kind: CalendarEntryKind.AwaitingStudent,
      times: request.proposedTimes,
    };
  }
  if (request.awaitingStudentReply) {
    return {
      kind: CalendarEntryKind.AwaitingStudent,
      times: request.requestedTimes,
    };
  }
  return { kind: CalendarEntryKind.AwaitingStudent, times: [] };
}

function requestEntries(
  request: OfficeHoursRequest,
  days: ReadonlySet<string>,
): RequestEntry[] {
  const { kind, times } = openTimes(request);
  return times.flatMap((time) => {
    const span = spanOf(time);
    const day = isoDay(span.start);
    if (!days.has(day)) return [];
    return [
      {
        kind,
        key: `${request.id}@${time.startsAt}`,
        day,
        span,
        request,
        tourAnchor: false,
      },
    ];
  });
}

/**
 * Everything the calendar draws for `days`: weekly ranges expanded per day, one-offs, booked appointments and the
 * times requests are about. A day off yields one Unavailable entry and hides that day's hours, because a day off
 * always wins over them; appointments and requests on it still show, so a clash is visible.
 */
export function calendarEntries(
  source: CalendarSource,
  days: readonly Date[],
): CalendarEntry[] {
  const { availability } = source;
  const dayKeys = new Set(days.map(isoDay));
  const entries: CalendarEntry[] = [];

  for (const date of days) {
    const day = isoDay(date);
    const dayOff = availability.exceptions.find(
      (exception) => exception.startsOn <= day && day <= exception.endsOn,
    );
    if (dayOff) {
      entries.push({
        kind: CalendarEntryKind.Unavailable,
        key: `off@${day}`,
        day,
        exception: dayOff,
      });
      continue;
    }
    const weekday = weekdayOf(date);
    for (const rule of availability.rules) {
      if (rule.dayOfWeek !== weekday) continue;
      entries.push({
        kind: CalendarEntryKind.Recurring,
        key: `${rule.id}@${day}`,
        day,
        span: {
          start: atTime(date, rule.startTime),
          end: atTime(date, rule.endTime),
        },
        rule,
      });
    }
  }

  for (const oneOff of availability.oneOffs) {
    const span = spanOf(oneOff);
    const day = isoDay(span.start);
    if (!dayKeys.has(day) || isDayOff(day, availability.exceptions)) continue;
    entries.push({
      kind: CalendarEntryKind.OneOff,
      key: `${oneOff.id ?? oneOff.startsAt}@${day}`,
      day,
      span,
      oneOff,
    });
  }

  for (const appointment of source.appointments) {
    if (appointment.status !== AppointmentStatus.Confirmed) continue;
    const span = spanOf(appointment);
    const day = isoDay(span.start);
    if (!dayKeys.has(day)) continue;
    entries.push({
      kind: CalendarEntryKind.Confirmed,
      key: appointment.id,
      day,
      span,
      appointment,
    });
  }

  const requests = source.requests.flatMap((request) =>
    requestEntries(request, dayKeys),
  );
  const anchor = requests
    .filter((entry) => entry.kind === CalendarEntryKind.PendingRequest)
    .toSorted((a, b) => a.span.start.getTime() - b.span.start.getTime())[0];
  for (const entry of requests) {
    entries.push(entry === anchor ? { ...entry, tourAnchor: true } : entry);
  }
  return entries;
}

const FILTER_KINDS: Record<
  AppointmentsFilter,
  ReadonlySet<CalendarEntryKind>
> = {
  [AppointmentsFilter.All]: new Set(Object.values(CalendarEntryKind)),
  [AppointmentsFilter.Appointments]: new Set([CalendarEntryKind.Confirmed]),
  [AppointmentsFilter.Requests]: new Set([
    CalendarEntryKind.PendingRequest,
    CalendarEntryKind.AwaitingStudent,
  ]),
  [AppointmentsFilter.Availability]: new Set([
    CalendarEntryKind.Recurring,
    CalendarEntryKind.OneOff,
    CalendarEntryKind.Unavailable,
  ]),
};

export function filterEntries(
  entries: readonly CalendarEntry[],
  filter: AppointmentsFilter,
) {
  return entries.filter((entry) => FILTER_KINDS[filter].has(entry.kind));
}

/** Appointments and requests get lanes and can be opened; availability sits behind them. */
const FOREGROUND = new Set([
  CalendarEntryKind.Confirmed,
  CalendarEntryKind.PendingRequest,
  CalendarEntryKind.AwaitingStudent,
]);

export function isForeground(
  entry: TimedEntry,
): entry is ConfirmedEntry | RequestEntry {
  return FOREGROUND.has(entry.kind);
}

/* --------------------------------------------------------------------- grid */

/** The days a view covers before the week drops an empty weekend. */
export function calendarDays(view: AppointmentsCalendarView, anchor: Date) {
  switch (view) {
    case AppointmentsCalendarView.Day:
      return [anchor];
    case AppointmentsCalendarView.Week: {
      const monday = startOfWeek(anchor);
      return Array.from({ length: 7 }, (_, offset) => addDays(monday, offset));
    }
    case AppointmentsCalendarView.Month:
      return monthGridCells(anchor).map((cell) => cell.date);
  }
}

/** The week view is Monday to Friday, like the design, unless something falls on the weekend. */
export function weekColumns(
  days: readonly Date[],
  entries: readonly CalendarEntry[],
) {
  const used = new Set(entries.map((entry) => entry.day));
  return days.filter((date) => {
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    return !weekend || used.has(isoDay(date));
  });
}

function hourOf(date: Date) {
  return date.getHours() + date.getMinutes() / 60;
}

/** 09:00–18:00, widened to whole hours when an entry starts earlier or ends later, so nothing is cut off. */
export function gridHours(entries: readonly CalendarEntry[]): GridHours {
  let { startHour, endHour } = DEFAULT_GRID;
  for (const entry of entries) {
    if (entry.kind === CalendarEntryKind.Unavailable) continue;
    startHour = Math.min(startHour, Math.floor(hourOf(entry.span.start)));
    const endsNextDay = isoDay(entry.span.end) !== entry.day;
    endHour = Math.max(
      endHour,
      endsNextDay ? 24 : Math.ceil(hourOf(entry.span.end)),
    );
  }
  return { startHour, hours: endHour - startHour };
}

export type DayColumn = {
  day: Date;
  key: string;
  foreground: Placed<ConfirmedEntry | RequestEntry>[];
  background: Placed<RecurringEntry | OneOffEntry>[];
  unavailable: UnavailableEntry | null;
};

function hoursSpan(entry: TimedEntry) {
  return {
    start: entry.span.start,
    hours: (entry.span.end.getTime() - entry.span.start.getTime()) / HOUR_MS,
  };
}

/** Each day's blocks placed on the grid: openable ones in lanes, availability bands behind them. */
export function dayColumns(
  days: readonly Date[],
  entries: readonly CalendarEntry[],
  grid: GridHours,
): DayColumn[] {
  return days.map((day) => {
    const key = isoDay(day);
    const own = entries.filter((entry) => entry.day === key);
    const timed = own.filter(
      (entry): entry is TimedEntry =>
        entry.kind !== CalendarEntryKind.Unavailable,
    );
    return {
      day,
      key,
      foreground: placeInLanes(timed.filter(isForeground), hoursSpan, grid),
      background: placeInLanes(
        timed.filter(
          (entry): entry is RecurringEntry | OneOffEntry =>
            !isForeground(entry),
        ),
        hoursSpan,
        grid,
      ),
      unavailable:
        own.find(
          (entry): entry is UnavailableEntry =>
            entry.kind === CalendarEntryKind.Unavailable,
        ) ?? null,
    };
  });
}

export type MonthCellModel = {
  day: Date;
  key: string;
  inMonth: boolean;
  unavailable: UnavailableEntry | null;
  chips: TimedEntry[];
  /** Entries left out of a crowded cell ("+2"). */
  overflow: number;
};

/** The month grid's cells, each with its first few entries in time order. */
export function monthCells(
  anchor: Date,
  entries: readonly CalendarEntry[],
  limit = 3,
): MonthCellModel[] {
  return monthGridCells(anchor).map((cell) => {
    const key = isoDay(cell.date);
    const own = entries.filter((entry) => entry.day === key);
    const timed = own
      .filter(
        (entry): entry is TimedEntry =>
          entry.kind !== CalendarEntryKind.Unavailable,
      )
      .toSorted((a, b) => a.span.start.getTime() - b.span.start.getTime());
    return {
      day: cell.date,
      key,
      inMonth: cell.inCurrentMonth,
      unavailable:
        own.find(
          (entry): entry is UnavailableEntry =>
            entry.kind === CalendarEntryKind.Unavailable,
        ) ?? null,
      chips: timed.slice(0, limit),
      overflow: Math.max(timed.length - limit, 0),
    };
  });
}

/** Where the red "now" line crosses `day`'s column, in hours from the grid top; null on other days. */
export function nowOffset(now: Date, day: Date, grid: GridHours) {
  const wall = turkeyWallClock(now);
  if (isoDay(wall) !== isoDay(day)) return null;
  const offset = hourOf(wall) - grid.startHour;
  return offset < 0 || offset > grid.hours ? null : offset;
}

/** The anchor one step back or ahead: a day, a week or a month (on its first day). */
export function shiftAnchor(
  view: AppointmentsCalendarView,
  anchor: Date,
  step: number,
) {
  switch (view) {
    case AppointmentsCalendarView.Day:
      return addDays(anchor, step);
    case AppointmentsCalendarView.Week:
      return addDays(anchor, step * 7);
    case AppointmentsCalendarView.Month:
      return new Date(anchor.getFullYear(), anchor.getMonth() + step, 1);
  }
}

/** "17 Kasım 2026, Salı", "16 – 20 Kasım 2026" or "Kasım 2026". */
export function calendarTitle(
  view: AppointmentsCalendarView,
  anchor: Date,
  columns: readonly Date[],
  locale: string,
) {
  const dayMonthYear = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  switch (view) {
    case AppointmentsCalendarView.Day: {
      const weekday = new Intl.DateTimeFormat(locale, {
        weekday: "long",
      }).format(anchor);
      return `${dayMonthYear.format(anchor)}, ${weekday}`;
    }
    case AppointmentsCalendarView.Week: {
      const first = columns[0] ?? anchor;
      const last = columns.at(-1) ?? anchor;
      return formatDateRange(dayMonthYear, first, last);
    }
    case AppointmentsCalendarView.Month:
      return monthLabel(anchor, locale);
  }
}

/* ------------------------------------------------------------ requests, rail */

/** Requests waiting for the academician, the soonest requested time first. */
export function pendingRequests(requests: readonly OfficeHoursRequest[]) {
  return requests
    .filter(waitsForAcademician)
    .toSorted(
      (a, b) =>
        Date.parse(a.requestedTimes[0]?.startsAt ?? a.requestedAt) -
        Date.parse(b.requestedTimes[0]?.startsAt ?? b.requestedAt),
    );
}

/** Requests whose next step is the student's: another time was offered, or a question was asked. */
export function awaitingStudent(requests: readonly OfficeHoursRequest[]) {
  return requests.filter(
    (request) =>
      request.status === AppointmentStatus.AlternativeProposed ||
      (request.status === AppointmentStatus.Pending &&
        request.awaitingStudentReply),
  );
}

function wallMinutes(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function overlaps(a: CalendarSpan, b: CalendarSpan, bufferMs: number) {
  return (
    a.start.getTime() < b.end.getTime() + bufferMs &&
    b.start.getTime() < a.end.getTime() + bufferMs
  );
}

/**
 * How a requested time sits against the academician's hours, checked in the order that matters to the answer: a
 * past time cannot be booked, a day off wins over everything, a clash (buffer included) comes before fitting.
 */
export function requestFit(
  time: AppointmentTime,
  {
    availability,
    appointments,
  }: Pick<CalendarSource, "availability" | "appointments">,
  now: Date,
): { fit: RequestFit; weekday: Weekday } {
  const span = spanOf(time);
  const weekday = weekdayOf(span.start);
  if (span.start.getTime() <= turkeyWallClock(now).getTime()) {
    return { fit: RequestFit.Past, weekday };
  }
  const day = isoDay(span.start);
  if (isDayOff(day, availability.exceptions)) {
    return { fit: RequestFit.DayOff, weekday };
  }
  const bufferMs = availability.meetingBufferMinutes * 60_000;
  const clash = appointments.some(
    (appointment) =>
      appointment.status === AppointmentStatus.Confirmed &&
      overlaps(span, spanOf(appointment), bufferMs),
  );
  if (clash) return { fit: RequestFit.Clash, weekday };
  const start = wallMinutes(span.start);
  const end = start + (span.end.getTime() - span.start.getTime()) / 60_000;
  const inRule = availability.rules.some(
    (rule) =>
      rule.dayOfWeek === weekday &&
      minutesOfDay(rule.startTime) <= start &&
      end <= minutesOfDay(rule.endTime),
  );
  const inOneOff = availability.oneOffs.some((oneOff) => {
    const window = spanOf(oneOff);
    return (
      window.start.getTime() <= span.start.getTime() &&
      span.end.getTime() <= window.end.getTime()
    );
  });
  return {
    fit: inRule || inOneOff ? RequestFit.Fits : RequestFit.Outside,
    weekday,
  };
}

/** A cancel close to the start owes the student a reason. */
export function cancelNeedsReason(
  appointment: AcademicianAppointment,
  now: Date,
) {
  return Date.parse(appointment.startsAt) - now.getTime() < LATE_CANCEL_MS;
}

/** "Ayşe Y.": how the month grid fits a name. */
export function shortName(fullName: string) {
  const [first = "", ...rest] = fullName.trim().split(/\s+/);
  const last = rest.at(-1);
  return last === undefined ? first : `${first} ${last.charAt(0)}.`;
}

/** "14–16", or "14:30–16" when a time is not on the hour: how the month grid fits availability. */
export function compactHours(start: Date, end: Date) {
  const part = (date: Date) =>
    date.getMinutes() === 0
      ? String(date.getHours())
      : `${String(date.getHours())}:${String(date.getMinutes()).padStart(2, "0")}`;
  return `${part(start)}–${part(end)}`;
}
