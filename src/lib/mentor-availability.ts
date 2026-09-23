import type {
  MentorAvailabilityException,
  MentorAvailabilitySettings,
  UpdateMentorAvailabilitySettingsPayload,
  Weekday,
} from "@/interfaces/mentor";
import { WEEKDAY_LABELS, WEEKDAY_ORDER } from "@/interfaces/mentor";
import { calendarDay } from "@/lib/utils";

/** One weekly time range as the editor holds it; `key` is stable across edits. */
export type AvailabilityRange = {
  key: string;
  dayOfWeek: Weekday;
  startTime: string;
  endTime: string;
  slotMinutes: number | null;
};

export type AvailabilityNumberField =
  "menteeCapacity" | "defaultMeetingDurationMinutes" | "meetingBufferMinutes";

/** Numbers stay strings while typed, so an emptied field isn't silently sent as 0. */
export type AvailabilityDraft = {
  ranges: AvailabilityRange[];
  exceptions: MentorAvailabilityException[];
} & Record<AvailabilityNumberField, string>;

export type ExceptionInput = {
  startsOn: string;
  endsOn: string;
  reason: string;
};

export const EMPTY_EXCEPTION_INPUT: ExceptionInput = {
  startsOn: "",
  endsOn: "",
  reason: "",
};

export const DEFAULT_RANGE = { startTime: "09:00", endTime: "17:00" };

export type NumberFieldBounds = { min: number; max: number; step: number };

/** Bounds match UpdateMentorAvailabilitySettingsRequest on the backend. */
export const AVAILABILITY_NUMBER_FIELDS: ({
  field: AvailabilityNumberField;
  label: string;
  unit?: string;
} & NumberFieldBounds)[] = [
  {
    field: "menteeCapacity",
    label: "Eş zamanlı mentorluk limiti",
    min: 1,
    max: 50,
    step: 1,
  },
  {
    field: "defaultMeetingDurationMinutes",
    label: "Varsayılan görüşme süresi",
    unit: "dk",
    min: 15,
    max: 480,
    step: 15,
  },
  {
    field: "meetingBufferMinutes",
    label: "İki görüşme arası tampon",
    unit: "dk",
    min: 0,
    max: 240,
    step: 5,
  },
];

/** The backend sends "09:00:00"; time inputs and labels use "09:00". */
export function toTimeInput(value: string) {
  return value.slice(0, 5);
}

export function toAvailabilityDraft(
  settings: MentorAvailabilitySettings,
): AvailabilityDraft {
  return {
    ranges: settings.rules.map((rule) => ({
      key: rule.id,
      dayOfWeek: rule.dayOfWeek,
      startTime: toTimeInput(rule.startTime),
      endTime: toTimeInput(rule.endTime),
      slotMinutes: rule.slotMinutes,
    })),
    exceptions: settings.exceptions.map(({ startsOn, endsOn, reason }) => ({
      startsOn,
      endsOn,
      reason,
    })),
    menteeCapacity:
      settings.menteeCapacity == null ? "" : String(settings.menteeCapacity),
    defaultMeetingDurationMinutes: String(
      settings.defaultMeetingDurationMinutes,
    ),
    meetingBufferMinutes: String(settings.meetingBufferMinutes),
  };
}

export function rangesForDay(draft: AvailabilityDraft, day: Weekday) {
  return draft.ranges
    .filter((range) => range.dayOfWeek === day)
    .sort((left, right) => left.startTime.localeCompare(right.startTime));
}

