"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, type CSSProperties } from "react";

import { ViewSwitch } from "@/components/academician/view-switch";
import type {
  AcademicianAppointmentsCalendar,
  CalendarBlock,
  PlacedBlock,
} from "@/hooks/use-academician-appointments-calendar";
import {
  AppointmentsCalendarView,
  CalendarEntryKind,
} from "@/types/academician-calendar";

/** One grid hour; tall enough that the shortest block (45 min) still shows a name and a status. */
const HOUR_PX = 52;

const ENTRY_STYLE: Record<CalendarEntryKind, string> = {
  [CalendarEntryKind.Confirmed]: "bg-background-inverse text-text-inverse",
  [CalendarEntryKind.PendingRequest]:
    "border border-dashed border-status-warning-icon bg-status-warning-bg text-status-warning-text",
  [CalendarEntryKind.AwaitingStudent]:
    "border border-dashed border-status-warning-icon bg-background-surface text-status-warning-text",
  [CalendarEntryKind.Recurring]: "bg-background-subtle text-text-secondary",
  [CalendarEntryKind.OneOff]: "bg-status-info-bg text-status-info-text",
  [CalendarEntryKind.Unavailable]: "bg-brand-odtu-bg text-brand-odtu-strong",
};

const LEGEND: { kind: CalendarEntryKind; swatch: string }[] = [
  { kind: CalendarEntryKind.Recurring, swatch: "bg-background-subtle" },
  { kind: CalendarEntryKind.OneOff, swatch: "bg-status-info-bg" },
  { kind: CalendarEntryKind.Confirmed, swatch: "bg-background-inverse" },
  {
    kind: CalendarEntryKind.PendingRequest,
    swatch:
      "border border-dashed border-status-warning-icon bg-status-warning-bg",
  },
  {
    kind: CalendarEntryKind.AwaitingStudent,
    swatch: "border border-dashed border-status-warning-icon",
  },
  { kind: CalendarEntryKind.Unavailable, swatch: "bg-brand-odtu-bg" },
];

export function AppointmentsCalendarCard({
  calendar,
}: {
  calendar: AcademicianAppointmentsCalendar;
}) {
  const t = useTranslations("iaAcademician.appointments");
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      className="rounded-card border border-border-default bg-background-surface p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id={titleId}
          aria-live="polite"
          className="type-h4 text-text-primary"
        >
          {calendar.title}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <ViewSwitch value={calendar.view} onChange={calendar.setView} />
          <button
            type="button"
            onClick={calendar.goToToday}
            className="h-9 rounded-xl bg-brand-odtu-bg px-3 type-label text-brand-odtu-strong focus-visible:outline-2 focus-visible:outline-border-selected"
          >
            {t("today")}
          </button>
          <button
            type="button"
            aria-label={t("previous")}
            onClick={calendar.previous}
            className="grid size-9 place-items-center rounded-xl text-icon-default hover:bg-background-subtle focus-visible:outline-2 focus-visible:outline-border-selected"
          >
            <ChevronLeft aria-hidden className="size-4" />
          </button>
          <button
            type="button"
            aria-label={t("next")}
            onClick={calendar.next}
            className="grid size-9 place-items-center rounded-xl text-icon-default hover:bg-background-subtle focus-visible:outline-2 focus-visible:outline-border-selected"
          >
            <ChevronRight aria-hidden className="size-4" />
          </button>
        </div>
      </div>
      <div className="mt-5">
        <CalendarBody calendar={calendar} />
      </div>
      <ul
        aria-label={t("legendLabel")}
        className="mt-4 flex flex-wrap gap-x-5 gap-y-2"
      >
        {LEGEND.map(({ kind, swatch }) => (
          <li
            key={kind}
            className="flex items-center gap-2 type-caption text-text-secondary"
          >
            <span aria-hidden className={`size-3 rounded ${swatch}`} />
            {t(`legend.${kind}`)}
          </li>
        ))}
      </ul>
    </section>
  );
}

function CalendarBody({
  calendar,
}: {
  calendar: AcademicianAppointmentsCalendar;
}) {
  switch (calendar.view) {
    case AppointmentsCalendarView.Day:
      return <TimeGrid calendar={calendar} inline />;
    case AppointmentsCalendarView.Week:
      return <TimeGrid calendar={calendar} inline={false} />;
    case AppointmentsCalendarView.Month:
      return <MonthGrid calendar={calendar} />;
  }
}

/**
 * The hourly grid of the day and week views. The week shows a header per day and stacks a block's name over its
 * status; the day view has one wide column and writes a block on one line, as the frames do.
 */
