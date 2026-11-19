"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";

import { WeekVisibility } from "@/interfaces/program-week";
import { isEnumValue } from "@/lib/enum";

const BADGE: Record<WeekVisibility, string> = {
  [WeekVisibility.Auto]: "border-[#e4e7ea] bg-[#f3f4f6] text-[#676e78]",
  [WeekVisibility.Shown]: "border-[#cde7d6] bg-[#eef8f1] text-[#1d7a44]",
  [WeekVisibility.Hidden]: "border-[#f3d1cc] bg-[#fdf1ef] text-[#b42318]",
};

/**
 * "Mentee görünürlüğü" on a weekly plan row: a badge with the week's setting and a menu to change it, saved at once
 * apart from the plan's own Kaydet. While `canSet` is false (a week not saved yet, or unsaved edits in the plan) the
 * menu stays focusable but inert, so `hintId`'s reason is read; a save in flight ignores further changes.
 */
export function WeekVisibilityControl({
  week,
  visibility,
  canSet,
  pending,
  locked,
  hintId,
  onChange,
}: {
  week: number;
  visibility: WeekVisibility | null;
  canSet: boolean;
  pending: boolean;
  locked: boolean;
  hintId: string;
  onChange: (visibility: WeekVisibility) => void;
}) {
  const t = useTranslations("programWeekPlan.visibility");
  const inert = !canSet || pending;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {visibility ? (
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium ${BADGE[visibility]}`}
        >
          {visibility === WeekVisibility.Hidden ? (
            <EyeOff aria-hidden className="size-3.5" />
          ) : (
            <Eye aria-hidden className="size-3.5" />
          )}
          {t(`badge.${visibility}`)}
        </span>
      ) : null}
      <label className="flex items-center gap-1.5 text-[12px] font-medium text-[#4a5059]">
        {t("label")}
        <select
          value={visibility ?? WeekVisibility.Auto}
          disabled={locked}
          aria-disabled={!locked && !canSet ? true : undefined}
          aria-busy={pending || undefined}
          aria-label={t("labelOf", { week })}
          aria-describedby={!locked && !canSet ? hintId : undefined}
          onChange={(event) => {
            const next = event.target.value;
            if (!inert && isEnumValue(WeekVisibility, next)) onChange(next);
          }}
          className="rounded-lg border border-[#e4e7ea] bg-white px-2 py-1 text-[12.5px] text-[#22262b] disabled:bg-[#f7f8fa] disabled:text-[#aeb4bc] aria-disabled:text-[#aeb4bc]"
        >
          {Object.values(WeekVisibility).map((option) => (
            <option key={option} value={option}>
              {t(`options.${option}`)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