function addHour(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  if (hours >= 23) return "23:59";
  return `${String(hours + 1).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** A new range starts where the day's last one ends, an hour long. */
export function nextRangeAfter(ranges: AvailabilityRange[]) {
  const last = ranges.at(-1);
  if (!last) return DEFAULT_RANGE;
  return { startTime: last.endTime, endTime: addHour(last.endTime) };
}

function wholeNumberBetween(value: string, min: number, max: number) {
  if (!/^\d+$/.test(value.trim())) return false;
  const number = Number(value);
  return number >= min && number <= max;
}

/** The value one step up or down, kept within bounds; an empty field starts at the minimum. */
export function stepNumberValue(
  value: string,
  { min, max, step }: NumberFieldBounds,
  direction: 1 | -1,
) {
  if (!/^\d+$/.test(value.trim())) return String(min);
  return String(Math.min(max, Math.max(min, Number(value) + direction * step)));
}

/**
 * The first thing the backend would refuse, in the words the mentor sees, or null.
 * An empty capacity means "keep the saved one" to the backend, so once a capacity
 * is saved, emptying the field is refused rather than reported as a save.
 */
export function availabilityDraftError(
  draft: AvailabilityDraft,
  { capacityRequired = false }: { capacityRequired?: boolean } = {},
) {
  for (const day of WEEKDAY_ORDER) {
    const ranges = rangesForDay(draft, day);
    for (const [index, range] of ranges.entries()) {
      if (
        !range.startTime ||
        !range.endTime ||
        range.endTime <= range.startTime
      ) {
        return `${WEEKDAY_LABELS[day]}: bitiş saati başlangıçtan sonra olmalı.`;
      }
      const next = ranges[index + 1];
      if (next && next.startTime < range.endTime) {
        return `${WEEKDAY_LABELS[day]}: saat aralıkları çakışıyor.`;
      }
    }
  }
  if (draft.ranges.length > 21) {
    return "En fazla 21 saat aralığı ekleyebilirsin.";
  }
  if (
    (capacityRequired || draft.menteeCapacity.trim()) &&
    !wholeNumberBetween(draft.menteeCapacity, 1, 50)
  ) {
    return "Eş zamanlı mentorluk limiti 1 ile 50 arasında olmalı.";
  }
  if (!wholeNumberBetween(draft.defaultMeetingDurationMinutes, 15, 480)) {
    return "Varsayılan görüşme süresi 15 ile 480 dakika arasında olmalı.";
  }
  if (!wholeNumberBetween(draft.meetingBufferMinutes, 0, 240)) {
    return "İki görüşme arası tampon 0 ile 240 dakika arasında olmalı.";
  }
  if (draft.exceptions.length > 30) {
    return "En fazla 30 tarih ekleyebilirsin.";
  }
  return null;
}

/** Why a new unavailable date range can't be added, or null. */
export function exceptionError(
  exception: MentorAvailabilityException,
  existing: MentorAvailabilityException[],
) {
  if (!exception.startsOn) return "Bir başlangıç tarihi seç.";
  if (exception.endsOn < exception.startsOn) {
    return "Bitiş tarihi başlangıçtan önce olamaz.";
  }
  if (
    existing.some(
      (item) =>
        item.startsOn === exception.startsOn &&
        item.endsOn === exception.endsOn,
    )
  ) {
    return "Bu tarih aralığı zaten ekli.";
  }
  return null;
}

const DAY_MONTH = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
});

/** "21–25 Eylül · İzin", "3 Ekim", "30 Eylül – 2 Ekim"; the year only when it isn't this year. */
export function exceptionLabel(
  exception: MentorAvailabilityException,
  now = new Date(),
) {
  const start = calendarDay(exception.startsOn);
  const end = calendarDay(exception.endsOn);
  let range: string;
  if (exception.endsOn === exception.startsOn) {
    range = DAY_MONTH.format(start);
  } else if (
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth()
  ) {
    range = `${start.getDate()}–${DAY_MONTH.format(end)}`;
  } else {
    range = `${DAY_MONTH.format(start)} – ${DAY_MONTH.format(end)}`;
  }
  if (end.getFullYear() !== now.getFullYear()) {
    range = `${range} ${end.getFullYear()}`;
  }
  return exception.reason ? `${range} · ${exception.reason}` : range;
}

/** Unavailable ranges that touch any day from `first` to `last` (local midnights). */
export function exceptionsInRange(
  exceptions: MentorAvailabilityException[],
  first: Date,
  last: Date,
) {
  return exceptions.filter(
    (exception) =>
      calendarDay(exception.startsOn) <= last &&
      calendarDay(exception.endsOn) >= first,
  );
}

export function toAvailabilityPayload(
  draft: AvailabilityDraft,
): UpdateMentorAvailabilitySettingsPayload {
  const duration = Number(draft.defaultMeetingDurationMinutes);
  return {
    rules: draft.ranges.map(
      ({ dayOfWeek, startTime, endTime, slotMinutes }) => ({
        dayOfWeek,
        startTime,
        endTime,
        slotMinutes: slotMinutes ?? duration,
      }),
    ),
    exceptions: draft.exceptions,
    menteeCapacity: draft.menteeCapacity.trim()
      ? Number(draft.menteeCapacity)
      : null,
    defaultMeetingDurationMinutes: duration,
    meetingBufferMinutes: Number(draft.meetingBufferMinutes),
  };
}
