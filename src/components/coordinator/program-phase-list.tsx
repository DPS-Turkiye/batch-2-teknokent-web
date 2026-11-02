"use client";

import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  ChevronUp,
  GripVertical,
  Pencil,
  PlusCircle,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";

import type { PhaseDraft } from "@/lib/coordinator-program-detail";
import {
  joinOutputs,
  missingDate,
  outputTokens,
  phaseDateRange,
  timelineSegments,
} from "@/lib/program-phases";
import { formatShortDate } from "@/lib/utils";

const FIELD =
  "mt-1.5 h-11 w-full rounded-full border border-[#e9ecef] px-4 text-[13.5px] text-[#22262b] outline-none focus:border-[#22262b]";

/** The program's phases as one bar, each segment as wide as the phase is long. */
export function PhaseTimeline({
  phases,
  start,
  end,
  middle,
}: {
  phases: PhaseDraft[];
  start: string | null;
  end: string | null;
  middle: ReactNode;
}) {
  const t = useTranslations("programPhases");
  const locale = useLocale();
  const segments = timelineSegments(phases);
  if (segments.length === 0) return null;
  return (
    <figure
      aria-label={t("timelineLabel")}
      className="rounded-[20px] bg-[#f7f8fa] px-[18px] py-4"
    >
      <figcaption className="flex justify-between gap-3 text-[11.5px] font-medium text-[#858c96]">
        <span>{start ? formatShortDate(start, locale) : ""}</span>
        <span className="text-[#676e78]">{middle}</span>
        <span>{end ? formatShortDate(end, locale) : ""}</span>
      </figcaption>
      <ol className="mt-2.5 flex gap-1">
        {segments.map((segment, index) => (
          <li
            key={segment.key}
            className="min-w-0"
            style={{ flex: `${segment.weight} 0 0` }}
          >
            <span
              aria-hidden
              className={`block h-2.5 rounded-full ${
                segment.missing
                  ? "border-[1.5px] border-dashed border-[#b7791f]"
                  : "bg-[#22262b]"
              }`}
              style={
                segment.missing
                  ? undefined
                  : { opacity: Math.max(0.4, 1 - index * 0.15) }
              }
            />
            <span
              className={`mt-1.5 block truncate text-[11px] font-medium ${
                segment.missing ? "text-[#b7791f]" : "text-[#676e78]"
              }`}
            >
              {segment.missing ? "?" : segment.name}
            </span>
          </li>
        ))}
      </ol>
    </figure>
  );
}

type PhaseListProps<T extends PhaseDraft> = {
  phases: T[];
  openKey: string | null;
  onToggle: (key: string) => void;
  onChange: (key: string, patch: Partial<T>) => void;
  onRemove: (key: string) => void;
  onMove: (from: number, to: number) => void;
  onAdd: () => void;
  canAdd: boolean;
  /** The chip at the row's right edge, e.g. "Dosyadan". */
  chip?: (phase: T) => ReactNode;
  /** Rows whose missing dates are flagged in amber. */
  flagMissingDates?: (phase: T) => boolean;
};

/** Phase rows: drag to reorder, open one to edit its name, dates and expected outputs. */
export function PhaseList<T extends PhaseDraft>({
  phases,
  openKey,
  onToggle,
  onChange,
  onRemove,
  onMove,
  onAdd,
  canAdd,
  chip,
  flagMissingDates,
}: PhaseListProps<T>) {
  const t = useTranslations("programPhases");
  const [dragging, setDragging] = useState<number | null>(null);

  return (
    <div className="space-y-2.5">
      <ol className="space-y-2.5">
        {phases.map((phase, index) => (
          <li
            key={phase.key}
            draggable={openKey !== phase.key}
            onDragStart={() => setDragging(index)}
            onDragEnd={() => setDragging(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (dragging !== null) onMove(dragging, index);
              setDragging(null);
            }}
            className={dragging === index ? "opacity-50" : ""}
          >
            {openKey === phase.key ? (
              <OpenPhase
                phase={phase}
                index={index}
                last={index === phases.length - 1}
                onToggle={onToggle}
                onChange={onChange}
                onRemove={onRemove}
                onMove={onMove}
              />
            ) : (
              <ClosedPhase
                phase={phase}
                index={index}
                flagged={
                  Boolean(flagMissingDates?.(phase)) && missingDate(phase)
                }
                chip={chip?.(phase)}
                onToggle={onToggle}
              />
            )}
          </li>
        ))}
      </ol>
      {canAdd ? (
        <button
          type="button"
          onClick={onAdd}
          className="flex w-full items-center justify-center gap-2 rounded-[20px] border border-dashed border-[#e9ecef] px-4 py-3.5 text-[13.5px] font-medium text-[#676e78] hover:bg-[#fafafb]"
        >
          <PlusCircle aria-hidden className="size-4" /> {t("addPhase")}
        </button>
      ) : null}
    </div>
  );
}

