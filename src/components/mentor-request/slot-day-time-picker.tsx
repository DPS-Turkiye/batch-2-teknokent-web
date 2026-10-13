"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import type { MentorAvailabilitySlot } from "@/interfaces/mentor";
import { slotsByDay, slotTimeLabel } from "@/lib/mentor-availability-days";

const chipClass =
  "rounded-lg border px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60";

/** The mentor's free slots as a day row, then that day's times. */
export function SlotDayTimePicker({
  slots,
  disabled,
  onPick,
}: {
  slots: readonly MentorAvailabilitySlot[];
  disabled: boolean;
  onPick: (slotId: string) => void;
}) {
  const t = useTranslations("mentorRequest.slots");
  const locale = useLocale();
  const days = slotsByDay(slots, locale);
  const [dayKey, setDayKey] = useState("");
  const day = days.find((candidate) => candidate.key === dayKey) ?? days[0];
  if (!day) return null;

  return (
    <div className="mt-4">
      <div
        role="group"
        aria-label={t("pickDay")}
        className="flex flex-wrap gap-2"
      >
        {days.map((candidate) => {
          const selected = candidate.key === day.key;
          return (
            <button
              key={candidate.key}
              type="button"
              aria-pressed={selected}
              onClick={() => setDayKey(candidate.key)}
              className={`${chipClass} ${
                selected
                  ? "border-[#555] bg-[#f3f4f6] text-[#111827]"
                  : "border-[#e5e7eb] bg-white text-[#555] hover:border-[#555]"
              }`}
            >
              {candidate.label}
            </button>
          );
        })}
      </div>
      <div
        role="group"
        aria-label={t("dayTimes", { day: day.label })}
        className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4"
      >
        {day.slots.map((slot) => (
          <button
            key={slot.id}
            type="button"
            disabled={disabled}
            onClick={() => onPick(slot.id)}
            className={`${chipClass} border-[#e5e7eb] bg-white text-left hover:border-[#555]`}
          >
            {t("slot", {
              time: slotTimeLabel(slot.startsAt, locale),
              minutes: slot.durationMinutes,
            })}
          </button>
        ))}
      </div>
    </div>
  );
}
