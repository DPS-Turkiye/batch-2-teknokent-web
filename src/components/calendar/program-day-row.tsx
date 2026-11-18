"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.
import { useLocale, useTranslations } from "next-intl";

import {
  ProgramCalendarEntryKind,
  type MemberProgramEvent,
} from "@/interfaces/coordinator-program";
import { shortWeekday } from "@/lib/calendar";
import {
  programEntryKindLabel,
  programEntryTime,
} from "@/lib/program-calendar";

const KIND_STYLES: Record<ProgramCalendarEntryKind, string> = {
  [ProgramCalendarEntryKind.Session]:
    "border-[#bfe3dd] bg-[#eef8f6] text-[#1a5f56]",
  [ProgramCalendarEntryKind.SpecialDay]:
    "border-[#d9d0fb] bg-[#f4f1fe] text-[#4a2fb8]",
  [ProgramCalendarEntryKind.Event]:
    "border-[#e4e7ea] bg-[#f3f4f6] text-[#3d434b]",
  [ProgramCalendarEntryKind.Deadline]:
    "border-[#f2ddbe] bg-[#fef6ec] text-[#8a4a10]",
};

const OWN_GRID = "grid grid-cols-[52px_repeat(7,minmax(0,1fr))] text-[11px]";

/**
 * A row of each day's program entries above a week's hour grid. An hour cell holds one meeting, and an all-day
 * lesson has no hour, so the plan's entries get a row of their own. `embedded` places the cells straight into a
 * surrounding `grid-cols-[52px_repeat(7,1fr)]` grid; otherwise the row lays out its own matching columns.
 */
export function ProgramDayRow({
  label,
  days,
  eventsByDay,
  onSelect,
  embedded = false,
}: {
  label: string;
  days: Date[];
  eventsByDay: MemberProgramEvent[][];
  onSelect: (event: MemberProgramEvent) => void;
  embedded?: boolean;
}) {
  const t = useTranslations("programCalendar");
  const locale = useLocale();
  return (
    <div className={embedded ? "contents" : OWN_GRID}>
      <div className="flex items-start justify-end pr-2 pt-1.5 text-[#676e78]">
        {label}
      </div>
      {days.map((day, index) => {
        const events = eventsByDay[index] ?? [];
        return (
          <div
            key={day.toISOString()}
            className="min-w-0 border-l border-t border-[#eef0f3] p-1"
          >
            {events.length > 0 ? (
              <ul
                aria-label={`${label} · ${shortWeekday(day, locale)} ${day.getDate()}`}
                className="space-y-1"
              >
                {events.map((event) => (
                  <li key={event.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(event)}
                      aria-label={t("openDetail", {
                        title: `${programEntryKindLabel(event.kind, t)}: ${event.title}`,
                      })}
                      className={`block w-full overflow-hidden rounded-md border px-1.5 py-1 text-left leading-[14px] ${KIND_STYLES[event.kind]}`}
                    >
                      <span className="block truncate text-[10px]">
                        {programEntryKindLabel(event.kind, t)}
                      </span>
                      <b className="block truncate text-[10.5px] font-semibold">
                        {event.title}
                      </b>
                      <span className="block truncate text-[10px]">
                        {programEntryTime(event, locale, t)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
