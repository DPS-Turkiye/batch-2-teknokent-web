"use client";

import { useLocale, useTranslations } from "next-intl";

import type { MentorAvailabilitySlot } from "@/interfaces/mentor";
import {
  assignPreferredSlot,
  availabilityColumns,
  isHalfOrFullHour,
  preferredSlotKey,
  slotFromStartsAt,
  slotTimeLabel,
  upcomingPreferenceDays,
  type PreferredSlot,
} from "@/lib/mentor-availability-days";

/**
 * Up to three times, picked from open slots or typed in, the way a mentee picks times for a mentor. Used by the
 * student's request and the academic's counter-proposal.
 */
export function PreferredTimesPicker({
  slots,
  value,
  onChange,
}: {
  slots: MentorAvailabilitySlot[];
  value: PreferredSlot[];
  onChange: (next: PreferredSlot[]) => void;
}) {
  const t = useTranslations("officeHours.booking.dialog");
  const locale = useLocale();
  const columns = availabilityColumns(slots, new Date(), 5, locale);
  const dayOptions = upcomingPreferenceDays(new Date(), 14, locale);

  function update(index: number, patch: Partial<PreferredSlot>) {
    onChange(
      value.map((slot, slotIndex) =>
        slotIndex === index ? { ...slot, ...patch } : slot,
      ),
    );
  }

  return (
    <section className="rounded-[10px] border border-[#e4e7ea] bg-white p-4">
      <h3 className="text-sm font-medium text-[#22262b]">
        {t("availability")}
      </h3>
      <p className="mt-1 text-xs text-[#858c96]">{t("nextDays")}</p>
      {columns.length === 0 ? (
        <p className="mt-3 text-sm text-[#676e78]">{t("noSlots")}</p>
      ) : (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {columns.map((column, index) => (
            <div
              key={column.key}
              className={`flex min-w-[58px] flex-1 flex-col items-center ${index > 0 ? "border-l border-[#e4e7ea] pl-2" : ""}`}
            >
              <p className="text-[11px] font-medium text-[#676e78]">
                {column.label}
              </p>
              <div className="mt-2 flex w-full flex-col gap-1.5">
                {column.slots.map((slot) => {
                  const preference = slotFromStartsAt(slot.startsAt);
                  const selected = value.some(
                    (item) =>
                      preferredSlotKey(item) === preferredSlotKey(preference),
                  );
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        if (!isHalfOrFullHour(preference.time)) return;
                        onChange(assignPreferredSlot(value, preference));
                      }}
                      className={`min-h-7 rounded-full px-1 text-[11px] font-medium ${selected ? "bg-[#e86f22] text-white" : "border border-[#e86f22] bg-white text-[#e86f22]"}`}
                    >
                      {slotTimeLabel(slot.startsAt, locale)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 border-t border-[#e4e7ea] pt-3">
        <p className="text-xs font-medium text-[#22262b]">
          {t("enterPreference")}
        </p>
        <p className="mt-1 text-[11px] text-[#858c96]">{t("preferenceHint")}</p>
        <div className="mt-2 grid gap-2">
          {value.map((slot, index) => (
            <div
              key={index}
              className="flex flex-wrap items-center gap-2 text-xs text-[#676e78]"
            >
              <span className="w-16">
                {t("preference", { number: index + 1 })}
              </span>
              <select
                value={slot.date}
                aria-label={t("preferenceDay", { number: index + 1 })}
                onChange={(event) =>
                  update(index, { date: event.target.value })
                }
                className="min-h-9 min-w-[132px] flex-1 rounded-lg border border-[#d4d8dd] px-2.5 text-sm text-[#22262b] outline-none"
              >
                <option value="">{t("pickDay")}</option>
                {dayOptions.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
              <input
                type="time"
                step={1800}
                value={slot.time}
                aria-label={t("preferenceTime", { number: index + 1 })}
                onChange={(event) =>
                  update(index, { time: event.target.value })
                }
                className="min-h-9 w-[110px] rounded-lg border border-[#d4d8dd] px-2.5 text-sm text-[#22262b] outline-none"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