function Grip({ label }: { label: string }) {
  return (
    <span
      aria-label={label}
      role="img"
      className="shrink-0 cursor-grab text-[#aeb4bc]"
    >
      <GripVertical aria-hidden className="size-4" />
    </span>
  );
}

function ClosedPhase<T extends PhaseDraft>({
  phase,
  index,
  flagged,
  chip,
  onToggle,
}: {
  phase: T;
  index: number;
  flagged: boolean;
  chip: ReactNode;
  onToggle: (key: string) => void;
}) {
  const t = useTranslations("programPhases");
  const locale = useLocale();
  const name = phase.name.trim() || t("untitled");
  const dates = phaseDateRange(phase, locale);
  return (
    <div
      className={`flex items-center gap-3.5 rounded-[20px] border bg-white px-4 py-3.5 ${
        flagged ? "border-[#f2ddbe]" : "border-[#e9ecef]"
      }`}
    >
      <Grip label={t("drag", { n: index + 1 })} />
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#f5f6f8] text-[12.5px] font-semibold text-[#22262b]">
        {index + 1}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-medium text-[#22262b]">
          {name}
        </span>
        {phase.expectedOutput ? (
          <span className="block truncate text-[12px] text-[#858c96]">
            {phase.expectedOutput}
          </span>
        ) : null}
      </span>
      <span
        className={`flex shrink-0 items-center gap-1.5 text-[12.5px] font-medium ${
          flagged ? "text-[#b7791f]" : "text-[#676e78]"
        }`}
      >
        <CalendarDays aria-hidden className="size-[15px]" />
        {flagged ? t("dateMissing") : (dates ?? "—")}
      </span>
      {chip}
      <button
        type="button"
        aria-label={t("edit", { name })}
        onClick={() => onToggle(phase.key)}
        className="grid size-8 shrink-0 place-items-center rounded-full text-[#858c96] hover:bg-[#f4f5f7]"
      >
        <Pencil aria-hidden className="size-4" />
      </button>
    </div>
  );
}

function OpenPhase<T extends PhaseDraft>({
  phase,
  index,
  last,
  onToggle,
  onChange,
  onRemove,
  onMove,
}: {
  phase: T;
  index: number;
  last: boolean;
  onToggle: (key: string) => void;
  onChange: (key: string, patch: Partial<T>) => void;
  onRemove: (key: string) => void;
  onMove: (from: number, to: number) => void;
}) {
  const t = useTranslations("programPhases");
  const n = index + 1;
  const id = `phase-${phase.key}`;
  const set = (patch: Partial<PhaseDraft>) =>
    onChange(phase.key, patch as Partial<T>);
  return (
    <div className="space-y-3.5 rounded-[20px] border-[1.5px] border-[#22262b] bg-white px-[18px] pt-4 pb-[18px]">
      <div className="flex items-center gap-3.5">
        <Grip label={t("drag", { n })} />
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#22262b] text-[12.5px] font-semibold text-white">
          {n}
        </span>
        <span className="flex-1 text-[13px] font-semibold text-[#676e78]">
          {t("phaseLabel", { n })}
        </span>
        <button
          type="button"
          aria-label={t("moveUp", { n })}
          disabled={index === 0}
          onClick={() => onMove(index, index - 1)}
          className="grid size-8 place-items-center rounded-full text-[#858c96] hover:bg-[#f4f5f7] disabled:opacity-30"
        >
          <ArrowUp aria-hidden className="size-4" />
        </button>
        <button
          type="button"
          aria-label={t("moveDown", { n })}
          disabled={last}
          onClick={() => onMove(index, index + 1)}
          className="grid size-8 place-items-center rounded-full text-[#858c96] hover:bg-[#f4f5f7] disabled:opacity-30"
        >
          <ArrowDown aria-hidden className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => onRemove(phase.key)}
          className="rounded-full px-3.5 py-2 text-[12.5px] font-medium text-[#22262b] hover:bg-[#f4f5f7]"
        >
          {t("remove")}
        </button>
        <button
          type="button"
          aria-label={t("collapse")}
          onClick={() => onToggle(phase.key)}
          className="grid size-8 place-items-center rounded-full text-[#858c96] hover:bg-[#f4f5f7]"
        >
          <ChevronUp aria-hidden className="size-4" />
        </button>
      </div>
      <div className="space-y-3 sm:pl-[54px]">
        <div>
          <label
            htmlFor={`${id}-name`}
            className="text-[12.5px] font-medium text-[#22262b]"
          >
            {t("name")}
          </label>
          <input
            id={`${id}-name`}
            value={phase.name}
            maxLength={120}
            onChange={(event) => set({ name: event.target.value })}
            className={FIELD}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor={`${id}-start`}
              className="text-[12.5px] font-medium text-[#22262b]"
            >
              {t("start")}
            </label>
            <input
              id={`${id}-start`}
              type="date"
              value={phase.startDate ?? ""}
              onChange={(event) =>
                set({ startDate: event.target.value || null })
              }
              className={FIELD}
            />
          </div>
          <div>
            <label
              htmlFor={`${id}-end`}
              className="text-[12.5px] font-medium text-[#22262b]"
            >
              {t("end")}
            </label>
            <input
              id={`${id}-end`}
              type="date"
              value={phase.endDate ?? ""}
              onChange={(event) => set({ endDate: event.target.value || null })}
              className={FIELD}
            />
          </div>
        </div>
        <OutputTokens
          id={`${id}-output`}
          value={phase.expectedOutput}
          onChange={(expectedOutput) => set({ expectedOutput })}
        />
      </div>
    </div>
  );
}

