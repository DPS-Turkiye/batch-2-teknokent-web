import type { MentorAvailabilitySlot } from "@/interfaces/mentor";

const WEEKDAY_SHORT = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
const WEEKDAY_LONG = [
  "Pazar",
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
];

export type PreferredSlot = {
  date: string;
  time: string;
};

export function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export function parseLocalDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function upcomingPreferenceDays(now = new Date(), count = 14) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, offset) => {
    const day = new Date(start);
    day.setDate(start.getDate() + offset);
    return {
      value: toDateInputValue(day),
      label: `${day.getDate()} ${WEEKDAY_LONG[day.getDay()]}`,
    };
  });
}

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

export function emptyPreferredSlot(): PreferredSlot {
  return { date: "", time: "" };
}

export function emptyPreferredSlots(): PreferredSlot[] {
  return Array.from({ length: PREFERRED_SLOT_COUNT }, emptyPreferredSlot);
}

export function timeFromStartsAt(startsAt: string) {
  const date = new Date(startsAt);
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

export function dateFromStartsAt(startsAt: string) {
  return toDateInputValue(new Date(startsAt));
}

export function slotFromStartsAt(startsAt: string): PreferredSlot {
  return {
    date: dateFromStartsAt(startsAt),
    time: timeFromStartsAt(startsAt),
  };
}

export function preferredSlotKey(slot: PreferredSlot) {
  return `${slot.date}T${slot.time}`;
}

export function isHalfOrFullHour(value: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)/.exec(value.trim());
  if (!match) return false;
  const minute = Number(match[2]);
  return minute === 0 || minute === 30;
}

/** Mirrors the backend's MeetingSlotTimes.MIN_BOOKING_LEAD. */
export const MIN_BOOKING_LEAD_HOURS = 4;

export function isValidPreferredSlot(slot: PreferredSlot) {
  return Boolean(parseLocalDate(slot.date)) && isHalfOrFullHour(slot.time);
}

/** Only for times being entered now; times already in a message stay readable. */
export function isBookableSlot(slot: PreferredSlot) {
  const startsAt = preferredSlotStartsAt(slot);
  return (
    startsAt !== null &&
    Date.parse(startsAt) >= Date.now() + MIN_BOOKING_LEAD_HOURS * 3_600_000
  );
}

/** The entered times, or none at all while any of them is too soon. */
function enteredSlots(slots: readonly PreferredSlot[]) {
  const valid = slots.filter(isValidPreferredSlot);
  return valid.every(isBookableSlot) ? valid : [];
}

export function formatPreferredSlot(slot: PreferredSlot) {
  const date = parseLocalDate(slot.date);
  if (!date || !isHalfOrFullHour(slot.time)) return "";
  const dayMonth = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
  }).format(date);
  return `${dayMonth} ${WEEKDAY_LONG[date.getDay()]} · ${slot.time}`;
}

export function hasPreferredSlots(slots: readonly PreferredSlot[]) {
  const valid = enteredSlots(slots);
  const unique = new Set(valid.map(preferredSlotKey)).size;
  return (
    valid.length >= 1 &&
    valid.length <= PREFERRED_SLOT_COUNT &&
    unique === valid.length
  );
}

export const PREFERRED_TIMES_LINE_PREFIX = "Tercih edilen saatler:";
export const PREFERRED_SLOTS_LINE_PREFIX = "preferredSlots:";
export const PROPOSED_TIMES_LINE_PREFIX = "Mentörün önerdiği saatler:";
export const PROPOSED_SLOTS_LINE_PREFIX = "proposedSlots:";
export const MAX_PROPOSED_SLOT_COUNT = 8;

export type ParsedPreferredSlot = PreferredSlot & { label: string };

export function preferredSlotMachineValue(slot: PreferredSlot) {
  return `${slot.date}T${slot.time}`;
}

export function parsePreferredSlotMachineValue(
  value: string,
): PreferredSlot | null {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/.exec(value.trim());
  if (!match) return null;
  return { date: match[1], time: match[2] };
}

export function preferredSlotsMessageLines(slots: readonly PreferredSlot[]) {
  const valid = slots.filter(isValidPreferredSlot);
  if (valid.length === 0) return [];
  return [
    `${PREFERRED_TIMES_LINE_PREFIX} ${valid.map(formatPreferredSlot).join(", ")}`,
    `${PREFERRED_SLOTS_LINE_PREFIX}${valid.map(preferredSlotMachineValue).join(",")}`,
  ];
}

export function proposedSlotsMessageLines(slots: readonly PreferredSlot[]) {
  const valid = slots.filter(isValidPreferredSlot);
  if (valid.length === 0) return [];
  return [
    `${PROPOSED_TIMES_LINE_PREFIX} ${valid.map(formatPreferredSlot).join(", ")}`,
    `${PROPOSED_SLOTS_LINE_PREFIX}${valid.map(preferredSlotMachineValue).join(",")}`,
  ];
}

