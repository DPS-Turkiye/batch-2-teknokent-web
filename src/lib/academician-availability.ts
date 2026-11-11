import type {
  AcademicianAvailability,
  OfficeHoursOneOff,
  UpdateAcademicianAvailabilityPayload,
} from "@/interfaces/academician-office-hours";
import {
  WEEKDAY_ORDER,
  type MentorAvailabilityException,
  type MentorAvailabilityRule,
  type Weekday,
} from "@/interfaces/mentor";
import { rangeMinutes, turkeyTimeRange } from "@/lib/academician-office-hours";
import { addDays, isoDay, startOfWeek } from "@/lib/coordinator-calendar";
import { weekdayOf } from "@/lib/mentor-availability";
import {
  AvailabilityFormError,
  AvailabilityItemKind,
} from "@/types/academician-office-hours";

export type AvailabilityItem =
  | { kind: AvailabilityItemKind.Recurring; rule: MentorAvailabilityRule }
  | { kind: AvailabilityItemKind.OneOff; oneOff: OfficeHoursOneOff }
  | {
      kind: AvailabilityItemKind.Unavailable;
      exception: MentorAvailabilityException;
    };

export type WeekAvailability = { minutes: number; weekdays: Weekday[] };

function minutesOfDay(time: string) {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

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
  const today = isoDay(now);
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
 * The open hours of the week `now` falls in, Monday to Sunday: weekly ranges plus one-offs, minus days off. Booked
 * time is not subtracted; the home card reads "müsait saat", the hours students can pick from.
 */
export function weekAvailability(
  availability: AcademicianAvailability,
  now: Date,
): WeekAvailability {
  const monday = startOfWeek(now);
  let minutes = 0;
  const weekdays: Weekday[] = [];
  for (let offset = 0; offset < WEEKDAY_ORDER.length; offset += 1) {
    const date = addDays(monday, offset);
    const day = isoDay(date);
    if (isDayOff(day, availability.exceptions)) continue;
    const weekday = weekdayOf(date);
    const dayMinutes =
      availability.rules
        .filter((rule) => rule.dayOfWeek === weekday)
        .reduce((sum, rule) => sum + ruleMinutes(rule), 0) +
      availability.oneOffs
        .filter((oneOff) => isoDay(new Date(oneOff.startsAt)) === day)
        .reduce((sum, oneOff) => sum + rangeMinutes(oneOff), 0);
    if (dayMinutes > 0) {
      minutes += dayMinutes;
      weekdays.push(weekday);
    }
  }
  return { minutes, weekdays };
}

/* ------------------------------------------------------------------ editing */

export type RuleInput = {
  dayOfWeek: Weekday;
  startTime: string;
  endTime: string;
};
export type OneOffInput = {
  date: string;
  startTime: string;
  endTime: string;
  place: string;
};
export type DayOffInput = { startsOn: string; endsOn: string; reason: string };

/** What the save sends: everything as it is, without the ids the source hands out. */
export function toAvailabilityPayload(
  availability: AcademicianAvailability,
): UpdateAcademicianAvailabilityPayload {
  return {
    rules: availability.rules.map(
      ({ dayOfWeek, startTime, endTime, slotMinutes }) => ({
        dayOfWeek,
        startTime,
        endTime,
        slotMinutes,
      }),
    ),
    exceptions: availability.exceptions,
    menteeCapacity: availability.menteeCapacity,
    defaultMeetingDurationMinutes: availability.defaultMeetingDurationMinutes,
    meetingBufferMinutes: availability.meetingBufferMinutes,
    oneOffs: availability.oneOffs.map(({ startsAt, endsAt, place }) => ({
      startsAt,
      endsAt,
      place,
    })),
  };
}

/** The one-off as a time range typed in Turkey time. */
export function oneOffTime(input: OneOffInput) {
  return turkeyTimeRange(
    `${input.date}T${input.startTime}`,
    minutesOfDay(input.endTime) - minutesOfDay(input.startTime),
  );
}

/** Adds a weekly range, or replaces the one with `replacing`. Slots follow the default meeting length. */
export function withRule(
  availability: AcademicianAvailability,
  input: RuleInput,
  replacing: string | null,
): UpdateAcademicianAvailabilityPayload {
  const rule = {
    id: replacing ?? "new",
    ...input,
    slotMinutes: availability.defaultMeetingDurationMinutes,
  };
  return toAvailabilityPayload({
    ...availability,
    rules:
      replacing === null
        ? [...availability.rules, rule]
        : availability.rules.map((item) =>
            item.id === replacing ? rule : item,
          ),
  });
}

export function withoutRule(availability: AcademicianAvailability, id: string) {
  return toAvailabilityPayload({
    ...availability,
    rules: availability.rules.filter((rule) => rule.id !== id),
  });
}

export function withOneOff(
  availability: AcademicianAvailability,
  input: OneOffInput,
  replacing: string | null,
): UpdateAcademicianAvailabilityPayload {
  const oneOff = {
    ...oneOffTime(input),
    place: input.place.trim() === "" ? null : input.place.trim(),
  };
  return toAvailabilityPayload({
    ...availability,
    oneOffs:
      replacing === null
        ? [...availability.oneOffs, oneOff]
        : availability.oneOffs.map((item) =>
            item.id === replacing ? oneOff : item,
          ),
  });
}

export function withoutOneOff(
  availability: AcademicianAvailability,
  id: string,
) {
  return toAvailabilityPayload({
    ...availability,
    oneOffs: availability.oneOffs.filter((oneOff) => oneOff.id !== id),
  });
}

export function withDayOff(
  availability: AcademicianAvailability,
  input: DayOffInput,
  replacing: string | null,
): UpdateAcademicianAvailabilityPayload {
  const exception = {
    ...(replacing === null ? {} : { id: replacing }),
    startsOn: input.startsOn,
    endsOn: input.endsOn === "" ? input.startsOn : input.endsOn,
    reason: input.reason.trim() === "" ? null : input.reason.trim(),
  };
  return toAvailabilityPayload({
    ...availability,
    exceptions:
      replacing === null
        ? [...availability.exceptions, exception]
        : availability.exceptions.map((item) =>
            item.id === replacing ? exception : item,
          ),
  });
}

export function withoutDayOff(
  availability: AcademicianAvailability,
  id: string,
) {
  return toAvailabilityPayload({
    ...availability,
    exceptions: availability.exceptions.filter(
      (exception) => exception.id !== id,
    ),
  });
}

/* --------------------------------------------------------------- validation */

function rangesOverlap(
  a: { start: number; end: number },
  b: { start: number; end: number },
) {
  return a.start < b.end && b.start < a.end;
}

/** Why a weekly range can't be saved: a missing time, an end before the start, or a clash on the same day. */
export function ruleError(
  input: RuleInput,
  rules: readonly MentorAvailabilityRule[],
  replacing: string | null,
): AvailabilityFormError | null {
  if (input.startTime === "" || input.endTime === "") {
    return AvailabilityFormError.NeedFields;
  }
  const range = {
    start: minutesOfDay(input.startTime),
    end: minutesOfDay(input.endTime),
  };
  if (range.end <= range.start) return AvailabilityFormError.EndAfterStart;
  const clash = rules.some(
    (rule) =>
      rule.id !== replacing &&
      rule.dayOfWeek === input.dayOfWeek &&
      rangesOverlap(range, {
        start: minutesOfDay(rule.startTime),
        end: minutesOfDay(rule.endTime),
      }),
  );
  return clash ? AvailabilityFormError.Overlap : null;
}

/**
 * Why one-off hours can't be saved. A one-off on a day off is refused rather than mixed with it: the day off
 * would hide it, so the academician lifts the day off first.
 */
export function oneOffError(
  input: OneOffInput,
  availability: AcademicianAvailability,
  replacing: string | null,
  now: Date,
): AvailabilityFormError | null {
  if (input.date === "" || input.startTime === "" || input.endTime === "") {
    return AvailabilityFormError.NeedFields;
  }
  if (minutesOfDay(input.endTime) <= minutesOfDay(input.startTime)) {
    return AvailabilityFormError.EndAfterStart;
  }
  const time = oneOffTime(input);
  if (Date.parse(time.startsAt) <= now.getTime()) {
    return AvailabilityFormError.Past;
  }
  if (isDayOff(input.date, availability.exceptions)) {
    return AvailabilityFormError.InsideDayOff;
  }
  const range = {
    start: Date.parse(time.startsAt),
    end: Date.parse(time.endsAt),
  };
  const clash = availability.oneOffs.some(
    (oneOff) =>
      oneOff.id !== replacing &&
      rangesOverlap(range, {
        start: Date.parse(oneOff.startsAt),
        end: Date.parse(oneOff.endsAt),
      }),
  );
  return clash ? AvailabilityFormError.Overlap : null;
}

/** Why a day off can't be saved: no start, an end before the start, or the same days again. */
export function dayOffError(
  input: DayOffInput,
  exceptions: readonly MentorAvailabilityException[],
  replacing: string | null,
): AvailabilityFormError | null {
  if (input.startsOn === "") return AvailabilityFormError.NeedFields;
  const endsOn = input.endsOn === "" ? input.startsOn : input.endsOn;
  if (endsOn < input.startsOn) return AvailabilityFormError.EndAfterStart;
  const clash = exceptions.some(
    (exception) =>
      exception.id !== replacing &&
      exception.startsOn <= endsOn &&
      input.startsOn <= exception.endsOn,
  );
  return clash ? AvailabilityFormError.Overlap : null;
}
