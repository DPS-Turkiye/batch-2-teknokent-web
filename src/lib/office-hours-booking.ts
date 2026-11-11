import type { MentorAvailabilitySlot } from "@/interfaces/mentor";
import {
  OfficeHoursRole,
  type OfficeHoursPerson,
  type OfficeHoursSlot,
} from "@/interfaces/office-hours";
import {
  formatPreferredSlot,
  parsePreferredSlotMachineValue,
  preferredSlotMachineValue,
  slotFromStartsAt,
} from "@/lib/mentor-availability-days";

// A Record, so a new role fails to compile until it says whom it meets.
const COUNTERPART: Record<OfficeHoursRole, "student" | "instructor"> = {
  [OfficeHoursRole.Instructor]: "student",
  [OfficeHoursRole.Student]: "instructor",
};

export function counterpartOf(
  viewer: OfficeHoursRole,
  sides: { student: OfficeHoursPerson; instructor: OfficeHoursPerson },
) {
  return sides[COUNTERPART[viewer]];
}

// The mentor slot columns are reused for office hours, so the slots take their shape.
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

export function slotLabel(machine: string, locale: string) {
  const slot = parsePreferredSlotMachineValue(machine);
  return (slot && formatPreferredSlot(slot, locale)) || machine;
}

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
