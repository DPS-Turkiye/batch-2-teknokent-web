import type { MentorAvailabilitySlot } from "@/interfaces/mentor";
import type { OfficeHoursSlot } from "@/interfaces/office-hours";
import {
  formatPreferredSlot,
  parsePreferredSlotMachineValue,
  preferredSlotMachineValue,
  slotFromStartsAt,
} from "@/lib/mentor-availability-days";

/** Office-hours slots in the shape the mentor slot columns read. */
export function asAvailabilitySlots(
  slots: readonly OfficeHoursSlot[],
): MentorAvailabilitySlot[] {
  return slots.map((slot) => ({
    id: slot.startsAt,
    startsAt: slot.startsAt,
    durationMinutes: slot.durationMinutes,
    booked: false,
  }));
}

/** "2026-11-24T14:00" → "24 Kasım Salı · 14:00"; the raw value when it can't be read. */
export function slotLabel(machine: string, locale: string) {
  const slot = parsePreferredSlotMachineValue(machine);
  return (slot && formatPreferredSlot(slot, locale)) || machine;
}

/** An instant as the same machine value requests carry. */
export function machineSlotFromInstant(startsAt: string) {
  return preferredSlotMachineValue(slotFromStartsAt(startsAt));
}

export function meetingTimeLabel(startsAt: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(startsAt));
}
