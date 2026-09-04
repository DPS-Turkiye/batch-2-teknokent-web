"use client";

import { CalendarFilter, CALENDAR_FILTER_LABELS } from "@/lib/calendar";

/** The Tümü/Mentorluk/Program filter row, shared by both calendars. */
export function FilterPills({
  filter,
  onChange,
}: {
  filter: CalendarFilter;
  onChange: (filter: CalendarFilter) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.values(CalendarFilter).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={filter === option}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
            filter === option
              ? "bg-[#e86f22] text-white"
              : "bg-[#fdebdd] text-[#b94f12] hover:bg-[#f8d5bd]"
          }`}
        >
          {CALENDAR_FILTER_LABELS[option]}
        </button>
      ))}
    </div>
  );
}
