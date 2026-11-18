"use client";

import { useLocale, useTranslations } from "next-intl";

import { ProgramDayRow } from "@/components/calendar/program-day-row";
import {
  ProgramCalendarEntryKind,
  type MemberProgramEvent,
} from "@/interfaces/coordinator-program";
import type { MeetingItem } from "@/interfaces/meeting";
import { shortWeekday } from "@/lib/calendar";
import {
  CalendarEntryKind,
  DAY_HEADER_HEIGHT,
  HOUR_ROW_HEIGHT,
  layoutDay,
  type CalendarEntry,
} from "@/lib/mentee-calendar";

const EVENT_STYLES: Record<CalendarEntryKind, string> = {
  [CalendarEntryKind.Mentorship]: "bg-[#e86f22] text-white hover:bg-[#ce5e19]",
  [CalendarEntryKind.Program]:
    "border border-[#e4e7ea] bg-[#f3f4f6] text-[#4a5059]",
  [CalendarEntryKind.Deliverable]:
    "border border-[#f2ddbe] bg-[#fef6ec] text-[#a65a15]",
};

// TEST UI: placeholder until the design team's screen; replace when it arrives.
// The weekly plan's sessions get a teal edge so they read apart from the program's own events.
const PROGRAM_KIND_STYLES: Record<ProgramCalendarEntryKind, string> = {
  [ProgramCalendarEntryKind.Session]: "border-l-[3px] border-l-[#2f8f83]",
  [ProgramCalendarEntryKind.SpecialDay]: "border-l-[3px] border-l-[#7a5af5]",
  [ProgramCalendarEntryKind.Event]: "",
  [ProgramCalendarEntryKind.Deadline]: "border-l-[3px] border-l-[#b7791f]",
};

export function MenteeWeekGrid({
  days,
  hours,
  entriesByDay,
  today,
  onSelectMeeting,
  onSelectProgramEvent,
  allDayByDay,
}: {
  days: Date[];
  hours: readonly number[];
  entriesByDay: CalendarEntry[][];
  /** Each day's all-day program entries, drawn in a row above the hours. */
  allDayByDay: MemberProgramEvent[][];
  today: Date;
  onSelectMeeting: (meeting: MeetingItem) => void;
  onSelectProgramEvent: (event: MemberProgramEvent) => void;
}) {
  const t = useTranslations("calendar");
  const tProgram = useTranslations("programCalendar");
  const locale = useLocale();
  const columnHeight = DAY_HEADER_HEIGHT + hours.length * HOUR_ROW_HEIGHT;

  return (
    <div className="overflow-x-auto">
      {/* TEST UI: placeholder until the design team's screen; replace when it arrives. */}
      {allDayByDay.some((events) => events.length > 0) ? (
        <div className="min-w-[760px]">
          <ProgramDayRow
            label={tProgram("allDay")}
            days={days}
            eventsByDay={allDayByDay}
            onSelect={onSelectProgramEvent}
          />
        </div>
      ) : null}
      <div className="flex min-w-[760px]">
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
                  {shortWeekday(day, locale)}
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

              {layoutDay(entriesByDay[index] ?? []).map(
                ({ entry, top, height, lane, lanes }) => {
                  const className = `absolute overflow-hidden rounded-[6px] px-2 py-1.5 text-left text-[11px] leading-[15px] ${EVENT_STYLES[entry.kind]}`;
                  const style = {
                    top,
                    height,
                    left: `calc(${(lane / lanes) * 100}% + 4px)`,
                    width: `calc(${100 / lanes}% - 8px)`,
                  };
                  const meeting = entry.meeting;
                  const programEvent = entry.programEvent;
                  // TEST UI: placeholder until the design team's screen; replace when it arrives.
                  if (programEvent) {
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => onSelectProgramEvent(programEvent)}
                        aria-label={tProgram("openDetail", {
                          title: `${entry.gridLabel}: ${entry.title}`,
                        })}
                        className={`${className} ${PROGRAM_KIND_STYLES[programEvent.kind]}`}
                        style={style}
                      >
                        <span className="block truncate font-semibold">
                          {entry.gridLabel}
                        </span>
                        <span className="block truncate text-[10.5px] text-[#676e78]">
                          {entry.title}
                        </span>
                      </button>
                    );
                  }
                  if (meeting) {
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => onSelectMeeting(meeting)}
                        aria-label={t("openDetail", { title: entry.title })}
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
                      <span className="sr-only">{`${entry.gridLabel}: ${entry.title}`}</span>
                      <span
                        aria-hidden
                        className="block truncate font-semibold"
                      >
                        {entry.gridLabel}
                      </span>
                      {entry.kind === CalendarEntryKind.Program ? (
                        <span
                          aria-hidden
                          className="block truncate text-[10.5px] text-[#676e78]"
                        >
                          {entry.title}
                        </span>
                      ) : null}
                    </div>
                  );
                },
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
