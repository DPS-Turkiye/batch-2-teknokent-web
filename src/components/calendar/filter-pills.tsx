"use client";

import { CalendarFilter, CALENDAR_FILTER_LABELS } from "@/lib/calendar";

export function FilterPills({
  filter,
  options,
  onChange,
}: {
  filter: CalendarFilter;
  options: CalendarFilter[];
  onChange: (filter: CalendarFilter) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={filter === option}
          className={`rounded-full border px-3 py-[5px] text-xs font-medium leading-[17px] transition ${
            filter === option
              ? "border-[#f6c9a5] bg-[#fff4ec] text-[#c95c18]"
              : "border-[#e4e7ea] bg-[#f3f4f6] text-[#676e78] hover:text-[#22262b]"
          }`}
        >
          {CALENDAR_FILTER_LABELS[option]}
        </button>
      ))}
    </div>
  );
}
