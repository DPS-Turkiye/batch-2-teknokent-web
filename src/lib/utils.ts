export function dayGreeting(now = new Date()) {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return "Günaydın";
  if (hour >= 12 && hour < 18) return "İyi günler";
  return "İyi akşamlar";
}

/** A calendar-day string ("2026-09-15") at local midnight, so it never shows as the day before. */
export function calendarDay(value: string) {
  return new Date(`${value}T00:00:00`);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

/** "2 Eylül 2026" */
export function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

/** "30 Ağu" */
export function formatDayMonth(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
  }).format(date);
}

/** "12 Eyl 2026" */
export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(
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
  const mb = bytes / (1024 * 1024);
  return `${mb < 0.1 ? mb.toFixed(2) : Number(mb.toFixed(1))} MB`;
}

/** "Toplantıya 3 saatten az kaldı" style countdown, computed from an ISO timestamp. */
export function meetingCountdownLabel(iso: string, now = new Date()) {
  const diffMs = new Date(iso).getTime() - now.getTime();
  if (diffMs <= 0) return "Toplantı zamanı geldi";
  const minutes = Math.ceil(diffMs / 60_000);
  if (minutes < 60) return `Toplantıya ${minutes} dakikadan az kaldı`;
  const hours = Math.ceil(diffMs / 3_600_000);
  if (hours < 48) return `Toplantıya ${hours} saatten az kaldı`;
  const days = Math.ceil(diffMs / 86_400_000);
  return `Toplantıya ${days} günden az kaldı`;
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