export function hasProposedSlots(slots: readonly PreferredSlot[]) {
  const valid = enteredSlots(slots);
  const unique = new Set(valid.map(preferredSlotKey)).size;
  return (
    valid.length >= 1 &&
    valid.length <= MAX_PROPOSED_SLOT_COUNT &&
    unique === valid.length
  );
}

export function preferredSlotStartsAt(slot: PreferredSlot) {
  const date = parseLocalDate(slot.date);
  if (!date || !isHalfOrFullHour(slot.time)) return null;
  const [hours, minutes] = slot.time.split(":").map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

/** The message as people should read it: the machine-readable slot lines are for parsing only. */
export function withoutSlotLines(message: string) {
  return message
    .split(/\r?\n/)
    .filter(
      (line) =>
        !line.startsWith(PREFERRED_SLOTS_LINE_PREFIX) &&
        !line.startsWith(PROPOSED_SLOTS_LINE_PREFIX),
    )
    .join("\n")
    .trim();
}

export function parsePreferredSlotsFromMessage(
  message: string | null | undefined,
): ParsedPreferredSlot[] {
  if (!message) return [];
  const lines = message.split(/\r?\n/);
  const machine = lines.find((line) =>
    line.startsWith(PREFERRED_SLOTS_LINE_PREFIX),
  );
  if (machine) {
    return machine
      .slice(PREFERRED_SLOTS_LINE_PREFIX.length)
      .split(",")
      .map(parsePreferredSlotMachineValue)
      .filter((slot): slot is PreferredSlot => Boolean(slot))
      .filter(isValidPreferredSlot)
      .map((slot) => ({ ...slot, label: formatPreferredSlot(slot) }));
  }

  const human = lines.find((line) =>
    line.startsWith(PREFERRED_TIMES_LINE_PREFIX),
  );
  if (!human) return [];
  return human
    .slice(PREFERRED_TIMES_LINE_PREFIX.length)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((label) => {
      const time = /(\d{2}:\d{2})$/.exec(label)?.[1] ?? "";
      return { date: "", time, label };
    });
}

export function parseProposedSlotsFromMessage(
  message: string | null | undefined,
): ParsedPreferredSlot[] {
  if (!message) return [];
  const lines = message.split(/\r?\n/);
  const machine = lines.find((line) =>
    line.startsWith(PROPOSED_SLOTS_LINE_PREFIX),
  );
  if (machine) {
    return machine
      .slice(PROPOSED_SLOTS_LINE_PREFIX.length)
      .split(",")
      .map(parsePreferredSlotMachineValue)
      .filter((slot): slot is PreferredSlot => Boolean(slot))
      .filter(isValidPreferredSlot)
      .map((slot) => ({ ...slot, label: formatPreferredSlot(slot) }));
  }

  const human = lines.find((line) =>
    line.startsWith(PROPOSED_TIMES_LINE_PREFIX),
  );
  if (!human) return [];
  return human
    .slice(PROPOSED_TIMES_LINE_PREFIX.length)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((label) => {
      const time = /(\d{2}:\d{2})$/.exec(label)?.[1] ?? "";
      return { date: "", time, label };
    });
}

export function requestOutcomeFromMessage(message: string | null | undefined) {
  if (!message) return "";
  return message
    .split(/\r?\n/)
    .filter(
      (line) =>
        !line.startsWith(PREFERRED_TIMES_LINE_PREFIX) &&
        !line.startsWith(PREFERRED_SLOTS_LINE_PREFIX) &&
        !line.startsWith(PROPOSED_TIMES_LINE_PREFIX) &&
        !line.startsWith(PROPOSED_SLOTS_LINE_PREFIX),
    )
    .join("\n")
    .trim();
}

export function assignPreferredSlot(
  slots: readonly PreferredSlot[],
  slot: PreferredSlot,
): PreferredSlot[] {
  const next = [
    ...slots,
    ...Array.from(
      { length: Math.max(0, PREFERRED_SLOT_COUNT - slots.length) },
      emptyPreferredSlot,
    ),
  ].slice(0, PREFERRED_SLOT_COUNT);
  const key = preferredSlotKey(slot);
  const existing = next.findIndex((item) => preferredSlotKey(item) === key);
  if (existing >= 0) {
    next[existing] = emptyPreferredSlot();
    return next;
  }
  const empty = next.findIndex((item) => !isValidPreferredSlot(item));
  if (empty >= 0) {
    next[empty] = slot;
    return next;
  }
  next[PREFERRED_SLOT_COUNT - 1] = slot;
  return next;
}
