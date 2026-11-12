/** Which `common.greeting` fits the hour. */
export function dayPart(now = new Date()) {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  return "evening";
}

/** Minutes since midnight of an "HH:mm" time, for comparing and measuring time ranges. */
export function minutesOfDay(time: string) {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/** A calendar-day string ("2026-09-15") at local midnight, so it never shows as the day before. */
export function calendarDay(value: string) {
  return new Date(`${value}T00:00:00`);
}

/** "Bugün" / "Dün" / "Today" / "Yesterday" for a day offset (0, -1), capitalized for a label. */
export function relativeDayLabel(offset: number, locale = "tr") {
  const text = new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
    offset,
    "day",
  );
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}

/** "12 Eyl 2026" for a calendar-day string ("2026-09-12"); the string itself when unreadable. */
export function formatCalendarDay(value: string, locale = "tr") {
  const date = calendarDay(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
}

export function formatDateTime(value: string, locale = "tr") {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

/** "12 Kasım 2026 14:00 – 14:30": a start date and time with the end time of the same day. */
export function formatTimeRange(
  startsAt: string,
  endsAt: string,
  locale = "tr",
) {
  const end = new Intl.DateTimeFormat(locale, { timeStyle: "short" }).format(
    new Date(endsAt),
  );
  return `${formatDateTime(startsAt, locale)} – ${end}`;
}

/** "2 Eylül 2026" */
export function formatLongDate(value: string, locale = "tr") {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

/** "30 Ağu" */
export function formatDayMonth(date: Date, locale = "tr") {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  }).format(date);
}

/** "12 Eyl 2026" */
export function formatShortDate(value: string, locale = "tr") {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export function toDateTimeLocalValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** "Ayşe Nur Yılmaz" → "Ayşe Nur" + "Yılmaz"; a single word is the first name. */
export function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return { firstName: parts[0] ?? "", lastName: "" };
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.at(-1) ?? "",
  };
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${Number((bytes / (1024 * 1024)).toFixed(1))} MB`;
}

export function scrollToTop() {
  if (typeof window === "undefined") return;
  if (typeof window.scrollTo !== "function") return;
  window.scrollTo(0, 0);
}

/** Shortens text for one-line summaries, ending on a word where it can. */
export function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** The thrown message when there is one; callers pass what to say when there is not. */
export function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

/** A loose shape check (something@something.tld); the backend has the last word. */
export function isEmailAddress(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** The address when it is a plain http(s) link, so text people typed never becomes a `javascript:` href. */
export function httpUrlOrNull(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return /^https?:\/\/\S+$/i.test(trimmed) ? trimmed : null;
}

/** Each distinct item once, keyed by `keyOf`: stable React keys for read-only lists without index keys. */
export function distinctBy<T>(items: readonly T[], keyOf: (item: T) => string) {
  const byKey = new Map<string, T>();
  for (const item of items) {
    const key = keyOf(item);
    if (!byKey.has(key)) byKey.set(key, item);
  }
  return [...byKey].map(([key, item]) => ({ key, item }));
}

/** A backend id; anything else (say `..`) never reaches a backend URL. */
export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

/** Whether a page sits in the admin frame; shared screens use it to keep links inside that frame. */
export function isAdminArea(pathname: string | null) {
  return pathname?.startsWith("/admin/") ?? false;
}

/** A yyyy-mm-dd day, the way the report and calendar endpoints take it. */
export const ISO_DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
