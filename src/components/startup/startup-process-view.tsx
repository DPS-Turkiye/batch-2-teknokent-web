"use client";

import { Check, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";

import { ProgramWeekCard } from "@/components/startup/program-week-card";
import {
  StartupPageFrame,
  startupPrimaryActionClass,
} from "@/components/startup/startup-page-frame";
import { WeeklyCheckIn } from "@/components/startup/weekly-check-in";
import { useStartupProcess } from "@/hooks/use-startup-process";
import { ActionItemStatus } from "@/interfaces/action-item";
import {
  StartupStageState,
  type ProcessAssignment,
} from "@/interfaces/startup-process";
import { DOCUMENT_UPLOAD_ACCEPT } from "@/lib/const";
import {
  ASSIGNMENT_STATUS_TONES,
  assignmentSourceKind,
  ChipTone,
  formatRoundRange,
  formatStageRange,
  type PhaseCard,
} from "@/lib/startup-process";
import { calendarDay, formatDayMonth } from "@/lib/utils";

const cardClass =
  "space-y-3.5 rounded-xl border border-[#e4e7ea] bg-white px-[22px] py-5";
const cardTitleClass =
  "text-[15px] font-semibold leading-[23px] text-[#22262b]";

const CHIP_TONES: Record<ChipTone, string> = {
  [ChipTone.Amber]: "border-[#f2ddbe] bg-[#fef6ec] text-[#a65a15]",
  [ChipTone.Gray]: "border-[#e4e7ea] bg-[#f3f4f6] text-[#676e78]",
  [ChipTone.Green]: "border-[#cbebda] bg-[#eefaf3] text-[#0f7a4d]",
};

const RING_RADIUS = 47;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

function PhaseCardButton({
  card,
  number,
  selected,
  onSelect,
}: {
  card: PhaseCard;
  number: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const t = useTranslations("startupProcess");
  const label = card.phase.name;
  const count =
    card.total > 0
      ? t("doneCount", { done: card.done, total: card.total })
      : t("noAssignments");
  const completed = card.phase.state === StartupStageState.Completed;
  const current = card.phase.state === StartupStageState.Current;
  const actionTone = selected
    ? "bg-white text-[#e86f22]"
    : completed
      ? "bg-[#eefaf3] text-[#0f7a4d]"
      : "bg-[#f3f4f6] text-[#22262b]";
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-current={current ? "step" : undefined}
      aria-label={`${label} · ${count}`}
      className={`w-full rounded-2xl p-2.5 text-center transition ${selected ? "bg-gradient-to-br from-[#f58a3c] to-[#c9571a] shadow-[0_8px_24px_rgba(232,111,34,0.25)]" : "border border-[#e4e7ea] bg-white hover:border-[#f6c9a5]"}`}
    >
      <span
        className={`flex flex-col items-center gap-3.5 rounded-xl border px-1.5 pb-1.5 pt-2 ${selected ? "border-white/40" : "border-transparent"}`}
      >
        <span className="flex w-full items-center gap-2">
          <span
            className={`grid size-[26px] shrink-0 place-items-center rounded-full text-xs font-medium ${selected ? "bg-white text-[#e86f22]" : "border border-[#e4e7ea] bg-[#f3f4f6] text-[#676e78]"}`}
          >
            {number}
          </span>
          <span
            className={`flex-1 truncate pr-[26px] text-center text-[15px] font-semibold leading-5 ${selected ? "text-white" : "text-[#22262b]"}`}
          >
            {label}
          </span>
        </span>
        <span className="relative grid size-28 place-items-center">
          <svg viewBox="0 0 112 112" className="absolute inset-0 -rotate-90">
            <circle
              cx="56"
              cy="56"
              r={RING_RADIUS}
              fill="none"
              strokeWidth="18"
              className={selected ? "stroke-white/25" : "stroke-[#eceef0]"}
            />
            {card.percent > 0 ? (
              <circle
                cx="56"
                cy="56"
                r={RING_RADIUS}
                fill="none"
                strokeWidth="18"
                strokeDasharray={`${(card.percent / 100) * RING_LENGTH} ${RING_LENGTH}`}
                className={selected ? "stroke-white" : "stroke-[#e86f22]"}
              />
            ) : null}
          </svg>
          <span
            className={`text-[17px] font-semibold ${selected ? "text-white" : "text-[#22262b]"}`}
          >
            {card.percent}%
          </span>
        </span>
        <span
          className={`text-[12.5px] leading-[19px] ${selected ? "text-white/90" : "text-[#676e78]"}`}
        >
          {count}
        </span>
        <span
          className={`flex h-10 w-full items-center gap-1.5 rounded-[10px] px-3 text-[13px] font-semibold ${actionTone}`}
        >
          {completed ? <Check aria-hidden className="size-4" /> : null}
          <span className="flex-1 truncate text-left">
            {t(`action.${card.action}`)}
          </span>
          {completed || current ? null : (
            <ChevronRight aria-hidden className="size-4" />
          )}
        </span>
      </span>
    </button>
  );
}

function AssignmentRow({
  assignment,
  source,
  isUploading,
  onUpload,
}: {
  assignment: ProcessAssignment;
  source: string;
  isUploading: boolean;
  onUpload: (file: File) => void;
}) {
  const t = useTranslations("startupProcess");
  const locale = useLocale();
  const tone = ASSIGNMENT_STATUS_TONES[assignment.status];
  const canUpload =
    assignment.status === ActionItemStatus.Open ||
    assignment.status === ActionItemStatus.InProgress;
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#e4e7ea] px-4 py-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <Image src="/startup/done-ring.svg" alt="" width={17} height={17} />
        <div className="min-w-0 space-y-[3px]">
          <p className="text-[13.5px] font-medium leading-5 text-[#22262b]">
            {assignment.title}
          </p>
          {source ? (
            <p className="text-[11.5px] leading-[17px] text-[#676e78]">
              {source}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        {assignment.dueDate ? (
          <span className="text-[11.5px] leading-[17px] text-[#858c96]">
            {t("due", {
              date: formatDayMonth(calendarDay(assignment.dueDate), locale),
            })}
          </span>
        ) : null}
        <span
          className={`rounded-full border px-2.5 py-1 text-[11.5px] font-medium leading-[17px] ${CHIP_TONES[tone]}`}
        >
          {t(`assignmentStatus.${assignment.status}`)}
        </span>
        {canUpload ? (
          <label
            className={`${startupPrimaryActionClass} cursor-pointer ${isUploading ? "opacity-60" : ""}`}
          >
            {isUploading ? t("uploading") : t("upload")}
            <input
              type="file"
              className="sr-only"
              accept={DOCUMENT_UPLOAD_ACCEPT}
              disabled={isUploading}
              aria-label={t("uploadLabel", { title: assignment.title })}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) onUpload(file);
              }}
            />
          </label>
        ) : null}
      </div>
    </li>
  );
}

