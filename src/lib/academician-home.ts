import type {
  AcademicianAppointment,
  AcademicianAvailability,
  OfficeHoursRequest,
} from "@/interfaces/academician-office-hours";
import { AppointmentStatus } from "@/interfaces/appointment";
import {
  availabilitySummary,
  hasAvailability,
  weekAvailability,
  type AvailabilityItem,
  type WeekAvailability,
} from "@/lib/academician-availability";
import {
  byStart,
  groupAppointments,
  waitsForAcademician,
} from "@/lib/academician-office-hours";
import { isoDay } from "@/lib/coordinator-calendar";

/** How many waiting requests Ana Sayfa shows before "Tümü". */
export const HOME_REQUEST_PREVIEW = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

export type HomeSummary = {
  pendingCount: number;
  oldestRequestedAt: string | null;
  /** Oldest first, so the one waiting longest is answered first. */
  latestRequests: OfficeHoursRequest[];
  today: AcademicianAppointment[];
  upcomingCount: number;
  week: WeekAvailability;
  hasAvailability: boolean;
  availability: AvailabilityItem[];
};

/** Everything Ana Sayfa shows, from the same data as Randevularım, as of `now`. */
export function homeSummary({
  requests,
  appointments,
  availability,
  now,
}: {
  requests: OfficeHoursRequest[];
  appointments: AcademicianAppointment[];
  availability: AcademicianAvailability;
  now: Date;
}): HomeSummary {
  const waiting = requests
    .filter(waitsForAcademician)
    .toSorted((a, b) => Date.parse(a.requestedAt) - Date.parse(b.requestedAt));
  const today = isoDay(now);
  return {
    pendingCount: waiting.length,
    oldestRequestedAt: waiting[0]?.requestedAt ?? null,
    latestRequests: waiting.slice(0, HOME_REQUEST_PREVIEW),
    today: appointments
      .filter(
        (item) =>
          item.status === AppointmentStatus.Confirmed &&
          isoDay(new Date(item.startsAt)) === today,
      )
      .toSorted(byStart),
    upcomingCount: groupAppointments(appointments, now.getTime()).upcoming
      .length,
    week: weekAvailability(availability, now),
    hasAvailability: hasAvailability(availability, now),
    availability: availabilitySummary(availability, now),
  };
}

/** Whole calendar days from `value` to `now` ("2 gün önce"), counted between local midnights. */
export function daysSince(value: string, now: Date) {
  const then = new Date(value);
  const start = new Date(then.getFullYear(), then.getMonth(), then.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((end.getTime() - start.getTime()) / DAY_MS);
}

/** "Elif" from "Elif Şahin": the design greets an academician by first name ("Günaydın, Elif Hocam"). */
export function greetingName(fullName: string | null) {
  const first = fullName?.trim().split(/\s+/)[0];
  return first === undefined || first === "" ? null : first;
}
