// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { createPortal } from "react-dom";

import { ModalDialog } from "@/components/common/modal-dialog";
import { Button, ButtonVariant } from "@/components/ia/button";
import { ReportDayPill } from "@/components/student/reports/report-day-pill";
import {
  useReportDayLabel,
  useReportDuration,
} from "@/hooks/use-report-format";
import type { PeerWeeklyReport } from "@/interfaces/peer-reports";
import {
  outcomeLines,
  WEEKLY_QUESTIONS,
  weeklySpan,
} from "@/lib/peer-weekly-report";
import type { PeerReportBadge } from "@/types/peer-reports";
import type { WeeklyAnswers, WeeklySkillBar } from "@/types/peer-weekly-report";

const TITLE_ID = "weekly-preview-title";

/*
 * While the preview is open, printing shows only the preview: every other child of <body> is hidden, and the dialog
 * drops its overlay, height cap and buttons. Tailwind builds these from the literal class names below.
 */
const BODY_PRINT_CLASSES = ["print:[&>*:not(.weekly-print-root)]:hidden"];

/**
 * "Önizle": the weekly summary as the coordinator will read it, with "PDF olarak indir / Yazdır" opening the browser's
 * print dialog (save as PDF there). No server-side PDF in v1 (Arya, 14 Nov).
 */
export function WeeklyPreviewDialog({
  report,
  badge,
  answers,
  skillBars,
  menteeNames,
  onClose,
  onPrint,
}: {
  report: PeerWeeklyReport;
  badge: PeerReportBadge | null;
  answers: WeeklyAnswers;
  skillBars: WeeklySkillBar[];
  menteeNames: string[];
  onClose: () => void;
  onPrint: () => void;
}) {
  const t = useTranslations("iaIskurReports.weekly");
  const tSkill = useTranslations("iaIskurReports.weekly.skill");
  const dayLabel = useReportDayLabel();
  const duration = useReportDuration();
  const { summary } = report;
  const span = weeklySpan(report);

  useEffect(() => {
    document.body.classList.add(...BODY_PRINT_CLASSES);
    return () => document.body.classList.remove(...BODY_PRINT_CLASSES);
  }, []);

  return createPortal(
    <div className="weekly-print-root">
      <ModalDialog
        labelledBy={TITLE_ID}
        onClose={onClose}
        overlayClassName="fixed inset-0 z-[60] grid place-items-center bg-black/35 px-4 print:static print:block print:bg-transparent print:p-0"
        panelClassName="max-h-[90vh] w-full max-w-3xl space-y-6 overflow-y-auto rounded-2xl bg-background-surface p-6 shadow-2xl outline-none sm:p-8 print:max-h-none print:max-w-none print:overflow-visible print:p-0 print:shadow-none"
      >
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 id={TITLE_ID} className="type-h3 text-text-primary">
              {t("preview.title")}
            </h2>
            <p className="type-body-sm text-text-secondary">
              {t("preview.week", {
                start: dayLabel(span.first),
                end: dayLabel(span.last),
              })}
            </p>
          </div>
          <ReportDayPill badge={badge} />
        </header>

        <section className="space-y-2">
          <h3 className="type-title-card text-text-primary">
            {t("summary.title")}
          </h3>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 type-body-sm sm:grid-cols-4">
            <PreviewFact
              label={t("summary.meetings")}
              value={`${summary.meetings} (${t("summary.meetingsSplit", {
                first: summary.firstMeetings,
                followUp: summary.followUpMeetings,
              })})`}
            />
            <PreviewFact
              label={t("summary.mentees")}
              value={
                menteeNames.length > 0
                  ? menteeNames.join(", ")
                  : t("summary.noMentees")
              }
            />
            <PreviewFact
              label={t("summary.reports")}
              value={t("summary.reportsValue", {
                sent: summary.meetingReportsSent,
                total: summary.meetingReportsTotal,
              })}
            />
            <PreviewFact
              label={t("summary.activities")}
              value={String(summary.activities)}
            />
          </dl>
          <p className="type-label text-text-primary">
            {t("summary.recorded", {
              duration: duration(summary.recordedMinutes),
            })}
          </p>
          <p className="type-caption text-text-secondary">
            {t("summary.recordedNote")}
          </p>
        </section>

        {skillBars.length > 0 ? (
          <section className="space-y-2">
            <h3 className="type-title-card text-text-primary">
              {t("skills.title")}
            </h3>
            <ul className="space-y-1 type-body-sm text-text-primary">
              {skillBars.map((bar) => (
                <li key={bar.skill}>
                  {`${tSkill(bar.skill)} · ${t("skills.meetings", { count: bar.meetings })}`}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {summary.outcomes.length > 0 ? (
          <section className="space-y-3">
            <h3 className="type-title-card text-text-primary">
              {t("outcomes.title")}
            </h3>
            {summary.outcomes.map((outcome) => (
              <div key={outcome.menteeId} className="space-y-1">
                <p className="type-label text-text-primary">
                  {`${outcome.fullName} ${t("outcomes.meetings", { count: outcome.meetings })}`}
                </p>
                {outcomeLines(outcome).map((line) => (
                  <p
                    key={line.meetingId}
                    className="type-body-sm text-text-secondary"
                  >
                    {line.text}
                  </p>
                ))}
              </div>
            ))}
          </section>
        ) : null}

        <section className="space-y-3">
          <h3 className="type-title-card text-text-primary">
            {t("preview.answers")}
          </h3>
          {WEEKLY_QUESTIONS.map((question) => (
            <div key={question} className="space-y-1">
              <p className="type-label text-text-primary">
                {t(`evaluation.${question}`)}
              </p>
              <p className="type-body-sm whitespace-pre-line text-text-secondary">
                {answers[question].trim() || t("preview.noAnswer")}
              </p>
            </div>
          ))}
        </section>

        <footer className="flex flex-col gap-3 border-t border-border-subtle pt-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <p className="type-caption text-text-muted">
            {t("preview.printHint")}
          </p>
          <div className="flex gap-3">
            <Button variant={ButtonVariant.Ghost} onClick={onClose}>
              {t("preview.close")}
            </Button>
            <Button onClick={onPrint}>{t("preview.print")}</Button>
          </div>
        </footer>
      </ModalDialog>
    </div>,
    document.body,
  );
}

function PreviewFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <dt className="type-caption text-text-muted">{label}</dt>
      <dd className="text-text-primary">{value}</dd>
    </div>
  );
}
