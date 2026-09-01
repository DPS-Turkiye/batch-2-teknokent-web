/** Shared Turkish calendar labels and date helpers used by the calendar views. */

export const DAY_SHORT_LABELS = [
  "Pzt",
  "Sal",
  "Çar",
  "Per",
  "Cum",
  "Cmt",
  "Paz",
] as const;

/** Monday–Friday, for the mentor week grid. */
export const WEEKDAY_SHORT_LABELS = DAY_SHORT_LABELS.slice(0, 5);

export const MONTH_LABELS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
] as const;

export function hourOf(iso: string) {
  return new Date(iso).getHours();
}

export function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isSameDay(iso: string, day: Date) {
  return new Date(iso).toDateString() === day.toDateString();
}

/** "31–4 Eylül" — the month comes from the last day so a spanning week reads correctly. */
export function weekRangeLabel(start: Date, end: Date) {
  return `${start.getDate()}–${end.getDate()} ${MONTH_LABELS[end.getMonth()]}`;
}
