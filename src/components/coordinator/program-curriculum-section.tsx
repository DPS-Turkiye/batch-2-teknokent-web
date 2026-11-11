"use client";

import {
  CalendarDays,
  Check,
  Info,
  Lock,
  Pencil,
  PlusCircle,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, type HTMLAttributes } from "react";

import { AdminOverlay } from "@/components/admin/admin-ui";
import {
  Grip,
  OutputTokens,
  PhaseTimeline,
} from "@/components/coordinator/program-phase-list";
import { ProgramWeekPlanEditor } from "@/components/coordinator/program-week-plan-editor";
import { WeeklyProgramCard } from "@/components/coordinator/weekly-program-card";
import { WeeklyProgramReview } from "@/components/coordinator/weekly-program-review";
import { useProgramCurriculum } from "@/hooks/use-program-curriculum";
import { useProgramWeekPlan } from "@/hooks/use-program-week-plan";
import { useWeeklyProgramImport } from "@/hooks/use-weekly-program-import";
import type { CoordinatorProgramDetail } from "@/interfaces/coordinator-program";
import {
  SettingsSection,
  type PhaseDraft,
} from "@/lib/coordinator-program-detail";
import { parseDay } from "@/lib/coordinator-programs";
import {
  outputTokens,
  phaseDateRange,
  PhaseStatus,
} from "@/lib/program-phases";
import { formatDayMonth } from "@/lib/utils";

type Curriculum = ReturnType<typeof useProgramCurriculum>;

const OUTLINE_BUTTON =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#e9ecef] bg-white px-[14px] py-2 text-[12.5px] font-medium text-[#22262b] disabled:text-[#aeb4bc]";
const DARK_BUTTON =
  "rounded-full bg-[#22262b] px-[14px] py-2 text-[12.5px] font-medium text-white disabled:bg-[#aeb4bc]";

/** Program Ayarları › Haftalık program & fazlar; each phase opens its own drawer. */
export function ProgramCurriculumSection({
  programId,
  detail,
  archived,
}: {
  programId: string;
  detail: CoordinatorProgramDetail;
  archived: boolean;
}) {
  const t = useTranslations("programCurriculum");
  const weekPlan = useProgramWeekPlan(programId, detail.program);
  const curriculum = useProgramCurriculum(programId, detail);
  const weekly = useWeeklyProgramImport(programId, detail);
  const program = detail.program;
  const [dragging, setDragging] = useState<number | null>(null);
  const locked = archived || curriculum.saving;
  const week =
    program.currentWeek && program.totalWeeks
      ? t("week", { current: program.currentWeek, total: program.totalWeeks })
      : null;

  return (
    <section
      id={SettingsSection.Curriculum.toLowerCase()}
      aria-labelledby="curriculum-title"
      className="space-y-4 rounded-[28px] border border-[#e9ecef] bg-white p-6"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <h2
            id="curriculum-title"
            className="text-[16px] font-semibold text-[#22262b]"
          >
            {t("title")}
          </h2>
          <p className="text-[12.5px] text-[#858c96]">{t("subtitle")}</p>
        </div>
        <button
          type="button"
          disabled={locked || !curriculum.canAdd}
          onClick={curriculum.openNew}
          className={OUTLINE_BUTTON}
        >
          <PlusCircle aria-hidden className="size-[15px]" />
          {t("addPhase")}
        </button>
      </div>

      <WeeklyProgramCard weekly={weekly} archived={archived} />

      {weekly.reviewing ? <WeeklyProgramReview weekly={weekly} /> : null}

      <PhaseTimeline
        phases={curriculum.phases}
        start={program.startDate}
        end={program.endDate}
        middle={
          <span className="font-semibold text-[#22262b]">
            {week ? t("todayWeek", { week }) : t("today")}
          </span>
        }
        statusOf={curriculum.statusOf}
      />

      {curriculum.phases.length === 0 ? (
        <p className="rounded-[20px] border border-dashed border-[#e9ecef] px-4 py-6 text-center text-[13px] text-[#858c96]">
          {t("empty")}
        </p>
      ) : (
        <ol aria-label={t("listLabel")} className="space-y-2.5">
          {curriculum.phases.map((phase, index) => (
            <PhaseRow
              key={phase.key}
              phase={phase}
              index={index}
              status={curriculum.statusOf(phase)}
              week={week}
              editable={!locked}
              onEdit={() => curriculum.openPhase(index)}
              dragProps={
                locked
                  ? undefined
                  : {
                      draggable: true,
                      onDragStart: () => setDragging(index),
                      onDragOver: (event) => event.preventDefault(),
                      onDrop: () => {
                        if (dragging !== null) curriculum.move(dragging, index);
                        setDragging(null);
                      },
                    }
              }
            />
          ))}
        </ol>
      )}

      <p className="flex items-center gap-2.5 rounded-[18px] bg-[#f7f8fa] px-4 py-3 text-[12.5px] text-[#676e78]">
        <Info aria-hidden className="size-4 shrink-0 text-[#858c96]" />
        {t("lockNote", { count: program.teamCount })}
      </p>

      <ProgramWeekPlanEditor plan={weekPlan} locked={archived} />

      {curriculum.editing ? (
        <PhaseDrawer
          curriculum={curriculum}
          programName={program.name}
          week={week}
        />
      ) : null}
    </section>
  );
}

