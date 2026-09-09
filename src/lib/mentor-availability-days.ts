import type { MentorAvailabilitySlot } from "@/interfaces/mentor";

const WEEKDAY_SHORT = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

export function slotDayLabel(startsAt: string | Date) {
  const date = typeof startsAt === "string" ? new Date(startsAt) : startsAt;
  return `${date.getDate()} ${WEEKDAY_SHORT[date.getDay()]}`;
}

export function slotTimeLabel(startsAt: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(startsAt));
}

export function availabilityColumns(
  slots: readonly MentorAvailabilitySlot[],
  now = new Date(),
  columnCount = 5,
) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const free = slots
    .filter((slot) => !slot.booked && new Date(slot.startsAt) >= now)
    .sort(
      (left, right) =>
        new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
    );

  const columns: Array<{
    key: string;
    label: string;
    slots: MentorAvailabilitySlot[];
  }> = [];

  for (
    let offset = 0;
    offset < 14 && columns.length < columnCount;
    offset += 1
  ) {
    const day = new Date(start);
    day.setDate(start.getDate() + offset);
    const next = new Date(day);
    next.setDate(day.getDate() + 1);
    const daySlots = free.filter((slot) => {
      const at = new Date(slot.startsAt);
      return at >= day && at < next;
    });
    if (daySlots.length === 0) continue;
    columns.push({
      key: day.toISOString(),
      label: slotDayLabel(day),
      slots: daySlots.slice(0, 5),
    });
  }

  return columns;
}

export const PREFERRED_SLOT_COUNT = 3;

export function timeFromStartsAt(startsAt: string) {
  const date = new Date(startsAt);
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

export function isHalfOrFullHour(value: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)/.exec(value.trim());
  if (!match) return false;
  const minute = Number(match[2]);
  return minute === 0 || minute === 30;
}

export function hasThreeHalfHourTimes(times: readonly string[]) {
  const valid = [
    ...new Set(
      times
        .map((time) => {
          const match = /^([01]\d|2[0-3]):([0-5]\d)/.exec(time.trim());
          if (!match) return "";
          const minute = Number(match[2]);
          if (minute !== 0 && minute !== 30) return "";
          return `${match[1]}:${match[2]}`;
        })
        .filter(Boolean),
    ),
  ];
  return valid.length === PREFERRED_SLOT_COUNT;
}

export function assignPreferredTime(
  times: readonly string[],
  time: string,
): string[] {
  const next = [
    ...times,
    ...Array(Math.max(0, PREFERRED_SLOT_COUNT - times.length)).fill(""),
  ].slice(0, PREFERRED_SLOT_COUNT);
  const existing = next.indexOf(time);
  if (existing >= 0) {
    next[existing] = "";
    return next;
  }
  const empty = next.findIndex((item) => !item);
  if (empty >= 0) {
    next[empty] = time;
    return next;
  }
  next[PREFERRED_SLOT_COUNT - 1] = time;
  return next;
}
