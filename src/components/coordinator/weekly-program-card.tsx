"use client";

import { FileText, RefreshCw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRef } from "react";

import type { useWeeklyProgramImport } from "@/hooks/use-weekly-program-import";
import { formatLongDate } from "@/lib/utils";

type Import = ReturnType<typeof useWeeklyProgramImport>;

const OUTLINE_BUTTON =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#e9ecef] bg-white px-[14px] py-2 text-[12.5px] font-medium text-[#22262b] disabled:text-[#aeb4bc]";

/** The program's weekly program file: upload a PDF, or read the uploaded one again. */
export function WeeklyProgramCard({
  weekly,
  archived,
}: {
  weekly: Import;
  archived: boolean;
}) {
  const t = useTranslations("weeklyProgram");
  const locale = useLocale();
  const input = useRef<HTMLInputElement>(null);
  const file = weekly.file;
  const busy =
    archived ||
    weekly.reading ||
    weekly.saving ||
    weekly.reviewing ||
    weekly.needsDates;
  const hint = weekly.reading
    ? t("reading")
    : weekly.needsDates
      ? t("needsDates")
      : file
        ? weekly.oldSyllabus
          ? t("oldSyllabus")
          : t("uploaded", { date: formatLongDate(file.uploadedAt, locale) })
        : t("noFileHint");
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[20px] bg-[#f5f6f8] px-[14px] py-3">
      <span className="grid size-[38px] shrink-0 place-items-center rounded-xl bg-white">
        <FileText aria-hidden className="size-[18px] text-[#676e78]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-medium text-[#22262b]">
          {file ? file.filename : t("noFile")}
        </span>
        <span
          role={weekly.reading ? "status" : undefined}
          className="block text-[12px] text-[#858c96]"
        >
          {hint}
        </span>
      </span>
      <input
        ref={input}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        disabled={busy}
        aria-label={t("chooseFile")}
        onChange={(event) => {
          const chosen = event.target.files?.[0];
          if (chosen) weekly.chooseFile(chosen);
          event.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        className={OUTLINE_BUTTON}
      >
        {file ? t("replaceFile") : t("uploadFile")}
      </button>
      {weekly.canReread ? (
        <button
          type="button"
          disabled={busy}
          onClick={weekly.reread}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-[14px] py-2 text-[12.5px] font-medium text-[#22262b] disabled:text-[#aeb4bc]"
        >
          <RefreshCw aria-hidden className="size-[15px]" />
          {t("reread")}
        </button>
      ) : null}
    </div>
  );
}