const CHIP: Record<PhaseStatus, string> = {
  [PhaseStatus.Done]: "bg-[#eaf7f0] text-[#2f9e6b]",
  [PhaseStatus.Current]: "bg-[#22262b] text-white",
  [PhaseStatus.Planned]: "border border-[#e9ecef] bg-white text-[#676e78]",
};

function StatusChip({
  status,
  week,
}: {
  status: PhaseStatus;
  week: string | null;
}) {
  const t = useTranslations("programCurriculum");
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium ${CHIP[status]}`}
    >
      {status === PhaseStatus.Done ? (
        <span aria-hidden className="size-1.5 rounded-full bg-[#2f9e6b]" />
      ) : null}
      {status === PhaseStatus.Current
        ? week
          ? t("currentWeek", { week })
          : t("current")
        : status === PhaseStatus.Done
          ? t("done")
          : t("planned")}
    </span>
  );
}

function PhaseRow({
  phase,
  index,
  status,
  week,
  editable,
  onEdit,
  dragProps,
}: {
  phase: PhaseDraft;
  index: number;
  status: PhaseStatus;
  week: string | null;
  editable: boolean;
  onEdit: () => void;
  dragProps?:
    | Pick<
        HTMLAttributes<HTMLLIElement>,
        "draggable" | "onDragStart" | "onDragOver" | "onDrop"
      >
    | undefined;
}) {
  const t = useTranslations("programCurriculum");
  const locale = useLocale();
  const done = status === PhaseStatus.Done;
  const current = status === PhaseStatus.Current;
  const outputs = outputTokens(phase.expectedOutput ?? null).join(" · ");
  const name = phase.name.trim() || t("unnamed", { n: index + 1 });
  return (
    <li
      {...dragProps}
      className={`flex items-center gap-3.5 rounded-[20px] border px-4 py-3.5 ${
        current ? "border-[#22262b] bg-[#fafafb]" : "border-[#e9ecef] bg-white"
      }`}
    >
      {dragProps ? <Grip label={t("drag", { name })} /> : null}
      <span
        aria-hidden
        className={`grid size-7 shrink-0 place-items-center rounded-full text-[12.5px] font-semibold ${
          done || current
            ? "bg-[#22262b] text-white"
            : "bg-[#f5f6f8] text-[#22262b]"
        }`}
      >
        {done ? <Check className="size-3.5" /> : index + 1}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-[14px] font-medium ${
            done ? "text-[#676e78]" : "text-[#22262b]"
          }`}
        >
          {name}
        </span>
        {outputs ? (
          <span className="block truncate text-[12px] text-[#858c96]">
            {outputs}
          </span>
        ) : null}
      </span>
      <span className="hidden shrink-0 items-center gap-1.5 text-[12.5px] font-medium text-[#676e78] sm:inline-flex">
        {done ? (
          <Lock aria-label={t("datesLocked")} className="size-[15px]" />
        ) : (
          <CalendarDays aria-hidden className="size-[15px]" />
        )}
        {phaseDateRange(phase, locale) ?? t("noDates")}
      </span>
      <StatusChip status={status} week={week} />
      <button
        type="button"
        disabled={!editable}
        onClick={onEdit}
        aria-label={t("edit", { name })}
        className="grid size-7 shrink-0 place-items-center rounded-full text-[#676e78] hover:bg-[#f5f6f8] disabled:opacity-40"
      >
        <Pencil aria-hidden className="size-[17px]" />
      </button>
    </li>
  );
}

