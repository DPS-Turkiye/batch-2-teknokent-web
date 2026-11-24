import type { MentorAvailabilitySlot } from "@/interfaces/mentor";
import { formatDayMonth } from "@/lib/utils";

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

export function upcomingPreferenceDays(
  now = new Date(),
  count = 14,
  locale = "tr",
) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const label = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    weekday: "long",
  });
  return Array.from({ length: count }, (_, offset) => {
    const day = new Date(start);
    day.setDate(start.getDate() + offset);
    return { value: toDateInputValue(day), label: label.format(day) };
  });
}

/** "12 Pzt" / "12 Mon" */
export function slotDayLabel(startsAt: string | Date, locale = "tr") {
  const date = typeof startsAt === "string" ? new Date(startsAt) : startsAt;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    weekday: "short",
  }).format(date);
}

/** "14:15" in every language: the slot chips are too narrow for "02:15 PM". */
export function slotTimeLabel(startsAt: string, locale = "tr") {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(startsAt));
}

export function availabilityColumns(
  slots: readonly MentorAvailabilitySlot[],
  now = new Date(),
  columnCount = 5,
  locale = "tr",
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
      label: slotDayLabel(day, locale),
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

/** Free slots grouped by local day, soonest first: pick a day, then a time. */
export function slotsByDay(
  slots: readonly MentorAvailabilitySlot[],
  locale = "tr",
) {
  const days = new Map<
    string,
    { key: string; label: string; slots: MentorAvailabilitySlot[] }
  >();
  const free = slots
    .filter((slot) => !slot.booked)
    .sort(
      (left, right) => Date.parse(left.startsAt) - Date.parse(right.startsAt),
    );
  for (const slot of free) {
    const key = dateFromStartsAt(slot.startsAt);
    const day = days.get(key) ?? {
      key,
      label: slotDayLabel(slot.startsAt, locale),
      slots: [],
    };
    day.slots.push(slot);
    days.set(key, day);
  }
  return [...days.values()];
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

/** "12 Ekim Pazartesi · 10:30"; Turkish by default because message lines are saved with it. */
export function formatPreferredSlot(slot: PreferredSlot, locale = "tr") {
  const date = parseLocalDate(slot.date);
  if (!date || !isHalfOrFullHour(slot.time)) return "";
  const day = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    weekday: "long",
  }).format(date);
  return `${day} · ${slot.time}`;
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

/** Why a request's preferred times cannot be sent yet, so the dialog can say it instead of only greying out Gönder. */
export enum PreferredSlotsIssue {
  Missing = "missing",
  Incomplete = "incomplete",
  TooSoon = "too-soon",
  Duplicate = "duplicate",
}

/** Null when the times can be sent; the same rule as `hasPreferredSlots`. */
export function preferredSlotsIssue(
  slots: readonly PreferredSlot[],
): PreferredSlotsIssue | null {
  if (hasPreferredSlots(slots)) return null;
  const valid = slots.filter(isValidPreferredSlot);
  if (valid.some((slot) => !isBookableSlot(slot))) {
    return PreferredSlotsIssue.TooSoon;
  }
  if (valid.length > 0) return PreferredSlotsIssue.Duplicate;
  if (slots.some((slot) => slot.date || slot.time)) {
    return PreferredSlotsIssue.Incomplete;
  }
  return PreferredSlotsIssue.Missing;
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
  const date = match?.[1];
  const time = match?.[2];
  if (!date || !time) return null;
  return { date, time };
}

export function preferredSlotsMessageLines(slots: readonly PreferredSlot[]) {
  const valid = slots.filter(isValidPreferredSlot);
  if (valid.length === 0) return [];
  return [
    `${PREFERRED_TIMES_LINE_PREFIX} ${valid.map((slot) => formatPreferredSlot(slot)).join(", ")}`,
    `${PREFERRED_SLOTS_LINE_PREFIX}${valid.map(preferredSlotMachineValue).join(",")}`,
  ];
}

export function proposedSlotsMessageLines(slots: readonly PreferredSlot[]) {
  const valid = slots.filter(isValidPreferredSlot);
  if (valid.length === 0) return [];
  return [
    `${PROPOSED_TIMES_LINE_PREFIX} ${valid.map((slot) => formatPreferredSlot(slot)).join(", ")}`,
    `${PROPOSED_SLOTS_LINE_PREFIX}${valid.map(preferredSlotMachineValue).join(",")}`,
  ];
}

/**
 * The mentor's "Kendi saatimi öner" message. It is sent in the mentor's name and saved for the mentee to read, so
 * it stays polite and Turkish; it only mentions the mentee's times when the request has some.
 */
export function counterProposalMessage(
  requesterMessage: string | null | undefined,
  slots: readonly PreferredSlot[],
) {
  const hasPreferredTimes =
    parsePreferredSlotsFromMessage(requesterMessage).length > 0;
  return [
    hasPreferredTimes
      ? "Önerdiğiniz saatlerde maalesef uygun değilim. Sizin için de uygunsa aşağıdaki saatlerden birinde görüşebiliriz."
      : "Görüşme için aşağıdaki saatleri öneriyorum. Sizin için uygun olan birinde görüşebiliriz.",
    ...proposedSlotsMessageLines(slots),
  ].join("\n");
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
  if (hours === undefined || minutes === undefined) return null;
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

/** Saved on the request, so it stays Turkish; the backend books exactly the slot named after it. */
export const CHOSEN_SLOT_MESSAGE_PREFIX = "Görüşme saati:";

/** The accept message that names the time the mentor picked, e.g. "Görüşme saati: 2026-11-24T10:00". */
export function chosenSlotDecisionMessage(slot: PreferredSlot) {
  return `${CHOSEN_SLOT_MESSAGE_PREFIX} ${preferredSlotMachineValue(slot)}`;
}

/** "24 Kas 10:00–10:45": a slot with the meeting's length, as a mentor confirms it. */
export function preferredSlotRangeLabel(
  slot: PreferredSlot,
  durationMinutes: number,
  locale = "tr",
) {
  const startsAt = preferredSlotStartsAt(slot);
  if (!startsAt) return "";
  const start = new Date(startsAt);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const time = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${formatDayMonth(start, locale)} ${time.format(start)}–${time.format(end)}`;
}

export type DecisionSlotOption = {
  key: string;
  slot: PreferredSlot;
  label: string;
  /** False for a time that has passed or was only written as text, which can't be booked. */
  available: boolean;
};

/** A dated slot that hasn't started yet; a time written only as text never is. */
export function isUpcomingSlot(slot: PreferredSlot, now: Date) {
  const startsAt = preferredSlotStartsAt(slot);
  return startsAt !== null && new Date(startsAt).getTime() > now.getTime();
}

/** The mentee's preferred times as choices for the mentor's accept, in the order the mentee gave them. */
export function decisionSlotOptions(
  message: string | null | undefined,
  durationMinutes: number,
  now: Date,
  locale = "tr",
): DecisionSlotOption[] {
  const options = parsePreferredSlotsFromMessage(message, locale).map(
    (slot) => ({
      key: slot.date ? preferredSlotKey(slot) : slot.label,
      slot: { date: slot.date, time: slot.time },
      label:
        preferredSlotRangeLabel(slot, durationMinutes, locale) || slot.label,
      available: isUpcomingSlot(slot, now),
    }),
  );
  return options.filter(
    (option, index) =>
      options.findIndex((other) => other.key === option.key) === index,
  );
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
  locale = "tr",
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
      .map((slot) => ({ ...slot, label: formatPreferredSlot(slot, locale) }));
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
  locale = "tr",
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
      .map((slot) => ({ ...slot, label: formatPreferredSlot(slot, locale) }));
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
