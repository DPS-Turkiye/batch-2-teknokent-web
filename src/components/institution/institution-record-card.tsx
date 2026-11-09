"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.

import { useLocale, useTranslations } from "next-intl";

import type { InstitutionRecord } from "@/interfaces/institution";
import { formatDateTime } from "@/lib/utils";

/** "Kurumsal Bilgiler": what ODTÜ says about the person, read-only. Usable in any ODTÜ workspace. */
export function InstitutionRecordCard({
  record,
}: {
  record: InstitutionRecord | null;
}) {
  const t = useTranslations("academicianWorkspace.institution");
  const locale = useLocale();
  const rows = record
    ? [
        [t("academicTitle"), record.academicTitle],
        [t("faculty"), record.faculty],
        [t("department"), record.departmentName],
        [t("email"), record.email],
      ].filter((row): row is [string, string] => Boolean(row[1]))
    : [];
  return (
    <section
      aria-labelledby="institution-record-title"
      className="rounded-3xl border border-[#e9ecef] bg-white px-6 py-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="institution-record-title"
          className="text-[16px] font-semibold leading-[1.3] text-[#22262b]"
        >
          {t("title")}
        </h2>
        <span className="rounded-full bg-[#f5f6f8] px-2.5 py-1 text-[11.5px] font-medium text-[#676e78]">
          {t("readOnly")}
        </span>
      </div>
      {record ? (
        <>
          <p className="mt-4 text-[18px] font-semibold text-[#22262b]">
            {record.fullName}
          </p>
          <dl className="mt-3 grid gap-x-8 gap-y-2.5 text-[13px] sm:grid-cols-[max-content_1fr]">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-[#858c96]">{label}</dt>
                <dd className="break-words text-[#22262b]">{value}</dd>
              </div>
            ))}
          </dl>
          {record.syncedAt ? (
            <p className="mt-4 text-[12px] text-[#858c96]">
              {t("syncedAt", { date: formatDateTime(record.syncedAt, locale) })}
            </p>
          ) : null}
          <p className="mt-1 text-[12px] text-[#858c96]">{t("help")}</p>
        </>
      ) : (
        <p className="mt-3 text-[13px] text-[#676e78]">{t("empty")}</p>
      )}
    </section>
  );
}
