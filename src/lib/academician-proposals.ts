import {
  MAX_PROPOSED_TIMES,
  OfficeHoursRequestAction,
  type AcademicianAppointment,
  type AcademicianAvailability,
  type OfficeHoursAnswer,
  type OfficeHoursRequest,
} from "@/interfaces/academician-office-hours";
import {
  AppointmentStatus,
  type AppointmentTime,
} from "@/interfaces/appointment";
import { isDayOff } from "@/lib/academician-availability";
import {
  byStart,
  turkeyTimeRange,
  waitsForAcademician,
} from "@/lib/academician-office-hours";
import { addDays, isoDay } from "@/lib/coordinator-calendar";
import { weekdayOf } from "@/lib/mentor-availability";

/** The propose dialog offers the next five weekdays, like the frame ("Sal 10 … Pzt 16"). */
export const PROPOSABLE_DAY_COUNT = 5;

export type ProposableSlot = { time: AppointmentTime; taken: boolean };

export type ProposableDay = {
  day: string;
  date: Date;
  slots: ProposableSlot[];
  /** False when nothing on the day can be offered; the chip is shown, but disabled. */
  open: boolean;
};

type Source = {
  availability: AcademicianAvailability;
  appointments: readonly AcademicianAppointment[];
  requests: readonly OfficeHoursRequest[];
};

function minutesOf(time: string) {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function clockOf(minutes: number) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

/** The open windows of a day in minutes: its weekly ranges and its one-offs (none on a day off). */
function windowsOf(date: Date, availability: AcademicianAvailability) {
  const day = isoDay(date);
  if (isDayOff(day, availability.exceptions)) return [];
  const weekday = weekdayOf(date);
  const weekly = availability.rules
    .filter((rule) => rule.dayOfWeek === weekday)
    .map((rule) => ({
      start: minutesOf(rule.startTime),
      end: minutesOf(rule.endTime),
    }));
  const oneOffs = availability.oneOffs
    .filter((oneOff) => isoDay(new Date(oneOff.startsAt)) === day)
    .map((oneOff) => {
      const start = new Date(oneOff.startsAt);
      const end = new Date(oneOff.endsAt);
      return {
        start: start.getHours() * 60 + start.getMinutes(),
        end: end.getHours() * 60 + end.getMinutes(),
      };
    });
  return [...weekly, ...oneOffs];
}

/** Times other requests already hold: what students asked for, and what was offered to them. */
function heldTimes(
  requests: readonly OfficeHoursRequest[],
  excludeRequestId: string,
) {
  return requests.flatMap((request) => {
    if (request.id === excludeRequestId) return [];
    if (waitsForAcademician(request)) return request.requestedTimes;
    if (request.status === AppointmentStatus.AlternativeProposed) {
      return request.proposedTimes;
    }
    return [];
  });
}

function overlaps(a: AppointmentTime, b: AppointmentTime, bufferMs: number) {
  return (
    Date.parse(a.startsAt) < Date.parse(b.endsAt) + bufferMs &&
    Date.parse(b.startsAt) < Date.parse(a.endsAt) + bufferMs
  );
}

/**
 * The days and times the academician can offer instead of a requested time. Slots are as long as the default
 * meeting and start a buffer apart; a slot is taken when it meets a booked appointment (buffer included) or a time
 * another request holds. The request's own time stays free, so the student can be offered a neighbour of it.
 */
export function proposableDays(
  { availability, appointments, requests }: Source,
  { now, excludeRequestId }: { now: Date; excludeRequestId: string },
): ProposableDay[] {
  const duration = availability.defaultMeetingDurationMinutes;
  const bufferMinutes = availability.meetingBufferMinutes;
  const bufferMs = bufferMinutes * 60_000;
  const booked = appointments.filter(
    (appointment) => appointment.status === AppointmentStatus.Confirmed,
  );
  const held = heldTimes(requests, excludeRequestId);

  const days: Date[] = [];
  for (
    let date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    days.length < PROPOSABLE_DAY_COUNT;
    date = addDays(date, 1)
  ) {
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    if (!weekend) days.push(date);
  }

  return days.map((date) => {
    const day = isoDay(date);
    const starts = new Set<number>();
    for (const window of windowsOf(date, availability)) {
      for (
        let start = window.start;
        start + duration <= window.end;
        start += duration + bufferMinutes
      ) {
        starts.add(start);
      }
    }
    const slots = [...starts]
      .map((start) => turkeyTimeRange(`${day}T${clockOf(start)}`, duration))
      .filter((time) => Date.parse(time.startsAt) > now.getTime())
      .toSorted(byStart)
      .map((time) => ({
        time,
        taken:
          booked.some((appointment) => overlaps(time, appointment, bufferMs)) ||
          held.some((other) => overlaps(time, other, 0)),
      }));
    return { day, date, slots, open: slots.some((slot) => !slot.taken) };
  });
}

/** Picks or drops a time; a pick past the limit is ignored and the dialog says why. */
export function toggleProposed(
  selected: readonly AppointmentTime[],
  time: AppointmentTime,
  max = MAX_PROPOSED_TIMES,
) {
  if (selected.some((item) => item.startsAt === time.startsAt)) {
    return selected.filter((item) => item.startsAt !== time.startsAt);
  }
  return selected.length >= max ? [...selected] : [...selected, time];
}

/** The answer the dialog sends: the picked times in order, and the note when there is one. */
export function proposalPayload(
  selected: readonly AppointmentTime[],
  note: string,
): OfficeHoursAnswer {
  const trimmed = note.trim();
  return {
    action: OfficeHoursRequestAction.ProposeTimes,
    times: selected.toSorted(byStart),
    note: trimmed === "" ? null : trimmed,
  };
}