function TimeGrid({
  calendar,
  inline,
}: {
  calendar: AcademicianAppointmentsCalendar;
  inline: boolean;
}) {
  const height = calendar.gridHours * HOUR_PX;
  const columns = calendar.columns.length;
  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-[640px] pt-2"
        style={{
          gridTemplateColumns: `48px repeat(${String(columns)}, minmax(0, 1fr))`,
        }}
      >
        {inline ? null : (
          <>
            <span />
            {calendar.columns.map((column) => (
              <span
                key={column.key}
                className={`px-2 pb-2 type-caption ${
                  column.isToday
                    ? "text-brand-odtu-strong"
                    : "text-text-secondary"
                }`}
              >
                {column.label}
              </span>
            ))}
          </>
        )}
        <ol aria-hidden className="relative" style={{ height }}>
          {calendar.hourLabels.map((label, index) => (
            <li
              key={label}
              className="absolute -translate-y-1/2 type-caption text-text-muted"
              style={{ top: index * HOUR_PX }}
            >
              {label}
            </li>
          ))}
        </ol>
        {calendar.columns.map((column) => (
          <section
            key={column.key}
            aria-label={column.longLabel}
            className="relative border-l border-border-subtle last:border-r"
            style={{
              height,
              backgroundImage: `repeating-linear-gradient(to bottom, var(--color-border-subtle) 0 1px, transparent 1px ${String(HOUR_PX)}px)`,
            }}
          >
            {column.unavailable ? (
              <div
                className={`absolute inset-x-1 inset-y-0 rounded-lg p-2 ${ENTRY_STYLE[CalendarEntryKind.Unavailable]}`}
              >
                <p className="type-label-sm">{column.unavailable.title}</p>
                {column.unavailable.detail === null ? null : (
                  <p className="type-caption">{column.unavailable.detail}</p>
                )}
              </div>
            ) : null}
            {column.background.map((block) => (
              <Band key={block.key} block={block} inline={inline} />
            ))}
            <ol className="contents">
              {column.foreground.map((block) => (
                <li key={block.key}>
                  <Block block={block} inline={inline} />
                </li>
              ))}
            </ol>
            {column.nowOffset === null ? null : (
              <span
                aria-hidden
                className="absolute inset-x-0 z-20 border-t-2 border-brand-odtu-strong"
                style={{ top: column.nowOffset * HOUR_PX }}
              >
                <span className="absolute -top-[5px] -left-1 size-2 rounded-full bg-brand-odtu-strong" />
              </span>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

function boxStyle(block: PlacedBlock): CSSProperties {
  return {
    top: block.top * HOUR_PX + 1,
    height: block.height * HOUR_PX - 2,
  };
}

/** Availability behind the appointments: not a control, so screen readers get it from the rail instead. */
function Band({ block, inline }: { block: PlacedBlock; inline: boolean }) {
  return (
    <div
      aria-hidden
      className={`absolute inset-x-1 overflow-hidden rounded-lg px-2 py-1 ${ENTRY_STYLE[block.kind]}`}
      style={boxStyle(block)}
    >
      {inline ? (
        <>
          <p className="type-label-sm">{`${block.title} · ${block.hours}`}</p>
          <p className="type-caption">{block.detail}</p>
        </>
      ) : (
        <>
          <p className="truncate type-label-sm">{block.title}</p>
          <p className="truncate type-caption">{block.detail}</p>
        </>
      )}
    </div>
  );
}

function Block({ block, inline }: { block: PlacedBlock; inline: boolean }) {
  // The day view leaves the left third to the availability band's label, as in the frame.
  const start = inline ? 30 : 0;
  const width = (100 - start) / block.lanes;
  return (
    <button
      type="button"
      aria-label={block.ariaLabel}
      data-tour={block.tourAnchor ? "calendar-pending-request" : undefined}
      onClick={block.open ?? undefined}
      className={`absolute z-10 overflow-hidden rounded-lg px-2 py-1 text-left focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-border-selected ${ENTRY_STYLE[block.kind]}`}
      style={{
        ...boxStyle(block),
        left: `calc(${String(start + block.lane * width)}% + 4px)`,
        width: `calc(${String(width)}% - 8px)`,
      }}
    >
      {inline ? (
        <span className="block truncate type-label-sm">
          {`${block.hours} · ${block.title} · ${block.detail}`}
        </span>
      ) : (
        <>
          <span className="block truncate type-label-sm">{block.title}</span>
          <span className="block truncate type-caption">{block.detail}</span>
        </>
      )}
    </button>
  );
}

function MonthGrid({
  calendar,
}: {
  calendar: AcademicianAppointmentsCalendar;
}) {
  const t = useTranslations("iaAcademician.appointments");
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[640px] grid-cols-7">
        {calendar.monthHeaders.map((label) => (
          <span
            key={label}
            className="px-2 pb-2 type-caption text-text-secondary"
          >
            {label}
          </span>
        ))}
        {calendar.monthCells.map((cell) => (
          <div
            key={cell.key}
            className={`min-h-24 space-y-1 border-t border-l border-border-subtle p-1.5 [&:nth-child(7n)]:border-r ${
              cell.unavailable ? "bg-brand-odtu-bg" : ""
            }`}
          >
            <button
              type="button"
              aria-label={t("openDay", { day: cell.dayLabel })}
              onClick={cell.openDay}
              className={`grid size-6 place-items-center rounded-full type-label-sm focus-visible:outline-2 focus-visible:outline-border-selected ${dayNumberClass(cell)}`}
            >
              {cell.dayNumber}
            </button>
            {cell.unavailable ? (
              <p className="px-1 type-caption text-brand-odtu-strong">
                {t("entry.unavailable")}
              </p>
            ) : null}
            {cell.chips.map((chip) => (
              <MonthChip key={chip.key} chip={chip} />
            ))}
            {cell.overflow > 0 ? (
              <p className="px-1 type-caption text-text-muted">
                {t("more", { count: cell.overflow })}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function dayNumberClass(cell: { isToday: boolean; inMonth: boolean }) {
  if (cell.isToday) return "bg-background-inverse text-text-inverse";
  return cell.inMonth ? "text-text-primary" : "text-text-disabled";
}

function MonthChip({ chip }: { chip: CalendarBlock }) {
  const className = `block w-full truncate rounded px-1.5 py-0.5 text-left type-caption ${ENTRY_STYLE[chip.kind]}`;
  if (chip.open === null) {
    return <p className={className}>{chip.title}</p>;
  }
  return (
    <button
      type="button"
      aria-label={chip.ariaLabel}
      data-tour={chip.tourAnchor ? "calendar-pending-request" : undefined}
      onClick={chip.open}
      className={`${className} focus-visible:outline-2 focus-visible:outline-border-selected`}
    >
      {chip.title}
    </button>
  );
}