function PhaseDrawer({
  curriculum,
  programName,
  week,
}: {
  curriculum: Curriculum;
  programName: string;
  week: string | null;
}) {
  const t = useTranslations("programCurriculum");
  const locale = useLocale();
  const phase = curriculum.editing!;
  const status = curriculum.editingStatus ?? PhaseStatus.Planned;
  const locks = curriculum.locks ?? { start: false, end: false };
  const isNew = curriculum.editingIndex === null;
  const position = (curriculum.editingIndex ?? curriculum.phases.length) + 1;
  const effects = curriculum.effects;
  const day = (value: string) => formatDayMonth(parseDay(value), locale);
  const span = (days: number) =>
    Math.abs(days) % 7 === 0
      ? t("weeks", { count: Math.abs(days) / 7 })
      : t("days", { count: Math.abs(days) });
  const effectLines = effects
    ? [
        effects.startShift
          ? t("startMoved", {
              from: day(effects.startShift.from),
              to: day(effects.startShift.to),
            })
          : null,
        effects.endShift
          ? t(effects.endShift.days > 0 ? "endLonger" : "endShorter", {
              from: day(effects.endShift.from),
              to: day(effects.endShift.to),
              span: span(effects.endShift.days),
            })
          : null,
        (effects.startShift || effects.endShift) && effects.nextGap
          ? effects.nextGap.days < 0
            ? t("overlapsNext", { name: effects.nextGap.name })
            : t("gapToNext", {
                name: effects.nextGap.name,
                date: day(effects.nextGap.start),
                span: span(effects.nextGap.days),
              })
          : null,
      ].filter((line): line is string => Boolean(line))
    : [];
  if (effectLines.length && curriculum.teamCount > 0) {
    effectLines.push(t("teamsUpdated", { count: curriculum.teamCount }));
  }

  return (
    <AdminOverlay
      label={isNew ? t("newPhase") : t("editPhase")}
      onClose={curriculum.close}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-[560px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0px_16px_48px_0px_rgba(33,38,43,0.14)]"
      >
        <div className="flex items-center gap-3.5 px-7 pt-7 pb-5">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="flex flex-wrap items-center gap-2">
              <span className="text-[20px] font-semibold text-[#22262b]">
                {isNew ? t("newPhase") : t("editPhase")}
              </span>
              {isNew ? null : <StatusChip status={status} week={week} />}
            </p>
            <p className="text-[12.5px] text-[#858c96]">
              {t("drawerSubtitle", { program: programName, n: position })}
            </p>
          </div>
          <button
            type="button"
            onClick={curriculum.close}
            aria-label={t("close")}
            className="grid size-[34px] shrink-0 place-items-center rounded-full bg-[#f5f6f8] text-[#676e78]"
          >
            <X aria-hidden className="size-[18px]" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-[18px] overflow-y-auto px-7 pt-1 pb-7">
          <label className="block space-y-2 text-[12.5px] font-medium text-[#22262b]">
            {t("name")}
            <input
              value={phase.name}
              maxLength={120}
              onChange={(event) =>
                curriculum.update({ name: event.target.value })
              }
              className="h-[44px] w-full rounded-full border border-[#e9ecef] px-4 text-[13.5px] font-normal text-[#22262b] outline-none focus:border-[#22262b]"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <DateField
              label={t("start")}
              value={phase.startDate}
              locked={locks.start}
              onChange={(startDate) => curriculum.update({ startDate })}
            />
            <DateField
              label={t("end")}
              value={phase.endDate}
              locked={locks.end}
              onChange={(endDate) => curriculum.update({ endDate })}
            />
          </div>
          {locks.start ? (
            <p className="flex items-center gap-2 text-[12px] text-[#858c96]">
              <Lock aria-hidden className="size-3.5" />
              {status === PhaseStatus.Done
                ? t("doneLockHint")
                : t("currentLockHint")}
            </p>
          ) : null}
          <OutputTokens
            id="curriculum-phase-output"
            value={phase.expectedOutput ?? null}
            onChange={(expectedOutput) => curriculum.update({ expectedOutput })}
          />
          {effectLines.length ? (
            <div className="space-y-2.5 rounded-[20px] bg-[#fff6e5] px-[18px] py-4">
              <p className="flex items-center gap-2 text-[13.5px] font-semibold text-[#22262b]">
                <Info aria-hidden className="size-4 text-[#b7791f]" />
                {t("effectTitle")}
              </p>
              <ul className="space-y-2">
                {effectLines.map((line) => (
                  <li
                    key={line}
                    className="flex items-center gap-2 text-[12.5px] text-[#22262b]"
                  >
                    <span
                      aria-hidden
                      className="size-[5px] shrink-0 rounded-full bg-[#b7791f]"
                    />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {curriculum.editError ? (
            <p role="alert" className="text-[12.5px] text-[#d9464b]">
              {curriculum.editError}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t border-[#f0f2f4] px-7 pt-4 pb-6">
          {!isNew && status === PhaseStatus.Planned ? (
            <button
              type="button"
              disabled={curriculum.saving}
              onClick={curriculum.removeEditing}
              className="rounded-full px-[14px] py-2 text-[12.5px] font-medium text-[#22262b] disabled:text-[#aeb4bc]"
            >
              {t("remove")}
            </button>
          ) : (
            <span />
          )}
          <span className="flex gap-2">
            <button
              type="button"
              onClick={curriculum.close}
              className={OUTLINE_BUTTON}
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              disabled={curriculum.saving}
              onClick={curriculum.saveEditing}
              className={DARK_BUTTON}
            >
              {curriculum.saving ? t("saving") : t("save")}
            </button>
          </span>
        </div>
      </div>
    </AdminOverlay>
  );
}

function DateField({
  label,
  value,
  locked,
  onChange,
}: {
  label: string;
  value: string | null;
  locked: boolean;
  onChange: (value: string | null) => void;
}) {
  return (
    <label className="block space-y-2 text-[12.5px] font-medium text-[#22262b]">
      {label}
      <span
        className={`flex h-[44px] items-center gap-2 rounded-full border border-[#e9ecef] px-4 ${
          locked
            ? "bg-[#f5f6f8] text-[#858c96]"
            : "bg-white text-[#22262b] focus-within:border-[#22262b]"
        }`}
      >
        <CalendarDays aria-hidden className="size-4 shrink-0 text-[#858c96]" />
        <input
          type="date"
          value={value ?? ""}
          disabled={locked}
          onChange={(event) => onChange(event.target.value || null)}
          className="min-w-0 flex-1 bg-transparent text-[13.5px] font-normal outline-none"
        />
        {locked ? (
          <Lock aria-hidden className="size-[15px] shrink-0 text-[#858c96]" />
        ) : null}
      </span>
    </label>
  );
}
