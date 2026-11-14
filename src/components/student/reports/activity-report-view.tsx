"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Segmented } from "@/components/student/iskur-ui";
import { DailyReportView } from "@/components/student/reports/daily-report-view";
import { ReportDayPill } from "@/components/student/reports/report-day-pill";
import { WeeklySummaryView } from "@/components/student/reports/weekly-summary-view";
import { useReportDayLabel } from "@/hooks/use-report-format";
import { useReportWeek } from "@/hooks/use-report-week";
import { PeerReportView } from "@/types/peer-reports";

/**
 * "Faaliyet Raporum" (Figma 221:73 / 221:521): the Günlük / Haftalık segment, the week with its arrows, and one strip
 * of the week's five days for both views. A day card opens that day's Günlük view.
 */
export function ActivityReportView() {
  const t = useTranslations("iaIskurReports.shell");
  const dayLabel = useReportDayLabel();
  const report = useReportWeek();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Segmented
          label={t("viewLabel")}
          options={[
            { id: PeerReportView.Daily, label: t("daily") },
            { id: PeerReportView.Weekly, label: t("weekly") },
          ]}
          selected={report.view}
          onSelect={report.setView}
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={report.previousWeek}
            aria-label={t("previousWeek")}
            className="grid size-9 place-items-center rounded-full border border-border-default bg-background-surface hover:bg-background-subtle focus-visible:outline-2 focus-visible:outline-border-selected"
          >
            <ChevronLeft aria-hidden className="size-4" />
          </button>
          <span className="type-label text-text-primary">
            {report.weekLabel}
          </span>
          <button
            type="button"
            onClick={report.nextWeek}
            aria-label={t("nextWeek")}
            className="grid size-9 place-items-center rounded-full border border-border-default bg-background-surface hover:bg-background-subtle focus-visible:outline-2 focus-visible:outline-border-selected"
          >
            <ChevronRight aria-hidden className="size-4" />
          </button>
        </div>
      </div>

      <ol aria-label={t("days")} className="grid gap-3 sm:grid-cols-5">
        {report.cards.map((card) => (
          <li key={card.date}>
            <button
              type="button"
              aria-current={card.isSelected ? "date" : undefined}
              onClick={() => report.selectDay(card.date)}
              className={`flex w-full flex-col items-start gap-2 rounded-card border p-4 text-left focus-visible:outline-2 focus-visible:outline-border-selected ${
                card.isSelected
                  ? "border-border-selected bg-background-selected"
                  : "border-border-default bg-background-surface hover:bg-background-subtle"
              }`}
            >
              <span className="flex items-center gap-2 type-label text-text-primary">
                {dayLabel(card.date)}
                {card.isToday ? (
                  <span className="type-caption text-text-muted">
                    {t("today")}
                  </span>
                ) : null}
              </span>
              <ReportDayPill badge={card.badge} />
            </button>
          </li>
        ))}
      </ol>

      {report.view === PeerReportView.Daily ? (
        <DailyReportView day={report.day} dailySent={report.dailySent} />
      ) : (
        <WeeklySummaryView weekStart={report.weekStart} />
      )}
    </div>
  );
}
