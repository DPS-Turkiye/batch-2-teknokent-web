import type {
  AcademicianAppointment,
  OfficeHoursRequest,
} from "@/interfaces/academician-office-hours";
import {
  AppointmentStatus,
  type AppointmentTime,
} from "@/interfaces/appointment";
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
  }).format(start);
  const hours = formatDateRange(
    new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }),
    start,
    new Date(time.endsAt),
  );
  return `${day}, ${hours}`;
}
