"use client";

import type { MeetingItem } from "@/interfaces/meeting";
import { DAY_SHORT_LABELS, isSameDay, monthGridCells } from "@/lib/calendar";

/**
 * A 7-wide month grid, shared by both calendars so mentors and mentees see the
 * same shape. Uses the app's own tokens (#e86f22 etc.), not the zinc/indigo
 * palette the old mentee-only month view had — that view predated the metual
 * redesign and never got carried over to it.
 */
export function MonthGrid({
  monthDate,
  meetings,
  onSelectMeeting,
}: {
  monthDate: Date;
  meetings: MeetingItem[];
  onSelectMeeting: (meeting: MeetingItem) => void;
}) {
  const cells = monthGridCells(monthDate);
  const today = new Date();

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e4e7ea] bg-white">
      <div className="grid grid-cols-7 border-b border-[#e4e7ea] bg-[#f8f9fa] text-center text-xs font-semibold text-[#676e78]">
        {DAY_SHORT_LABELS.map((label) => (
          <div key={label} className="py-2.5">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 divide-x divide-y divide-[#f1f2f4]">
        {cells.map(({ date, inCurrentMonth }) => {
          const dayMeetings = meetings.filter((meeting) =>
            isSameDay(meeting.scheduledAt, date),
          );
          const isToday = isSameDay(today.toISOString(), date);

          return (
            <div
              key={date.toISOString()}
              className={`min-h-24 p-2 ${inCurrentMonth ? "bg-white" : "bg-[#fafbfc]"}`}
            >
              <span
                className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold ${
                  isToday
                    ? "bg-[#e86f22] text-white"
                    : inCurrentMonth
                      ? "text-[#22262b]"
                      : "text-[#c3c8ce]"
                }`}
              >
                {date.getDate()}
              </span>

              <div className="mt-1.5 space-y-1">
                {dayMeetings.slice(0, 3).map((meeting) => (
                  <button
                    key={meeting.id}
                    type="button"
                    onClick={() => onSelectMeeting(meeting)}
                    aria-label={`${meeting.agenda ?? "Toplantı"} detayını aç`}
                    className="w-full truncate rounded-md bg-[#fdebdd] px-1.5 py-1 text-left text-[10px] font-semibold text-[#b94f12] hover:bg-[#f8d5bd]"
                  >
                    {meeting.agenda ?? "Toplantı"}
                  </button>
                ))}
                {dayMeetings.length > 3 ? (
                  <p className="px-1.5 text-[10px] text-[#a4aab2]">
                    +{dayMeetings.length - 3} daha
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
