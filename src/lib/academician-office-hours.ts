import {
  OfficeHoursRequestAction,
  type AcademicianAppointment,
  type OfficeHoursRequest,
} from "@/interfaces/academician-office-hours";
import {
  AppointmentStatus,
  type AppointmentTime,
} from "@/interfaces/appointment";
import { WEEKDAY_ORDER, type Weekday } from "@/interfaces/mentor";
import { formatDateRange } from "@/lib/format";

/** Every academician Office Hours query sits under this key, so one answer refreshes them all. */
export const ACADEMICIAN_OFFICE_HOURS_QUERY_KEY = [
  "academician",
  "office-hours",
] as const;

export const ACADEMICIAN_REQUESTS_QUERY_KEY = [
  ...ACADEMICIAN_OFFICE_HOURS_QUERY_KEY,
  "requests",
] as const;

export const ACADEMICIAN_APPOINTMENTS_QUERY_KEY = [
  ...ACADEMICIAN_OFFICE_HOURS_QUERY_KEY,
  "appointments",
] as const;

export const ACADEMICIAN_AVAILABILITY_QUERY_KEY = [
  ...ACADEMICIAN_OFFICE_HOURS_QUERY_KEY,
  "availability",
] as const;

/** The academician answers it now: pending and not waiting on a question to the student. */
export function waitsForAcademician(request: OfficeHoursRequest) {
  return (
    request.status === AppointmentStatus.Pending &&
    !request.awaitingStudentReply
  );
}

export function byStart(a: AppointmentTime, b: AppointmentTime) {
  return Date.parse(a.startsAt) - Date.parse(b.startsAt);
}

/** Splits the academician's appointments into upcoming, past and cancelled, as of `now`. */
export function groupAppointments(
  appointments: AcademicianAppointment[],
  now: number,
) {
  const live = appointments.filter(
    (item) => item.status === AppointmentStatus.Confirmed,
  );
  return {
    upcoming: live
      .filter((item) => Date.parse(item.endsAt) > now)
      .toSorted(byStart),
    past: live
      .filter((item) => Date.parse(item.endsAt) <= now)
      .toSorted((a, b) => byStart(b, a)),
    cancelled: appointments
      .filter((item) => item.status === AppointmentStatus.Cancelled)
      .toSorted(byStart),
  };
}

const TURKEY_OFFSET_MS = 3 * 60 * 60 * 1000;

/** A "YYYY-MM-DDTHH:mm" time typed in Turkey (no daylight saving) as a time range of `minutes`. */
export function turkeyTimeRange(
  local: string,
  minutes: number,
): AppointmentTime {
  const startsAt = `${local}:00+03:00`;
  const end = new Date(
    Date.parse(startsAt) + minutes * 60_000 + TURKEY_OFFSET_MS,
  );
  return {
    startsAt,
    endsAt: `${end.toISOString().slice(0, 16)}:00+03:00`,
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Office Hours times are Turkey times: every academician screen shows them as such, wherever the browser is. */
export const TURKEY_TIME_ZONE = "Europe/Istanbul";

/** "10:00" of a moment in Turkey time. */
export function turkeyTime(value: string | Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TURKEY_TIME_ZONE,
  }).format(typeof value === "string" ? new Date(value) : value);
}

/**
 * The Turkey calendar day ("YYYY-MM-DD") a moment falls on. Office Hours times are Turkey times (see
 * turkeyTimeRange), so days are counted there too, whatever time zone the browser is in.
 */
export function turkeyDay(at: Date | string) {
  const time = typeof at === "string" ? Date.parse(at) : at.getTime();
  return new Date(time + TURKEY_OFFSET_MS).toISOString().slice(0, 10);
}

/** The day `days` after a "YYYY-MM-DD" day. */
export function shiftDay(day: string, days: number) {
  return new Date(Date.parse(`${day}T00:00:00Z`) + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/** Whole days from one "YYYY-MM-DD" day to another. */
export function daysBetween(from: string, to: string) {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS,
  );
}

/** The weekly-availability weekday of a "YYYY-MM-DD" day (getUTCDay counts from Sunday, the week from Monday). */
export function weekdayOfDay(day: string): Weekday {
  const weekday =
    WEEKDAY_ORDER[(new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7];
  if (weekday === undefined) throw new Error("A day always has a weekday");
  return weekday;
}

/** Minutes between the two ends of a range. */
export function rangeMinutes(range: AppointmentTime) {
  return Math.round(
    (Date.parse(range.endsAt) - Date.parse(range.startsAt)) / 60_000,
  );
}

/** "12 Kasım, 14:00–14:30": a requested or booked time on the academician's screens. */
export function slotWhenLabel(time: AppointmentTime, locale: string) {
  const start = new Date(time.startsAt);
  const day = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    timeZone: TURKEY_TIME_ZONE,
  }).format(start);
  const hours = formatDateRange(
    new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: TURKEY_TIME_ZONE,
    }),
    start,
    new Date(time.endsAt),
  );
  return `${day}, ${hours}`;
}

/** The one time a request names, when the academician may accept it as it is; a choice among several waits. */
export function acceptableTime(request: OfficeHoursRequest) {
  const [first, ...others] = request.requestedTimes;
  if (
    first === undefined ||
    others.length > 0 ||
    !request.allowedActions.includes(OfficeHoursRequestAction.Accept)
  ) {
    return null;
  }
  return first;
}
