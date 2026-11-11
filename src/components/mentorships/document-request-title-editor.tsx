"use client";

import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { newRowKey, withKeys, type Keyed } from "@/lib/keyed-list";

/** One requested document title while it is edited; the key is React's (see keyed-list). */
export type DocumentTitleRow = Keyed<{ title: string }>;

export function documentTitleRows(titles: readonly string[]) {
  return withKeys(titles.map((title) => ({ title })));
}

export function titlesOf(rows: readonly DocumentTitleRow[]) {
  return rows.map((row) => row.title);
}

export function DocumentRequestTitleEditor({
  rows,
  onChange,
  disabled = false,
  showHeading = true,
}: {
  rows: readonly DocumentTitleRow[];
  onChange: (rows: DocumentTitleRow[]) => void;
  disabled?: boolean;
  showHeading?: boolean;
}) {
  const t = useTranslations("meetingFields.documents");
  function updateTitle(index: number, title: string) {
    onChange(rows.map((row, i) => (i === index ? { ...row, title } : row)));
  }

  function removeTitle(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  function addTitle() {
    onChange([...rows, { key: newRowKey(), title: "" }]);
  }

  return (
    <div className={showHeading ? "mt-5" : undefined}>
      {showHeading ? (
        <>
          <h3 className="text-base font-medium text-[#22262b]">{t("title")}</h3>
          <p className="mt-1 text-sm text-[#676e78]">{t("hint")}</p>
        </>
      ) : null}
      <div className={showHeading ? "mt-3 space-y-2" : "space-y-2"}>
        {rows.map((row, index) => (
          <div key={row.key} className="flex items-center gap-2">
            <input
              type="text"
              value={row.title}
              disabled={disabled}
              onChange={(event) => updateTitle(index, event.target.value)}
              placeholder={t("placeholder", { number: index + 1 })}
              maxLength={500}
              className="min-h-10 flex-1 rounded-lg border border-[#d4d8dd] px-3 text-sm text-[#22262b] outline-none focus:border-[var(--ms-accent,#e86f22)]"
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => removeTitle(index)}
              aria-label={t("remove")}
              className="grid size-9 place-items-center rounded-lg text-[#858c96] hover:bg-[#f1f2f4] hover:text-[#22262b]"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={addTitle}
        className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-[var(--ms-accent,#e86f22)]"
      >
        <Plus className="size-3.5" />
        {t("add")}
      </button>
    </div>
  );
}

export function normalizeDocumentTitles(titles: string[]) {
  return titles.map((title) => title.trim()).filter(Boolean);
}
