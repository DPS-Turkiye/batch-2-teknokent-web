// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

import { GateBadgeStateChip } from "@/components/badges/gate-badge-state-chip";
import { useAdminStudents } from "@/hooks/use-admin-students";
import { inTraining, StudentFilter } from "@/interfaces/badges";
import { errorMessage, formatLongDate } from "@/lib/utils";

/**
 * Kullanıcılar › Öğrenciler: everyone in a peer program, with a "Rozet durumu" filter (Akran mentoru = Aktif).
 * Awarding and taking back happen in the program's Katılımcılar, which the row links to.
 */
export function AdminStudentsTable() {
  const t = useTranslations("adminStudents");
  const locale = useLocale();
  const students = useAdminStudents();

  return (
    <div className="space-y-4">
      <div
        role="group"
        aria-label={t("filterLabel")}
        className="flex flex-wrap gap-2"
      >
        {Object.values(StudentFilter).map((filter) => {
          const active = students.filter === filter;
          return (
            <button
              key={filter}
              type="button"
              aria-pressed={active}
              onClick={() => students.setFilter(filter)}
              className={`rounded-full px-4 py-2 text-[13px] ${
                active
                  ? "bg-[#22262b] font-medium text-white"
                  : "border border-[#e9ecef] text-[#676e78]"
              }`}
            >
              {t(`filters.${filter}`)}
            </button>
          );
        })}
      </div>
      {students.isLoading ? (
        <p role="status" className="text-sm text-[#676e78]">
          {t("loading")}
        </p>
      ) : null}
      {students.error ? (
        <p role="alert" className="text-sm text-red-700">
          {errorMessage(students.error, t("loadFailed"))}
        </p>
      ) : null}
      {!students.isLoading && !students.error && students.rows.length === 0 ? (
        <p className="text-sm text-[#676e78]">{t("empty")}</p>
      ) : null}
      {students.rows.length > 0 ? (
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-[#858c96]">
            <tr>
              <th className="py-2 font-medium">{t("name")}</th>
              <th className="py-2 font-medium">{t("program")}</th>
              <th className="py-2 font-medium">{t("badge")}</th>
              <th className="py-2 font-medium">{t("since")}</th>
            </tr>
          </thead>
          <tbody>
            {students.rows.map((row) => (
              <tr
                key={`${row.userId}-${row.programId}`}
                className="border-t border-[#eceef0]"
              >
                <td className="py-3">
                  <p className="font-medium text-[#22262b]">{row.fullName}</p>
                  <p className="text-xs text-[#858c96]">{row.email}</p>
                </td>
                <td className="py-3">
                  <Link
                    href={`/admin/programs/${encodeURIComponent(row.programId)}/students`}
                    className="text-[#e5701d] hover:underline"
                  >
                    {row.programName}
                  </Link>
                </td>
                <td className="py-3">
                  <GateBadgeStateChip
                    state={row.state}
                    inTraining={inTraining(row)}
                  />
                </td>
                <td className="py-3 text-xs text-[#676e78]">
                  {row.awardedAt ? formatLongDate(row.awardedAt, locale) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
