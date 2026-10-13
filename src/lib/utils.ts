/** Which `common.greeting` fits the hour. */
export function dayPart(now = new Date()) {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  return "evening";
}

/** A calendar-day string ("2026-09-15") at local midnight, so it never shows as the day before. */
export function calendarDay(value: string) {
  return new Date(`${value}T00:00:00`);
}

export function formatDateTime(value: string, locale = "tr") {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
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