export function StartupProcessView() {
  const t = useTranslations("startupProcess");
  const locale = useLocale();
  const process = useStartupProcess();

  if (process.isLoading) {
    return (
      <StartupPageFrame>
        <p className="py-10 text-sm text-[#858c96]">{t("loading")}</p>
      </StartupPageFrame>
    );
  }
  if (process.error) {
    return (
      <StartupPageFrame>
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {process.error.message}
        </p>
      </StartupPageFrame>
    );
  }

  const round = process.selectedRound;

  return (
    <StartupPageFrame>
      <div className="space-y-5">
        <div
          data-slot="this-week"
          className="flex flex-col gap-4 lg:flex-row lg:items-start"
        >
          <ProgramWeekCard className="lg:flex-1" />
          <WeeklyCheckIn />
        </div>
        <section aria-label={t("stages")} className="space-y-3">
          {process.hasPhases ? (
            <ol className="grid auto-cols-[minmax(150px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-1">
              {process.phaseCards.map((card, index) => (
                <li key={card.phase.id}>
                  <PhaseCardButton
                    card={card}
                    number={index + 1}
                    selected={card.phase.id === process.selectedPhaseId}
                    onSelect={() => process.selectPhase(card.phase.id)}
                  />
                </li>
              ))}
            </ol>
          ) : (
            /* TEST UI: placeholder until the design team's screen; replace when it arrives. */
            <p className="rounded-xl border border-dashed border-[#e4e7ea] px-4 py-5 text-sm text-[#676e78]">
              {t("noPhases")}
            </p>
          )}
          {process.unphasedCount > 0 ? (
            /* TEST UI: placeholder until the design team's screen; replace when it arrives. */
            <button
              type="button"
              onClick={process.selectUnphased}
              aria-pressed={process.showUnphased}
              className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium ${process.showUnphased ? "border-[#e86f22] bg-[#fff4ec] text-[#9e4400]" : "border-[#e4e7ea] bg-white text-[#22262b]"}`}
            >
              {t("unphased", { count: process.unphasedCount })}
            </button>
          ) : null}
        </section>

        {process.hasPhases && !process.showUnphased ? (
          <section
            aria-label={t("focus")}
            className="space-y-3 rounded-[10px] bg-[#fff4ec] px-6 py-5"
          >
            {round ? (
              <>
                <h2 className="text-xl leading-7 text-[#22262b]">
                  {round.title}
                </h2>
                <div className="flex items-center gap-3 text-[13px] font-medium text-[#22262b]">
                  <span>{round.name}</span>
                  <span className="flex items-center gap-1">
                    <Image
                      src="/startup/calendar-orange.svg"
                      alt=""
                      width={24}
                      height={24}
                    />
                    {formatRoundRange(round.startsOn, round.endsOn, locale)}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-sm text-[#676e78]">{t("noRound")}</p>
            )}
          </section>
        ) : null}

        <section aria-labelledby="startup-assignments" className={cardClass}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h2 id="startup-assignments" className={cardTitleClass}>
                {process.assignmentsTitle}
              </h2>
              <p className="text-[12.5px] leading-[19px] text-[#676e78]">
                {t("assignmentsHint")}
              </p>
            </div>
            {process.hasPhases && process.totalAssignments > 0 ? (
              <button
                type="button"
                onClick={process.toggleShowAll}
                aria-pressed={process.showAll}
                className="shrink-0 text-[12.5px] font-medium leading-[19px] text-[#9e4400] hover:underline"
              >
                {process.showAll
                  ? t("thisStage")
                  : t("all", { count: process.totalAssignments })}
              </button>
            ) : null}
          </div>
          {process.assignments.length === 0 ? (
            <p className="text-sm text-[#858c96]">{t("stageEmpty")}</p>
          ) : (
            <ul className="space-y-3">
              {process.assignments.map((assignment) => (
                <AssignmentRow
                  key={assignment.id}
                  assignment={assignment}
                  source={[
                    assignment.createdByName,
                    t(
                      `source.${assignmentSourceKind(assignment.createdByRole)}`,
                    ),
                    process.roundName(assignment.roundId),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  isUploading={process.uploadingAssignmentId === assignment.id}
                  onUpload={(file) =>
                    process.uploadAssignment(assignment.id, file)
                  }
                />
              ))}
            </ul>
          )}
        </section>

        <section
          aria-labelledby="startup-completed-stages"
          className={cardClass}
        >
          <h2 id="startup-completed-stages" className={cardTitleClass}>
            {t("completedStages")}
          </h2>
          {process.completedPhases.length === 0 ? (
            <p className="text-sm text-[#858c96]">{t("noCompleted")}</p>
          ) : (
            <ul className="space-y-3">
              {process.completedPhases.map((row) => (
                <li
                  key={row.phase.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e4e7ea] bg-[#f8f9fa] px-3.5 py-3"
                >
                  <span className="flex items-center gap-2.5 text-[13px] font-medium leading-5 text-[#4a5059]">
                    <Image
                      src="/startup/done-ring.svg"
                      alt=""
                      width={16}
                      height={16}
                    />
                    {row.phase.name}
                  </span>
                  <span className="flex gap-5 text-xs leading-[18px] text-[#858c96]">
                    {row.phase.startDate && row.phase.endDate ? (
                      <span>
                        {formatStageRange(
                          row.phase.startDate,
                          row.phase.endDate,
                          locale,
                        )}
                      </span>
                    ) : null}
                    <span>
                      {t("completedCount", { count: row.completedAssignments })}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </StartupPageFrame>
  );
}
