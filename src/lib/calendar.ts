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

export const MEETING_PICKER_HOURS = Array.from({ length: 10 }, (_, i) => 9 + i);
export const MEETING_PICKER_DAY_COUNT = 5;

export type MeetingPickerColumn = {
  key: string;
  heading: string;
  slots: Date[];
};

function dayHeading(day: Date) {
  return `${day.getDate()} ${DAY_SHORT_LABELS[(day.getDay() + 6) % 7]}`;
}

/** Next few days, 09:00–18:00, including hours the mentor is not marked free. */
export function upcomingHourColumns(
  now = new Date(),
  dayCount = MEETING_PICKER_DAY_COUNT,
  hours = MEETING_PICKER_HOURS,
): MeetingPickerColumn[] {
  const columns: MeetingPickerColumn[] = [];
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  for (let offset = 0; columns.length < dayCount && offset < 14; offset += 1) {
    const day = new Date(cursor);
    day.setDate(cursor.getDate() + offset);
    const slots = hours
      .map((hour) => {
        const at = new Date(day);
        at.setHours(hour, 0, 0, 0);
        return at;
      })
      .filter((at) => at.getTime() > now.getTime());
    if (slots.length === 0) continue;
    columns.push({
      key: day.toDateString(),
      heading: dayHeading(day),
      slots,
    });
  }
  return columns;
}
