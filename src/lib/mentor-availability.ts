import type {
  MentorAvailabilityException,
  MentorAvailabilitySettings,
  UpdateMentorAvailabilitySettingsPayload,
  Weekday,
} from "@/interfaces/mentor";
import { WEEKDAY_LABELS, WEEKDAY_ORDER } from "@/interfaces/mentor";

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

export const AVAILABILITY_NUMBER_FIELDS: {
  field: AvailabilityNumberField;
  label: string;
}[] = [
  { field: "menteeCapacity", label: "Eş zamanlı mentorluk limiti" },
  {
    field: "defaultMeetingDurationMinutes",
    label: "Varsayılan görüşme süresi (dk)",
  },
  { field: "meetingBufferMinutes", label: "İki görüşme arası tampon (dk)" },
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

/** The first thing the backend would refuse, in the words the mentor sees, or null. */
export function availabilityDraftError(draft: AvailabilityDraft) {
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
    draft.menteeCapacity.trim() &&
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

/** "2026-10-01 – 2026-10-03 · İzin" */
export function exceptionLabel(exception: MentorAvailabilityException) {
  const range =
    exception.endsOn !== exception.startsOn
      ? `${exception.startsOn} – ${exception.endsOn}`
      : exception.startsOn;
  return exception.reason ? `${range} · ${exception.reason}` : range;
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
