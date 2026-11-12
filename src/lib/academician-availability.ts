import type {
  AcademicianAvailability,
  OfficeHoursOneOff,
} from "@/interfaces/academician-office-hours";
import {
  WEEKDAY_ORDER,
  type MentorAvailabilityException,
  type MentorAvailabilityRule,
  type Weekday,
} from "@/interfaces/mentor";
import {
  rangeMinutes,
  shiftDay,
  turkeyDay,
  weekdayOfDay,
} from "@/lib/academician-office-hours";
import { minutesOfDay } from "@/lib/utils";
import { AvailabilityItemKind } from "@/types/academician-office-hours";

export type AvailabilityItem =
  | { kind: AvailabilityItemKind.Recurring; rule: MentorAvailabilityRule }
  | { kind: AvailabilityItemKind.OneOff; oneOff: OfficeHoursOneOff }
  | {
      kind: AvailabilityItemKind.Unavailable;
      exception: MentorAvailabilityException;
    };

export type WeekAvailability = { minutes: number; weekdays: Weekday[] };

function ruleMinutes(rule: MentorAvailabilityRule) {
  return minutesOfDay(rule.endTime) - minutesOfDay(rule.startTime);
}

/** Whether a "YYYY-MM-DD" day is a day off; a day off closes every hour on it. */
export function isDayOff(
  day: string,
  exceptions: readonly MentorAvailabilityException[],
) {
  return exceptions.some(
    (exception) => exception.startsOn <= day && day <= exception.endsOn,
  );
}

/** Students can request a time only while there is a weekly range or a one-off still ahead. */
export function hasAvailability(
  availability: AcademicianAvailability,
  now: Date,
) {
  return (
    availability.rules.length > 0 ||
    availability.oneOffs.some(
      (oneOff) => Date.parse(oneOff.endsAt) > now.getTime(),
    )
  );
}

/**
 * "Müsaitliğim": weekly ranges in week order, then the one-offs and days off that are not over yet. Past entries
 * are left out because they no longer change what a student can book.
 */
export function availabilitySummary(
  availability: AcademicianAvailability,
  now: Date,
): AvailabilityItem[] {
  const today = turkeyDay(now);
  const recurring = availability.rules
    .toSorted(
      (a, b) =>
        WEEKDAY_ORDER.indexOf(a.dayOfWeek) -
          WEEKDAY_ORDER.indexOf(b.dayOfWeek) ||
        a.startTime.localeCompare(b.startTime),
    )
    .map((rule): AvailabilityItem => ({
      kind: AvailabilityItemKind.Recurring,
      rule,
    }));
  const oneOffs = availability.oneOffs
    .filter((oneOff) => Date.parse(oneOff.endsAt) > now.getTime())
    .toSorted((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
    .map((oneOff): AvailabilityItem => ({
      kind: AvailabilityItemKind.OneOff,
      oneOff,
    }));
  const daysOff = availability.exceptions
    .filter((exception) => exception.endsOn >= today)
    .toSorted((a, b) => a.startsOn.localeCompare(b.startsOn))
    .map((exception): AvailabilityItem => ({
      kind: AvailabilityItemKind.Unavailable,
      exception,
    }));
  return [...recurring, ...oneOffs, ...daysOff];
}

/**
 * The open hours of the Turkey week `now` falls in, Monday to Sunday: weekly ranges plus one-offs, minus days off.
 * Booked time is not subtracted; the home card reads "müsait saat", the hours students can pick from.
 */
export function weekAvailability(
  availability: AcademicianAvailability,
  now: Date,
): WeekAvailability {
  const today = turkeyDay(now);
  const monday = shiftDay(today, -WEEKDAY_ORDER.indexOf(weekdayOfDay(today)));
  let minutes = 0;
  const weekdays: Weekday[] = [];
  for (let offset = 0; offset < WEEKDAY_ORDER.length; offset += 1) {
    const day = shiftDay(monday, offset);
    if (isDayOff(day, availability.exceptions)) continue;
    const weekday = weekdayOfDay(day);
    const dayMinutes =
      availability.rules
        .filter((rule) => rule.dayOfWeek === weekday)
        .reduce((sum, rule) => sum + ruleMinutes(rule), 0) +
      availability.oneOffs
        .filter((oneOff) => turkeyDay(oneOff.startsAt) === day)
        .reduce((sum, oneOff) => sum + rangeMinutes(oneOff), 0);
    if (dayMinutes > 0) {
      minutes += dayMinutes;
      weekdays.push(weekday);
    }
  }
  return { minutes, weekdays };
}
