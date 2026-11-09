import type { AppointmentTime } from "@/interfaces/appointment";

/** Every academician Office Hours query sits under this key, so one answer refreshes them all. */
export const ACADEMICIAN_OFFICE_HOURS_QUERY_KEY = [
  "academician",
  "office-hours",
] as const;

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
