// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { Check, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

import type { MentorLabel } from "@/interfaces/mentor-label";
import { MENTOR_LABEL_PALETTE } from "@/lib/const/mentor-labels";

/** The "Etiket" multi-select pill: mentors carrying every checked label stay in the list. */
export function MentorLabelFilter({
  options,
  selected,
  onToggle,
  onClear,
}: {
  options: readonly MentorLabel[];
  selected: readonly string[];
  onToggle: (labelId: string) => void;
  onClear: () => void;
}) {
  const t = useTranslations("mentorLabels");
  if (options.length === 0) return null;
  return (
    <details
      className="relative"
      onKeyDown={(event) => {
        if (event.key === "Escape") event.currentTarget.open = false;
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          event.currentTarget.open = false;
        }
      }}
    >
      <summary className="flex h-10 cursor-pointer list-none items-center gap-1.5 rounded-full border border-[#e9ecef] bg-white px-3.5 text-[13px] font-medium text-[#22262b] [&::-webkit-details-marker]:hidden">
        {selected.length > 0
          ? t("filterCount", { count: selected.length })
          : t("filter")}
        <ChevronDown aria-hidden className="size-4 text-[#858c96]" />
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-64 rounded-2xl border border-[#e9ecef] bg-white p-3 shadow-[0_12px_32px_rgba(33,38,43,0.12)]">
        <p className="text-[12px] text-[#676e78]">{t("filterHint")}</p>
        <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto">
          {options.map((label) => {
            const checked = selected.includes(label.id);
            return (
              <li key={label.id}>
                <label className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-[13px] text-[#22262b] hover:bg-[#f5f6f8]">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(label.id)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className={`grid size-4 place-items-center rounded border peer-focus-visible:ring-2 peer-focus-visible:ring-[#26a4ff] ${
                      checked
                        ? "border-[#22262b] bg-[#22262b] text-white"
                        : "border-[#c5c9ce]"
                    }`}
                  >
                    {checked ? <Check className="size-3" /> : null}
                  </span>
                  <span
                    aria-hidden
                    className={`size-2.5 rounded-full ${MENTOR_LABEL_PALETTE[label.color].swatch}`}
                  />
                  <span className="truncate">{label.name}</span>
                </label>
              </li>
            );
          })}
        </ul>
        {selected.length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="mt-2 text-[12.5px] font-medium text-[#0b4f99] underline-offset-2 hover:underline"
          >
            {t("clearFilter")}
          </button>
        ) : null}
      </div>
    </details>
  );
}
