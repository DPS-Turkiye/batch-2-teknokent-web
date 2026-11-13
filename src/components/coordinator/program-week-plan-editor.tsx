"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.
import { Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import type { useProgramWeekPlan } from "@/hooks/use-program-week-plan";
import { dayRangeLabel, type WeekDraft } from "@/lib/program-week";

type WeekPlan = ReturnType<typeof useProgramWeekPlan>;

const OUTLINE_BUTTON =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#e9ecef] bg-white px-[14px] py-2 text-[12.5px] font-medium text-[#22262b] disabled:text-[#aeb4bc]";
const DARK_BUTTON =
  "rounded-full bg-[#22262b] px-[14px] py-2 text-[12.5px] font-medium text-white disabled:bg-[#aeb4bc]";
const FIELD =
  "w-full rounded-xl border border-[#e4e7ea] bg-white px-3 py-2 text-[13px] text-[#22262b] disabled:bg-[#f7f8fa]";
const LIST_FIELDS = ["topics", "activities", "deliverables"] as const;

/**
 * Müfredat & fazlar › Haftalık plan: what participants see week by week on Süreç ("Bu hafta"). A syllabus read
 * fills it with the AI's weeks; the coordinator checks and edits them, then saves the whole plan.
 */
export function ProgramWeekPlanEditor({
  plan,
  locked,
}: {
  plan: WeekPlan;
  locked: boolean;
}) {
  const t = useTranslations("programWeekPlan");

  return (
    <section
      aria-labelledby="week-plan-title"
      className="space-y-3 border-t border-[#f0f2f4] pt-4"
    >
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <h3
            id="week-plan-title"
            className="text-[15px] font-semibold text-[#22262b]"
          >
            {t("title")}
          </h3>
          <p className="text-[12.5px] text-[#858c96]">
            {plan.totalWeeks
              ? t("subtitleWeeks", { total: plan.totalWeeks })
              : t("subtitle")}
          </p>
        </div>
        <button
          type="button"
          disabled={locked || !plan.canAdd || plan.isSaving}
          onClick={plan.add}
          className={OUTLINE_BUTTON}
        >
          <Plus aria-hidden className="size-4" />
          {t("add")}
        </button>
      </div>

      {plan.isLoading ? (
        <p role="status" className="text-[13px] text-[#858c96]">
          {t("loading")}
        </p>
      ) : plan.loadError ? (
        <p role="alert" className="text-[13px] text-[#b42318]">
          {t("loadFailed")}
        </p>
      ) : plan.weeks.length === 0 ? (
        <p className="rounded-[18px] border border-dashed border-[#d6dade] px-4 py-5 text-[13px] text-[#676e78]">
          {t("empty")}
        </p>
      ) : (
        <ol className="space-y-3" aria-label={t("title")}>
          {plan.weeks.map((week, index) => (
            <WeekRow
              key={week.key}
              week={week}
              index={index}
              plan={plan}
              locked={locked || plan.isSaving}
            />
          ))}
        </ol>
      )}

      {plan.problem ? (
        <p role="alert" className="text-[12.5px] text-[#b42318]">
          {plan.problem}
        </p>
      ) : null}
      {plan.dirty && !locked ? (
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={plan.discard}
            disabled={plan.isSaving}
            className={OUTLINE_BUTTON}
          >
            {t("discard")}
          </button>
          <button
            type="button"
            onClick={plan.save}
            disabled={plan.isSaving}
            className={DARK_BUTTON}
          >
            {plan.isSaving ? t("saving") : t("save")}
          </button>
        </div>
      ) : null}
    </section>
  );
}

function WeekRow({
  week,
  index,
  plan,
  locked,
}: {
  week: WeekDraft;
  index: number;
  plan: WeekPlan;
  locked: boolean;
}) {
  const t = useTranslations("programWeekPlan");
  const locale = useLocale();
  const days = plan.daysOf(week.week);
  const range = days ? dayRangeLabel(days.start, days.end, locale) : null;
  const label = t("weekLabel", { week: week.week });

  return (
    <li className="space-y-3 rounded-[18px] border border-[#e4e7ea] bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-[13px] font-semibold text-[#22262b]">
          {t("week")}
          <input
            type="number"
            min={1}
            max={plan.totalWeeks ?? undefined}
            value={week.week}
            disabled={locked}
            aria-label={t("weekNumberOf", { week: week.week })}
            onChange={(event) =>
              plan.update(index, { week: Number(event.target.value) })
            }
            className="w-16 rounded-lg border border-[#e4e7ea] px-2 py-1 text-[13px]"
          />
        </label>
        {range ? (
          <span className="text-[12.5px] text-[#858c96]">{range}</span>
        ) : null}
        {week.inferred ? (
          <span className="rounded-full border border-[#f2ddbe] bg-[#fef6ec] px-2.5 py-0.5 text-[11.5px] font-medium text-[#a65a15]">
            {t("inferred")}
          </span>
        ) : null}
        <button
          type="button"
          disabled={locked}
          onClick={() => plan.remove(index)}
          aria-label={t("remove", { week: label })}
          className="ml-auto grid size-8 place-items-center rounded-full text-[#858c96] hover:bg-[#f7f8fa] disabled:opacity-50"
        >
          <Trash2 aria-hidden className="size-4" />
        </button>
      </div>
      <label className="block space-y-1 text-[12px] font-medium text-[#4a5059]">
        {t("weekTitle")}
        <input
          value={week.title}
          maxLength={160}
          disabled={locked}
          onChange={(event) =>
            plan.update(index, { title: event.target.value })
          }
          className={FIELD}
        />
      </label>
      <div className="grid gap-3 md:grid-cols-3">
        {LIST_FIELDS.map((field) => (
          <label
            key={field}
            className="block space-y-1 text-[12px] font-medium text-[#4a5059]"
          >
            {t(`fields.${field}`)}
            <textarea
              rows={3}
              value={week[field]}
              disabled={locked}
              placeholder={t("onePerLine")}
              onChange={(event) =>
                plan.update(index, { [field]: event.target.value })
              }
              className={FIELD}
            />
          </label>
        ))}
      </div>
    </li>
  );
}
