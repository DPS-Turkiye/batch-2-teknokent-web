import { AppointmentStatus, type Appointment } from "@/interfaces/appointment";
import { splitAppointments } from "@/lib/appointments";
import {
  isSameDay,
  monthLabel,
  startOfWeek,
  weekDays,
  weekRangeLabel,
} from "@/lib/calendar";
import { isAwaitingAnswer } from "@/lib/student-home";
import {
  AppointmentsTab,
  AppointmentsView,
} from "@/types/student-appointments";

/** The calendar grid runs 09:00–19:00 (the last row is 18:00). */
export const APPOINTMENT_GRID_HOURS = Array.from(
  { length: 10 },
  (_, index) => 9 + index,
);

/** The list tabs: confirmed sessions ahead, requests ahead, then everything already over or called off. */
export function appointmentTabs(
  appointments: Appointment[],
  now: Date,
): Record<AppointmentsTab, Appointment[]> {
  const { upcoming, past } = splitAppointments(appointments, now);
  return {
    [AppointmentsTab.Upcoming]: upcoming.filter(
      (item) => item.status === AppointmentStatus.Confirmed,
    ),
    [AppointmentsTab.Requests]: upcoming.filter(isAwaitingAnswer),
    [AppointmentsTab.Past]: past,
  };
}

/** A day's appointments, earliest first. */
export function appointmentsOnDay(appointments: Appointment[], day: Date) {
  return appointments
    .filter((item) => isSameDay(item.startsAt, day))
    .toSorted((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}

/**
 * Where an appointment sits on the hour grid, in hours from the first row: `top` from the grid's start and
 * `height` its length (at least a quarter hour, so a short slot stays clickable). Clamped to the grid.
 */
export function gridPlacement(
  appointment: Appointment,
  hours: readonly number[] = APPOINTMENT_GRID_HOURS,
) {
  const first = hours[0] ?? 0;
  const last = (hours.at(-1) ?? first) + 1;
  const start = new Date(appointment.startsAt);
  const end = new Date(appointment.endsAt);
  const from = Math.min(
    Math.max(start.getHours() + start.getMinutes() / 60, first),
    last,
  );
  const to = Math.min(
    Math.max(end.getHours() + end.getMinutes() / 60, from),
    last,
  );
  return { top: from - first, height: Math.max(to - from, 0.25) };
}

/** The days a calendar view shows around `anchor` (the list and month views show none on the time grid). */
export function visibleDays(view: AppointmentsView, anchor: Date) {
  switch (view) {
    case AppointmentsView.Day:
      return [startOfDay(anchor)];
    case AppointmentsView.Week:
      return weekDays(startOfWeek(anchor), 7);
    case AppointmentsView.List:
    case AppointmentsView.Month:
      return [];
  }
}

/** The previous or next day, week or month from `anchor`. */
export function shiftAnchor(
  view: AppointmentsView,
  anchor: Date,
  step: 1 | -1,
) {
  const next = startOfDay(anchor);
  switch (view) {
    case AppointmentsView.Day:
      next.setDate(next.getDate() + step);
      return next;
    case AppointmentsView.Week:
      next.setDate(next.getDate() + 7 * step);
      return next;
    case AppointmentsView.Month:
      next.setDate(1);
      next.setMonth(next.getMonth() + step);
      return next;
    case AppointmentsView.List:
      return next;
  }
}

/** The calendar header: "13 Kasım 2026, Cuma", "9–15 Kasım 2026" or "Kasım 2026". */
export function calendarTitle(
  view: AppointmentsView,
  anchor: Date,
  locale: string,
) {
  switch (view) {
    case AppointmentsView.Day:
      return new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
        weekday: "long",
      }).format(anchor);
    case AppointmentsView.Week: {
      const days = weekDays(startOfWeek(anchor), 7);
      const first = days[0] ?? anchor;
      const last = days.at(-1) ?? anchor;
      return `${weekRangeLabel(first, last, locale)} ${last.getFullYear()}`;
    }
    case AppointmentsView.Month:
    case AppointmentsView.List:
      return monthLabel(anchor, locale);
  }
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** "Elif Karaca" → "E. Karaca", as a calendar chip names the other side; one word stays as it is. */
export function shortPersonName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const last = parts.at(-1) ?? "";
  const first = parts[0];
  return parts.length > 1 && first ? `${first.charAt(0)}. ${last}` : last;
}
