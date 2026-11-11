export function formatSlotDateTime(startsAt: string, locale = "tr") {
  const date = new Date(startsAt);
  const datePart = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(date);
  const timePart = new Intl.DateTimeFormat(locale, {
    timeStyle: "short",
  }).format(date);
  return `${datePart}, ${timePart}`;
}

export function formatMeetingShort(startsAt: string, locale = "tr") {
  const date = new Date(startsAt);
  const datePart = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  }).format(date);
  const timePart = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return `${datePart} · ${timePart}`;
}

/**
 * Node's ICU writes thin spaces (U+2009, U+202F) around the dash of a range where browsers write plain spaces, so a
 * range rendered on the server would not match the one React hydrates in the browser. Plain spaces keep both equal.
 */
const RANGE_SPACES = /[  ]/g;

export function formatDateRange(
  formatter: Intl.DateTimeFormat,
  start: Date,
  end: Date,
) {
  return formatter.formatRange(start, end).replace(RANGE_SPACES, " ");
}
