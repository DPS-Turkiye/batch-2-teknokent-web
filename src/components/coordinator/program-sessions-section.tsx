"use client";

import { useLocale, useTranslations } from "next-intl";

import { EmptyNote, Panel, QueryNotice } from "@/components/admin/admin-ui";
import { useProgramSessions } from "@/hooks/use-program-report";
import {
  type ProgramSessionsRow,
  SessionsExportFormat,
} from "@/interfaces/program-report";

const linkClass =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-full border border-[#e9ecef] bg-white px-3.5 text-[12.5px] font-medium text-[#22262b] aria-disabled:pointer-events-none aria-disabled:text-[#aeb4bc]";
const inputClass =
  "h-9 rounded-xl border border-[#e4e7ea] bg-white px-3 text-[13px] text-[#22262b] outline-none focus:border-[#26a4ff]";

function SessionsTable({
  title,
  rows,
}: {
  title: string;
  rows: ProgramSessionsRow[];
}) {
  const t = useTranslations("programReport.sessions");
  const hours = new Intl.NumberFormat(useLocale(), {
    maximumFractionDigits: 2,
  });
  return (
    <Panel>
      <h3 className="border-b border-[#e9ecef] px-5 py-3 text-[14px] font-semibold text-[#22262b]">
        {title}
      </h3>
      {rows.length === 0 ? (
        <EmptyNote>{t("empty")}</EmptyNote>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[13px]">
            <thead className="text-[12px] text-[#858c96]">
              <tr>
                <th className="px-5 py-2 font-medium">{t("name")}</th>
                <th className="px-5 py-2 font-medium">{t("email")}</th>
                <th className="px-5 py-2 text-right font-medium">
                  {t("sessions")}
                </th>
                <th className="px-5 py-2 text-right font-medium">
                  {t("hours")}
                </th>
                <th className="px-5 py-2 text-right font-medium">
                  {t("days")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-[#f1f3f5]">
                  <td className="px-5 py-2.5 text-[#22262b]">{row.name}</td>
                  <td className="px-5 py-2.5 text-[#676e78]">{row.email}</td>
                  <td className="px-5 py-2.5 text-right">{row.sessions}</td>
                  <td className="px-5 py-2.5 text-right">
                    {hours.format(row.minutes / 60)}
                  </td>
                  <td className="px-5 py-2.5 text-right">{row.days}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

/** Sessions and hours per mentor and per mentee, with the file İŞKUR asks for. */
// TEST UI: placeholder until the design team's screen; replace when it arrives.
export function ProgramSessionsSection({ programId }: { programId: string }) {
  const t = useTranslations("programReport.sessions");
  const sessions = useProgramSessions(programId);
  const data = sessions.query.data;
  const xlsx = sessions.exportHref(SessionsExportFormat.Xlsx);
  const csv = sessions.exportHref(SessionsExportFormat.Csv);

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
              value={sessions.from}
              onChange={(event) => sessions.setFrom(event.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-[12px] text-[#676e78]">
            {t("to")}
            <input
              type="date"
              value={sessions.to}
              onChange={(event) => sessions.setTo(event.target.value)}
              className={inputClass}
            />
          </label>
          <a href={xlsx} download aria-disabled={!xlsx} className={linkClass}>
            {t("downloadXlsx")}
          </a>
          <a href={csv} download aria-disabled={!csv} className={linkClass}>
            {t("downloadCsv")}
          </a>
        </div>
      </div>

      {!sessions.valid ? (
        <p role="alert" className="text-sm text-[#d9464b]">
          {t("rangeInvalid")}
        </p>
      ) : data ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <SessionsTable title={t("mentors")} rows={data.mentors} />
          <SessionsTable title={t("students")} rows={data.students} />
        </div>
      ) : (
        <QueryNotice
          isLoading={sessions.query.isLoading}
          error={sessions.query.error}
        />
      )}
    </section>
  );
}
