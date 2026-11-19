"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId } from "react";

import { WeekVisibility } from "@/interfaces/program-week";
import { isEnumValue } from "@/lib/enum";

const BADGE: Record<WeekVisibility, string> = {
  [WeekVisibility.Auto]: "border-[#e4e7ea] bg-[#f3f4f6] text-[#676e78]",
  [WeekVisibility.Shown]: "border-[#cde7d6] bg-[#eef8f1] text-[#1d7a44]",
  [WeekVisibility.Hidden]: "border-[#f3d1cc] bg-[#fdf1ef] text-[#b42318]",
};

/**
 * "Mentee görünürlüğü" on a weekly plan row: a badge with the week's setting and a menu to change it. Saved at once,
 * apart from the plan's own Kaydet; `canSet` is false for a week not saved yet or while the plan has unsaved edits.
 */
export function WeekVisibilityControl({
  week,
  visibility,
  canSet,
  pending,
  locked,
  onChange,
}: {
  week: number;
  visibility: WeekVisibility | null;
  canSet: boolean;
  pending: boolean;
  locked: boolean;
  onChange: (visibility: WeekVisibility) => void;
}) {
  const t = useTranslations("programWeekPlan.visibility");
  const hintId = useId();
  const showHint = !locked && !canSet;

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
          disabled={locked || !canSet || pending}
          aria-label={t("labelOf", { week })}
          aria-describedby={showHint ? hintId : undefined}
          onChange={(event) => {
            const next = event.target.value;
            if (isEnumValue(WeekVisibility, next)) onChange(next);
          }}
          className="rounded-lg border border-[#e4e7ea] bg-white px-2 py-1 text-[12.5px] text-[#22262b] disabled:bg-[#f7f8fa] disabled:text-[#aeb4bc]"
        >
          <option value={WeekVisibility.Auto}>{t("options.AUTO")}</option>
          <option value={WeekVisibility.Shown}>{t("options.SHOWN")}</option>
          <option value={WeekVisibility.Hidden}>{t("options.HIDDEN")}</option>
        </select>
      </label>
      {showHint ? (
        <span id={hintId} className="text-[11.5px] text-[#858c96]">
          {t("saveFirst")}
        </span>
      ) : null}
    </div>
  );
}
