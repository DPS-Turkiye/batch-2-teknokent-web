"use client";

import type { ReactNode } from "react";

/**
 * The hourly week grid, shared by the mentor and mentee calendars. Pulled out
 * of the mentor page as a pure extraction — same markup, same classes — so it
 * could be reused for the mentee's 7-day/9–21h grid without risking the
 * mentor's existing behaviour. Cell content is fully owned by the caller: a
 * meeting bubble, an empty-slot button, or whatever the page needs, since
 * mentor and mentee cells trigger different things on click.
 */
export function WeekGridTable({
  days,
  hours,
  dayLabels,
  renderCell,
}: {
  days: Date[];
  hours: number[];
  dayLabels: readonly string[];
  renderCell: (day: Date, hour: number) => ReactNode;
}) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-xs">
        <thead>
          <tr>
            <th className="w-14" />
            {days.map((day, index) => (
              <th
                key={day.toISOString()}
                scope="col"
                className="border-b border-[#e4e7ea] pb-2 font-medium text-[#676e78]"
              >
                {dayLabels[index]} {day.getDate()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hours.map((hour) => (
            <tr key={hour}>
              <th
                scope="row"
                className="pr-2 text-right align-top font-normal text-[#a4aab2]"
              >
                {String(hour).padStart(2, "0")}:00
              </th>
              {days.map((day) => (
                <td
                  key={day.toISOString() + hour}
                  className="h-[4.25rem] w-[18%] border border-[#f1f2f4] p-1 align-top"
                >
                  {renderCell(day, hour)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