/** Expected outputs as chips: Enter or a comma adds one, Backspace on an empty field removes the last. */
function OutputTokens({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const t = useTranslations("programPhases");
  const [text, setText] = useState("");
  const tokens = outputTokens(value);
  const add = () => {
    const token = text.trim();
    if (token) onChange(joinOutputs([...tokens, token]));
    setText("");
  };
  return (
    <div>
      <label htmlFor={id} className="text-[12.5px] font-medium text-[#22262b]">
        {t("expectedOutput")}
        <span className="ml-1.5 text-[12px] font-normal text-[#858c96]">
          {t("expectedOutputHint")}
        </span>
      </label>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 rounded-[22px] border border-[#e9ecef] px-2.5 py-[7px] focus-within:border-[#22262b]">
        {tokens.map((token, index) => (
          <span
            key={`${token}-${index}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f6f8] py-1 pr-2 pl-2.5 text-[12.5px] font-medium text-[#22262b]"
          >
            {token}
            <button
              type="button"
              aria-label={t("removeOutput", { output: token })}
              onClick={() =>
                onChange(joinOutputs(tokens.filter((_, at) => at !== index)))
              }
              className="text-[#858c96]"
            >
              <X aria-hidden className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              add();
            } else if (event.key === "Backspace" && !text && tokens.length) {
              onChange(joinOutputs(tokens.slice(0, -1)));
            }
          }}
          onBlur={add}
          placeholder={t("addOutput")}
          className="min-w-[120px] flex-1 bg-transparent px-1 text-[13px] text-[#22262b] outline-none placeholder:text-[#aeb4bc]"
        />
      </div>
    </div>
  );
}
