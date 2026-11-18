// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";

import { EmptyNote, Panel, QueryNotice } from "@/components/admin/admin-ui";
import { useProgramAttendance } from "@/hooks/use-program-attendance";
import { SessionsExportFormat } from "@/interfaces/program-report";

const linkClass =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-full border border-[#e9ecef] bg-white px-3.5 text-[12.5px] font-medium text-[#22262b] aria-disabled:pointer-events-none aria-disabled:text-[#aeb4bc]";
const inputClass =
  "h-9 rounded-xl border border-[#e4e7ea] bg-white px-3 text-[13px] text-[#22262b] outline-none focus:border-[#26a4ff]";

/**
 * Attendance per participant and session (each week's lesson and workshop), next to the sessions report, with the
 * same file formats. A coordinator marks or unmarks a current participant by clicking the cell.
 */
export function ProgramAttendanceSection({ programId }: { programId: string }) {
  const t = useTranslations("programReport.attendance");
  const attendance = useProgramAttendance(programId);
  const data = attendance.query.data;
  const xlsx = attendance.exportHref(SessionsExportFormat.Xlsx);
  const csv = attendance.exportHref(SessionsExportFormat.Csv);

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
          {data.attendanceEnabled ? null : (
            <p className="border-b border-[#f1f3f5] px-5 py-3 text-[12.5px] text-[#676e78]">
              {t("off")}
            </p>
          )}
          {data.sessions.length === 0 ? (
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
                    {data.sessions.map((session) => (
                      <th
                        key={`${session.week}:${session.kind}`}
                        scope="col"
                        className="px-3 py-2 text-center font-medium"
                      >
                        {t("week", { week: session.week })}
                        <span className="block text-[11px] font-normal whitespace-nowrap">
                          {attendance.sessionLabel(session)}
                        </span>
                      </th>
                    ))}
                    <th
                      scope="col"
                      className="px-5 py-2 text-right font-medium"
                    >
                      {t("attended")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.participants.map((person) => (
                    <tr
                      key={person.userId}
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
                      {data.sessions.map((session, index) => {
                        const cell = attendance.cell(person, index);
                        const symbol = (
                          <span
                            aria-hidden
                            className={
                              cell.attended
                                ? "text-[#1f7a4d]"
                                : "text-[#c0c5cc]"
                            }
                          >
                            {cell.attended ? "✓" : "–"}
                          </span>
                        );
                        return (
                          <td
                            key={`${session.week}:${session.kind}`}
                            className="px-3 py-1.5 text-center"
                          >
                            {cell.toggleLabel ? (
                              <button
                                type="button"
                                title={cell.status}
                                aria-label={cell.toggleLabel}
                                aria-pressed={cell.attended}
                                onClick={cell.toggle}
                                className="size-8 rounded-lg hover:bg-[#f4f6f8] focus-visible:outline-2 focus-visible:outline-[#26a4ff]"
                              >
                                {symbol}
                              </button>
                            ) : (
                              <span title={cell.status}>
                                {symbol}
                                <span className="sr-only">{cell.status}</span>
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-5 py-2.5 text-right">
                        {person.attendedSessions}/{data.sessions.length}
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
                    {data.sessions.map((session) => (
                      <td
                        key={`${session.week}:${session.kind}`}
                        className="px-3 py-2.5 text-center"
                      >
                        {session.rate == null
                          ? "—"
                          : t("percent", { rate: session.rate })}
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
