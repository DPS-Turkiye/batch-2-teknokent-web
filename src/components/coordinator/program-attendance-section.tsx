// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useLocale, useTranslations } from "next-intl";

import { EmptyNote, Panel, QueryNotice } from "@/components/admin/admin-ui";
import { useProgramAttendance } from "@/hooks/use-program-attendance";
import { SessionsExportFormat } from "@/interfaces/program-report";
import { calendarDay, formatDayMonth } from "@/lib/utils";

const linkClass =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-full border border-[#e9ecef] bg-white px-3.5 text-[12.5px] font-medium text-[#22262b] aria-disabled:pointer-events-none aria-disabled:text-[#aeb4bc]";
const inputClass =
  "h-9 rounded-xl border border-[#e4e7ea] bg-white px-3 text-[13px] text-[#22262b] outline-none focus:border-[#26a4ff]";

/** Weekly attendance per participant, next to the sessions report, with the same file formats. */
export function ProgramAttendanceSection({ programId }: { programId: string }) {
  const t = useTranslations("programReport.attendance");
  const locale = useLocale();
  const attendance = useProgramAttendance(programId);
  const data = attendance.query.data;
  const xlsx = attendance.exportHref(SessionsExportFormat.Xlsx);
  const csv = attendance.exportHref(SessionsExportFormat.Csv);
  const day = (value: string) => formatDayMonth(calendarDay(value), locale);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-semibold text-[#22262b]">
            {t("title")}
          </h2>
          <p className="mt-1 max-w-[560px] text-[12.5px] text-[#676e78]">
            {t("hint")}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-[12px] text-[#676e78]">
            {t("from")}
            <input
              type="date"
              value={attendance.from}
              onChange={(event) => attendance.setFrom(event.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-[12px] text-[#676e78]">
            {t("to")}
            <input
              type="date"
              value={attendance.to}
              onChange={(event) => attendance.setTo(event.target.value)}
              className={inputClass}
            />
          </label>
          {attendance.filtered ? (
            <button
              type="button"
              onClick={attendance.clear}
              className={linkClass}
            >
              {t("wholeProgram")}
            </button>
          ) : null}
          <a href={xlsx} download aria-disabled={!xlsx} className={linkClass}>
            {t("downloadXlsx")}
          </a>
          <a href={csv} download aria-disabled={!csv} className={linkClass}>
            {t("downloadCsv")}
          </a>
        </div>
      </div>

      {!attendance.valid ? (
        <p role="alert" className="text-sm text-[#d9464b]">
          {t("rangeInvalid")}
        </p>
      ) : !data ? (
        <QueryNotice
          isLoading={attendance.query.isLoading}
          error={attendance.query.error}
        />
      ) : (
        <Panel>
          {data.weeks.length === 0 ? (
            <EmptyNote>{t("noWeeks")}</EmptyNote>
          ) : data.participants.length === 0 ? (
            <EmptyNote>{t("noParticipants")}</EmptyNote>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-[13px]">
                <thead className="text-[12px] text-[#858c96]">
                  <tr>
                    <th scope="col" className="px-5 py-2 font-medium">
                      {t("name")}
                    </th>
                    <th scope="col" className="px-5 py-2 font-medium">
                      {t("team")}
                    </th>
                    {data.weeks.map((week) => (
                      <th
                        key={week.number}
                        scope="col"
                        className="px-3 py-2 text-center font-medium"
                      >
                        {t("week", { week: week.number })}
                        <span className="block text-[11px] font-normal whitespace-nowrap">
                          {`${day(week.start)} – ${day(week.end)}`}
                        </span>
                      </th>
                    ))}
                    <th
                      scope="col"
                      className="px-5 py-2 text-right font-medium"
                    >
                      {t("attendedWeeks")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.participants.map((person) => (
                    <tr
                      key={`${person.email ?? ""}:${person.name}`}
                      className="border-t border-[#f1f3f5]"
                    >
                      <th
                        scope="row"
                        className="px-5 py-2.5 text-left font-normal text-[#22262b]"
                      >
                        {person.name}
                      </th>
                      <td className="px-5 py-2.5 text-[#676e78]">
                        {person.teamName ?? "—"}
                      </td>
                      {person.attended.map((attended, index) => (
                        <td
                          key={data.weeks[index]?.number ?? index}
                          className="px-3 py-2.5 text-center"
                        >
                          <span
                            aria-hidden
                            className={
                              attended ? "text-[#1f7a4d]" : "text-[#c0c5cc]"
                            }
                          >
                            {attended ? "✓" : "–"}
                          </span>
                          <span className="sr-only">
                            {attended ? t("present") : t("absent")}
                          </span>
                        </td>
                      ))}
                      <td className="px-5 py-2.5 text-right">
                        {person.attendedWeeks}/{data.weeks.length}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[#e9ecef] text-[12.5px] text-[#676e78]">
                    <th
                      scope="row"
                      colSpan={2}
                      className="px-5 py-2.5 font-medium"
                    >
                      {t("rate")}
                    </th>
                    {data.weeks.map((week) => (
                      <td key={week.number} className="px-3 py-2.5 text-center">
                        {week.rate == null
                          ? "—"
                          : t("percent", { rate: week.rate })}
                      </td>
                    ))}
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Panel>
      )}
    </section>
  );
}
