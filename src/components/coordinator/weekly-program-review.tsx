// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { AlertTriangle, Info, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import type { useWeeklyProgramImport } from "@/hooks/use-weekly-program-import";
import { dayRangeLabel, type WeekDraft } from "@/lib/program-week";
import {
  NO_PHASE,
  PHASE_NAME_MAX_LENGTH,
  PHASE_OUTPUT_MAX_LENGTH,
  WEEK_TITLE_MAX_LENGTH,
  weekListLabel,
} from "@/lib/weekly-program";

type Import = ReturnType<typeof useWeeklyProgramImport>;

const LIST_FIELDS = ["topics", "activities", "deliverables"] as const;
const FIELD =
  "w-full rounded-[10px] border border-[#e4e7ea] px-3 py-2 text-[13px] font-normal text-[#22262b] outline-none focus:border-[#22262b] disabled:bg-[#f7f8fa]";
const OUTLINE_BUTTON =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#e9ecef] bg-white px-[14px] py-2 text-[12.5px] font-medium text-[#22262b] disabled:text-[#aeb4bc]";
const DARK_BUTTON =
  "rounded-full bg-[#22262b] px-[14px] py-2 text-[12.5px] font-medium text-white disabled:bg-[#aeb4bc]";

/** The weeks and phases read from the weekly program file, edited and saved in one step. */
export function WeeklyProgramReview({ weekly }: { weekly: Import }) {
  const t = useTranslations("weeklyProgram");
  const tWeek = useTranslations("programWeekPlan");
  const locale = useLocale();
  const heading = useRef<HTMLHeadingElement>(null);
  // The review opens below the file row; take keyboard and screen-reader users there.
  useEffect(() => heading.current?.focus(), []);
  const proposal = weekly.proposal;
  if (!proposal) return null;
  const locked = weekly.saving;

  return (
    <section
      aria-labelledby="weekly-program-review-title"
      className="space-y-4 rounded-[24px] border border-[#22262b] p-5"
    >
      <div className="space-y-1">
        <h3
          id="weekly-program-review-title"
          ref={heading}
          tabIndex={-1}
          className="text-[15px] font-semibold text-[#22262b] outline-none"
        >
          {t("reviewTitle")}
        </h3>
        <p className="text-[12.5px] text-[#676e78]">
          {t("reviewSubtitle", {
            weeks: weekly.weeks.length,
            phases: weekly.phases.length,
          })}
        </p>
      </div>

      {proposal.warnings.length || proposal.readingWarnings.length ? (
        <ul className="space-y-1.5 rounded-[16px] bg-[#fff6e5] px-4 py-3">
          {proposal.warnings.map((warning) => (
            <li
              key={warning.code}
              className="flex gap-2 text-[12.5px] text-[#22262b]"
            >
              <AlertTriangle
                aria-hidden
                className="mt-0.5 size-4 shrink-0 text-[#b7791f]"
              />
              {t(`warnings.${warning.code}`, {
                weeks: weekListLabel(warning.weeks, locale),
              })}
            </li>
          ))}
          {proposal.readingWarnings.map((line) => (
            <li key={line} className="flex gap-2 text-[12.5px] text-[#22262b]">
              <Info
                aria-hidden
                className="mt-0.5 size-4 shrink-0 text-[#b7791f]"
              />
              {t("readingWarningsTitle")}: {line}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="space-y-2">
        <h4
          id="weekly-program-phases"
          className="text-[13px] font-semibold text-[#22262b]"
        >
          {t("phasesTitle")}
        </h4>
        <ol className="space-y-2" aria-labelledby="weekly-program-phases">
          {weekly.phases.map((phase, index) => (
            <li
              key={phase.key}
              className="grid gap-2 rounded-[16px] border border-[#e9ecef] p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-center"
            >
              <input
                value={phase.name}
                maxLength={PHASE_NAME_MAX_LENGTH}
                disabled={locked}
                aria-label={t("phaseName", { n: index + 1 })}
                onChange={(event) =>
                  weekly.renamePhase(index, event.target.value)
                }
                className={FIELD}
              />
              <input
                value={phase.expectedOutput ?? ""}
                maxLength={PHASE_OUTPUT_MAX_LENGTH}
                disabled={locked}
                placeholder={t("outputPlaceholder")}
                aria-label={t("phaseOutput", { n: index + 1 })}
                onChange={(event) =>
                  weekly.setPhaseOutput(index, event.target.value)
                }
                className={FIELD}
              />
              <span className="text-[12px] whitespace-nowrap text-[#858c96]">
                {weekly.phaseRangeLabel(phase)}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="space-y-2">
        <h4
          id="weekly-program-weeks"
          className="text-[13px] font-semibold text-[#22262b]"
        >
          {t("weeksTitle")}
        </h4>
        <ol className="space-y-3" aria-labelledby="weekly-program-weeks">
          {weekly.weeks.map((week, index) => (
            <ReviewWeek
              key={week.key}
              week={week}
              index={index}
              weekly={weekly}
              locked={locked}
              label={tWeek("weekLabel", { week: week.week })}
            />
          ))}
        </ol>
      </div>

      {proposal.notes.length ? (
        <div className="space-y-1 rounded-[16px] bg-[#f7f8fa] px-4 py-3">
          <p className="text-[12.5px] font-semibold text-[#22262b]">
            {t("notesTitle")}
          </p>
          <ul className="list-disc space-y-0.5 pl-5 text-[12.5px] text-[#22262b]">
            {proposal.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
          <p className="text-[12px] text-[#858c96]">{t("notesHint")}</p>
        </div>
      ) : null}

      {weekly.mustConfirm ? (
        <div className="space-y-2.5 rounded-[16px] bg-[#fff6e5] px-4 py-3">
          <p className="text-[13px] font-semibold text-[#22262b]">
            {t("replaceTitle")}
          </p>
          <p className="text-[12.5px] text-[#22262b]">
            {t("replaceBody", {
              phases: proposal.existing.phaseCount,
              weeks: proposal.existing.weekCount,
            })}
          </p>
          {proposal.existing.currentWeek !== null ? (
            <label className="flex items-start gap-2 text-[12.5px] text-[#22262b]">
              <input
                type="checkbox"
                checked={weekly.keepPast}
                disabled={locked}
                onChange={(event) => weekly.setKeepPast(event.target.checked)}
                className="mt-0.5"
              />
              <span>
                {t("keepPast")}
                <span className="block text-[12px] text-[#676e78]">
                  {weekly.keepsEveryWeek
                    ? t("keepPastEnded")
                    : weekly.lastKeptWeek !== null
                      ? t("keepPastHint", {
                          week: weekly.lastKeptWeek,
                          next: weekly.lastKeptWeek + 1,
                        })
                      : t("keepPastNothing")}
                </span>
              </span>
            </label>
          ) : null}
          <label className="flex items-center gap-2 text-[12.5px] font-medium text-[#22262b]">
            <input
              type="checkbox"
              checked={weekly.confirmed}
              disabled={locked}
              onChange={(event) => weekly.setConfirmed(event.target.checked)}
            />
            {t("confirm")}
          </label>
        </div>
      ) : null}

      {weekly.problem ? (
        <p role="alert" className="text-[12.5px] text-[#b42318]">
          {weekly.problem}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={weekly.discard}
          disabled={locked}
          className={OUTLINE_BUTTON}
        >
          {t("discard")}
        </button>
        <button
          type="button"
          onClick={weekly.save}
          disabled={locked}
          className={DARK_BUTTON}
        >
          {weekly.saving ? t("saving") : t("save")}
        </button>
      </div>
    </section>
  );
}

function ReviewWeek({
  week,
  index,
  weekly,
  locked,
  label,
}: {
  week: WeekDraft;
  index: number;
  weekly: Import;
  locked: boolean;
  label: string;
}) {
  const t = useTranslations("weeklyProgram");
  const tWeek = useTranslations("programWeekPlan");
  const locale = useLocale();
  const days = weekly.daysOf(week.week);
  const range = days ? dayRangeLabel(days.start, days.end, locale) : null;
  const phaseIndex = weekly.phaseIndexOf(week.week);

  return (
    <li className="space-y-3 rounded-[18px] border border-[#e4e7ea] bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] font-semibold text-[#22262b]">
          {label}
        </span>
        {range ? (
          <span className="text-[12.5px] text-[#858c96]">{range}</span>
        ) : null}
        {weekly.phases.length ? (
          <select
            value={phaseIndex}
            disabled={locked}
            aria-label={t("weekPhase", { week: week.week })}
            onChange={(event) =>
              weekly.moveWeek(week.week, Number(event.target.value))
            }
            className="rounded-full border border-[#e4e7ea] px-3 py-1 text-[12.5px] text-[#22262b]"
          >
            {phaseIndex === NO_PHASE ? (
              <option value={NO_PHASE}>{t("noPhase")}</option>
            ) : null}
            {weekly.phases.map((phase, at) => (
              <option key={phase.key} value={at}>
                {weekly.phaseOptionLabel(phase, at)}
              </option>
            ))}
          </select>
        ) : null}
        <button
          type="button"
          disabled={locked}
          onClick={() => weekly.removeWeek(index)}
          aria-label={tWeek("remove", { week: label })}
          className="ml-auto grid size-8 place-items-center rounded-full text-[#858c96] hover:bg-[#f7f8fa] disabled:opacity-50"
        >
          <Trash2 aria-hidden className="size-4" />
        </button>
      </div>
      <label className="block space-y-1 text-[12px] font-medium text-[#4a5059]">
        {tWeek("weekTitle")}
        <input
          value={week.title}
          maxLength={WEEK_TITLE_MAX_LENGTH}
          disabled={locked}
          onChange={(event) =>
            weekly.updateWeek(index, { title: event.target.value })
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
            {tWeek(`fields.${field}`)}
            <textarea
              rows={3}
              value={week[field]}
              disabled={locked}
              placeholder={tWeek("onePerLine")}
              onChange={(event) =>
                weekly.updateWeek(index, { [field]: event.target.value })
              }
              className={FIELD}
            />
          </label>
        ))}
      </div>
    </li>
  );
}
