"use client";

import type { MeetingItem } from "@/interfaces/meeting";
import { DAY_SHORT_LABELS } from "@/lib/calendar";
import {
  type CalendarEntry,
  CalendarEntryKind,
  DAY_HEADER_HEIGHT,
  eventBox,
  HOUR_ROW_HEIGHT,
} from "@/lib/mentee-calendar";

const EVENT_STYLES: Record<CalendarEntryKind, string> = {
  [CalendarEntryKind.Mentorship]: "bg-[#e86f22] text-white hover:bg-[#ce5e19]",
  [CalendarEntryKind.Program]:
    "border border-[#e4e7ea] bg-[#f3f4f6] text-[#4a5059]",
  [CalendarEntryKind.Deliverable]:
    "border border-[#f2ddbe] bg-[#fef6ec] text-[#a65a15]",
};

export function MenteeWeekGrid({
  days,
  hours,
  entriesByDay,
  today,
  onSelectMeeting,
}: {
  days: Date[];
  hours: readonly number[];
  entriesByDay: CalendarEntry[][];
  today: Date;
  onSelectMeeting: (meeting: MeetingItem) => void;
}) {
  const columnHeight = DAY_HEADER_HEIGHT + hours.length * HOUR_ROW_HEIGHT;

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[600px]">
        <div className="w-[52px] shrink-0" style={{ height: columnHeight }}>
          <div style={{ height: DAY_HEADER_HEIGHT }} />
          {hours.map((hour) => (
            <p
              key={hour}
              className="pr-2 text-right text-[11px] leading-[15px] text-[#858c96]"
              style={{ height: HOUR_ROW_HEIGHT }}
            >
              {`${String(hour).padStart(2, "0")}:00`}
            </p>
          ))}
        </div>

        {days.map((day, index) => {
          const isToday = day.toDateString() === today.toDateString();
          return (
            <div
              key={day.toISOString()}
              className="relative min-w-0 flex-1"
              style={{ height: columnHeight }}
            >
              <div
                className="flex items-center justify-center gap-[5px]"
                style={{ height: DAY_HEADER_HEIGHT }}
              >
                <span className="text-[11.5px] leading-4 text-[#676e78]">
                  {DAY_SHORT_LABELS[index]}
                </span>
                <span
                  className={`text-[13px] leading-[18px] ${isToday ? "font-semibold text-[#c95c18]" : "font-medium text-[#22262b]"}`}
                >
                  {day.getDate()}
                </span>
              </div>
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="border-l border-t border-[#eef0f3]"
                  style={{ height: HOUR_ROW_HEIGHT }}
                />
              ))}

              {entriesByDay[index].map((entry) => {
                const box = eventBox(entry);
                if (!box) return null;
                const className = `absolute inset-x-1 overflow-hidden rounded-[6px] px-2 py-1.5 text-left text-[11px] leading-[15px] ${EVENT_STYLES[entry.kind]}`;
                const style = { top: box.top, height: box.height };
                const meeting = entry.meeting;
                if (meeting) {
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => onSelectMeeting(meeting)}
                      aria-label={`${entry.title} detayını aç`}
                      className={className}
                      style={style}
                    >
                      <span className="block truncate font-semibold">
                        {entry.gridLabel}
                      </span>
                    </button>
                  );
                }
                return (
                  <div
                    key={entry.id}
                    title={entry.title}
                    className={className}
                    style={style}
                  >
                    <span className="block truncate font-semibold">
                      {entry.gridLabel}
                    </span>
                    {entry.kind === CalendarEntryKind.Program ? (
                      <span className="block truncate text-[10.5px] text-[#676e78]">
                        {entry.title}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
