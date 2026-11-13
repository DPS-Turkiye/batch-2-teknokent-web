"use client";

import { Check, ChevronRight, Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import type { ReactNode } from "react";

import { QueryNotice } from "@/components/admin/admin-ui";
import { Button, ButtonSize, ButtonVariant } from "@/components/ia/button";
import { InlineAlert } from "@/components/ia/inline-alert";
import { StatusTone } from "@/components/ia/status-badge";
import {
  InitialsAvatar,
  ISKUR_FIELD_CLASS,
  Tag,
} from "@/components/student/iskur-ui";
import { ReportDayPill } from "@/components/student/reports/report-day-pill";
import { WeeklyPreviewDialog } from "@/components/student/reports/weekly-preview-dialog";
import {
  useReportDayLabel,
  useReportDuration,
} from "@/hooks/use-report-format";
import { useWeeklyReport } from "@/hooks/use-weekly-report";
import type { PeerWeeklyReport } from "@/interfaces/peer-reports";
import {
  formatReportDeadline,
  formatReportTime,
  latestOutcomeMeetingId,
  missingMeetingReports,
  outcomeActionProgress,
  outcomeLines,
  peerMeetingReportHref,
  WEEKLY_QUESTIONS,
  type WeeklyDayCard,
  type WeeklyOutcome,
} from "@/lib/peer-weekly-report";
import { initials } from "@/lib/utils";
import type { PeerReportBadge } from "@/types/peer-reports";
import {
  WeeklyCheck,
  WeeklyQuestion,
  WeeklyStatusNote,
  type WeeklyAnswers,
  type WeeklyCheckItem,
  type WeeklySkillBar,
  type WeeklySubmitBlock,
} from "@/types/peer-weekly-report";

function answerId(question: WeeklyQuestion) {
  return `weekly-${question}`;
}

/** "Raporu Düzenle" on a week sent back moves the mentor to the evaluation. */
const FIRST_ANSWER_ID = answerId(WeeklyQuestion.NeedsObserved);

const REPORT_CARD_CLASS =
  "rounded-[20px] border border-border-subtle bg-background-surface";

/**
 * Faaliyet Raporum › Haftalık Özet (Figma 221:521), below the Günlük/Haftalık switch and the week picker, which the
 * report tab owns and passes in as `weekStart` (a Monday, "yyyy-mm-dd"). `onOpenDay` opens a day's daily report.
 */
export function WeeklySummaryView({
  weekStart,
  onOpenDay,
}: {
  weekStart: string;
  onOpenDay?: ((day: string) => void) | undefined;
}) {
  const weekly = useWeeklyReport(weekStart);
  const { report } = weekly;

  if (!report) {
    return (
      <QueryNotice
        isLoading={weekly.query.isLoading}
        error={weekly.query.error}
      />
    );
  }
  return (
    <div className="space-y-6">
      <DayStrip days={weekly.days} />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <SummaryCard report={report} menteeNames={weekly.menteeNames} />
          <SkillsCard
            bars={weekly.skillBars}
            meetings={report.summary.meetings}
          />
          <OutcomesCard outcomes={report.summary.outcomes} />
          <EvaluationCard
            answers={weekly.answers}
            editable={weekly.editable}
            onChange={weekly.setAnswer}
          />
        </div>
        <aside className="flex w-full flex-col gap-5 lg:w-[360px] lg:shrink-0">
          <SideDays days={weekly.days} onOpenDay={onOpenDay} />
          <StatusCard
            report={report}
            badge={weekly.badge}
            note={weekly.statusNote}
            checklist={weekly.checklist}
          />
        </aside>
      </div>
      <Footer
        editable={weekly.editable}
        reason={weekly.blockReason}
        opensAt={report.opensAt}
        isSaving={weekly.isSaving}
        isSubmitting={weekly.isSubmitting}
        onPreview={weekly.preview.show}
        onSave={weekly.save}
        onSubmit={weekly.submit}
      />
      {weekly.preview.open ? (
        <WeeklyPreviewDialog
          report={report}
          badge={weekly.badge}
          answers={weekly.answers}
          skillBars={weekly.skillBars}
          menteeNames={weekly.menteeNames}
          onClose={weekly.preview.close}
          onPrint={weekly.preview.print}
        />
      ) : null}
    </div>
  );
}

function DayStrip({ days }: { days: WeeklyDayCard[] }) {
  const t = useTranslations("iaIskurReports.weekly.days");
  const dayLabel = useReportDayLabel();
  return (
    <ul
      aria-label={t("label")}
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
    >
      {days.map((day) => (
        <li
          key={day.date}
          className="flex flex-col items-start gap-2 rounded-2xl border border-border-subtle bg-background-surface p-4"
        >
          <p className="flex flex-wrap items-baseline gap-1.5">
            <span className="type-label text-text-primary">
              {dayLabel(day.date)}
            </span>
            {day.isToday ? (
              <span className="type-caption text-text-muted">{t("today")}</span>
            ) : null}
          </p>
          <ReportDayPill badge={day.badge} />
        </li>
      ))}
    </ul>
  );
}

function CardHeading({
  id,
  title,
  subtitle,
  aside,
}: {
  id: string;
  title: string;
  subtitle?: string | undefined;
  aside?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id={id} className="type-h4 text-text-primary">
          {title}
        </h2>
        {aside}
      </div>
      {subtitle ? (
        <p className="type-body-sm text-text-secondary">{subtitle}</p>
      ) : null}
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-2xl bg-background-subtle p-4">
      <p className="type-caption text-text-secondary">{label}</p>
      <p className="font-display text-[28px] leading-8 font-bold tracking-[-0.42px] text-text-primary">
        {value}
      </p>
      <p className="truncate type-caption text-text-muted" title={hint}>
        {hint}
      </p>
    </div>
  );
}

function SummaryCard({
  report,
  menteeNames,
}: {
  report: PeerWeeklyReport;
  menteeNames: string[];
}) {
  const t = useTranslations("iaIskurReports.weekly.summary");
  const tType = useTranslations("iaIskurReports.weekly.activityType");
  const duration = useReportDuration();
  const { summary } = report;
  const missing = missingMeetingReports(summary);
  return (
    <section
      aria-labelledby="weekly-summary-title"
      className={`${REPORT_CARD_CLASS} flex flex-col gap-5 p-6 sm:p-7`}
    >
      <CardHeading
        id="weekly-summary-title"
        title={t("title")}
        aside={<Tag>{t("auto")}</Tag>}
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric
          label={t("meetings")}
          value={String(summary.meetings)}
          hint={t("meetingsSplit", {
            first: summary.firstMeetings,
            followUp: summary.followUpMeetings,
          })}
        />
        <Metric
          label={t("mentees")}
          value={String(summary.mentees.length)}
          hint={
            menteeNames.length > 0 ? menteeNames.join(", ") : t("noMentees")
          }
        />
        <Metric
          label={t("reports")}
          value={t("reportsValue", {
            sent: summary.meetingReportsSent,
            total: summary.meetingReportsTotal,
          })}
          hint={
            missing > 0
              ? t("reportsMissing", { count: missing })
              : t("reportsAllSent")
          }
        />
        <Metric
          label={t("activities")}
          value={String(summary.activities)}
          hint={
            summary.activityTypes.length > 0
              ? summary.activityTypes.map((type) => tType(type)).join(", ")
              : t("noActivities")
          }
        />
      </div>
      <div className="flex items-center gap-3 rounded-[14px] bg-brand-odtu-bg px-4 py-3.5">
        <Clock
          aria-hidden
          className="size-[18px] shrink-0 stroke-[1.5] text-brand-odtu-primary"
        />
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="type-title-card text-text-primary">
            {t("recorded", { duration: duration(summary.recordedMinutes) })}
          </p>
          <p className="type-caption text-text-secondary">
            {t("recordedNote")}
          </p>
        </div>
      </div>
    </section>
  );
}

function SkillsCard({
  bars,
  meetings,
}: {
  bars: WeeklySkillBar[];
  meetings: number;
}) {
  const t = useTranslations("iaIskurReports.weekly.skills");
  const tSkill = useTranslations("iaIskurReports.weekly.skill");
  return (
    <section
      aria-labelledby="weekly-skills-title"
      className={`${REPORT_CARD_CLASS} flex flex-col gap-5 p-6 sm:p-7`}
    >
      <CardHeading
        id="weekly-skills-title"
        title={t("title")}
        subtitle={t("subtitle", { count: meetings })}
      />
      {bars.length === 0 ? (
        <p className="type-body-sm text-text-secondary">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-3.5">
          {bars.map((bar) => (
            <li
              key={bar.skill}
              className="grid grid-cols-[minmax(0,140px)_1fr_auto] items-center gap-4 sm:grid-cols-[180px_1fr_80px]"
            >
              <span className="type-body-sm text-text-primary">
                {tSkill(bar.skill)}
              </span>
              <span
                aria-hidden
                className="h-2.5 overflow-hidden rounded-full bg-background-muted"
              >
                <span
                  className="block h-2.5 rounded-full bg-brand-odtu-primary"
                  style={{ width: `${bar.percent}%` }}
                />
              </span>
              <span className="type-caption text-text-muted">
                {t("meetings", { count: bar.meetings })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function OutcomesCard({ outcomes }: { outcomes: WeeklyOutcome[] }) {
  const t = useTranslations("iaIskurReports.weekly.outcomes");
  return (
    <section
      aria-labelledby="weekly-outcomes-title"
      className={`${REPORT_CARD_CLASS} flex flex-col`}
    >
      <div className="px-6 pt-6 pb-4 sm:px-7">
        <CardHeading
          id="weekly-outcomes-title"
          title={t("title")}
          subtitle={t("subtitle")}
        />
      </div>
      {outcomes.length === 0 ? (
        <p className="border-t border-border-subtle px-6 py-5 type-body-sm text-text-secondary sm:px-7">
          {t("empty")}
        </p>
      ) : (
        <ul>
          {outcomes.map((outcome) => (
            <OutcomeRow key={outcome.menteeId} outcome={outcome} />
          ))}
        </ul>
      )}
    </section>
  );
}

function OutcomeRow({ outcome }: { outcome: WeeklyOutcome }) {
  const t = useTranslations("iaIskurReports.weekly.outcomes");
  const lines = outcomeLines(outcome);
  const meetingId = latestOutcomeMeetingId(outcome);
  const actions = outcomeActionProgress(outcome);
  return (
    <li className="flex gap-4 border-t border-border-subtle px-6 py-[18px] sm:px-7">
      <InitialsAvatar initials={initials(outcome.fullName)} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <p className="flex flex-wrap items-baseline gap-2">
            <span className="type-title-card text-text-primary">
              {outcome.fullName}
            </span>
            <span className="type-caption text-text-muted">
              {t("meetings", { count: outcome.meetings })}
            </span>
          </p>
          {meetingId ? (
            <Link
              href={peerMeetingReportHref(meetingId)}
              aria-label={t("openFor", { name: outcome.fullName })}
              className="type-label text-text-link hover:underline"
            >
              {t("open")}
            </Link>
          ) : null}
        </div>
        {lines.length > 0 ? (
          lines.map((line) => (
            <p
              key={line.meetingId}
              className="type-body-sm text-text-secondary"
            >
              {line.text}
            </p>
          ))
        ) : (
          <p className="type-body-sm text-text-muted">{t("noOutcome")}</p>
        )}
        {actions ? (
          <p className="type-caption text-status-success-text">
            {actions.all
              ? t("allActions")
              : t("actions", { done: actions.done, total: actions.total })}
          </p>
        ) : null}
      </div>
    </li>
  );
}

function EvaluationCard({
  answers,
  editable,
  onChange,
}: {
  answers: WeeklyAnswers;
  editable: boolean;
  onChange: (question: WeeklyQuestion, value: string) => void;
}) {
  const t = useTranslations("iaIskurReports.weekly.evaluation");
  return (
    <section
      aria-labelledby="weekly-evaluation-title"
      className={`${REPORT_CARD_CLASS} flex flex-col gap-5 p-6 sm:p-7`}
    >
      <CardHeading
        id="weekly-evaluation-title"
        title={t("title")}
        subtitle={t("subtitle")}
      />
      {WEEKLY_QUESTIONS.map((question) => {
        const id = answerId(question);
        return (
          <div key={question} className="flex flex-col gap-2">
            <label htmlFor={id} className="flex gap-1 type-label">
              <span className="text-text-primary">{t(question)}</span>
              <span aria-hidden className="text-status-error-text">
                *
              </span>
            </label>
            <textarea
              id={id}
              aria-required={editable}
              readOnly={!editable}
              value={answers[question]}
              onChange={(event) => onChange(question, event.target.value)}
              className={`${ISKUR_FIELD_CLASS} h-[120px] resize-y read-only:bg-background-subtle`}
            />
          </div>
        );
      })}
    </section>
  );
}

function SideDays({
  days,
  onOpenDay,
}: {
  days: WeeklyDayCard[];
  onOpenDay: ((day: string) => void) | undefined;
}) {
  const t = useTranslations("iaIskurReports.weekly.sideDays");
  const tStatus = useTranslations("iaIskurReports.status");
  const dayLabel = useReportDayLabel();
  return (
    <section
      aria-labelledby="weekly-days-title"
      className={`${REPORT_CARD_CLASS} flex flex-col gap-2.5 p-6`}
    >
      <h2 id="weekly-days-title" className="type-title-card text-text-primary">
        {t("title")}
      </h2>
      <ul className="flex flex-col">
        {days.map((day) => {
          const label = dayLabel(day.date);
          const content = (
            <>
              <span className="flex-1 text-left type-label text-text-primary">
                {label}
              </span>
              <ReportDayPill badge={day.badge} />
            </>
          );
          return (
            <li key={day.date}>
              {onOpenDay ? (
                <button
                  type="button"
                  aria-label={t("open", {
                    day: label,
                    status: tStatus(day.badge ?? "notStarted"),
                  })}
                  onClick={() => onOpenDay(day.date)}
                  className="flex w-full items-center gap-2.5 rounded-lg py-1.5 hover:bg-background-subtle focus-visible:outline-2 focus-visible:outline-border-selected"
                >
                  {content}
                  <ChevronRight
                    aria-hidden
                    className="size-4 stroke-[1.5] text-text-muted"
                  />
                </button>
              ) : (
                <div className="flex items-center gap-2.5 py-1.5">
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function StatusCard({
  report,
  badge,
  note,
  checklist,
}: {
  report: PeerWeeklyReport;
  badge: PeerReportBadge | null;
  note: WeeklyStatusNote | null;
  checklist: WeeklyCheckItem[];
}) {
  const t = useTranslations("iaIskurReports.weekly.status");
  const locale = useLocale();
  return (
    <section
      aria-labelledby="weekly-status-title"
      className={`${REPORT_CARD_CLASS} flex flex-col gap-3 p-6`}
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="weekly-status-title"
          className="type-title-card text-text-primary"
        >
          {t("title")}
        </h2>
        <ReportDayPill badge={badge} />
      </div>
      <p className="flex items-start justify-between gap-3">
        <span className="type-body-sm text-text-secondary">{t("opensAt")}</span>
        <span className="type-label text-text-primary">
          {formatReportTime(report.opensAt, locale)}
        </span>
      </p>
      <p className="flex items-start justify-between gap-3">
        <span className="type-body-sm text-text-secondary">
          {t("deadline")}
        </span>
        <span className="type-label text-text-primary">
          {formatReportDeadline(report.deadline, locale)}
        </span>
      </p>
      <hr className="border-border-subtle" />
      <ul className="flex flex-col gap-3">
        {checklist.map((item) => (
          <CheckRow key={item.check} item={item} />
        ))}
      </ul>
      {note ? <StatusNoteAlert note={note} report={report} /> : null}
    </section>
  );
}

function CheckRow({ item }: { item: WeeklyCheckItem }) {
  const t = useTranslations("iaIskurReports.weekly.check");
  const counts = { done: item.done, total: item.total };
  const label = {
    [WeeklyCheck.DailyReports]: t("dailyReports", counts),
    [WeeklyCheck.MeetingReports]: t("meetingReports", counts),
    [WeeklyCheck.Evaluation]: t("evaluation", counts),
  }[item.check];
  return (
    <li className="flex items-start gap-2.5">
      <span
        className={`mt-px grid size-5 shrink-0 place-items-center rounded-full ${
          item.complete
            ? "bg-status-success-icon text-text-inverse"
            : "border border-border-strong"
        }`}
      >
        {item.complete ? (
          <Check aria-hidden className="size-3 stroke-[2.5]" />
        ) : null}
      </span>
      <span className="flex flex-col">
        <span className="type-body-sm text-text-primary">
          {label}
          <span className="sr-only">
            {` · ${item.complete ? t("done") : t("open")}`}
          </span>
        </span>
        {!item.complete && !item.blocking ? (
          <span className="type-caption text-text-muted">
            {t("informational")}
          </span>
        ) : null}
      </span>
    </li>
  );
}

const NOTE_TONE: Record<WeeklyStatusNote, StatusTone> = {
  [WeeklyStatusNote.InReview]: StatusTone.Info,
  [WeeklyStatusNote.Approved]: StatusTone.Success,
  [WeeklyStatusNote.Revision]: StatusTone.Error,
  [WeeklyStatusNote.Late]: StatusTone.Warning,
};

function StatusNoteAlert({
  note,
  report,
}: {
  note: WeeklyStatusNote;
  report: PeerWeeklyReport;
}) {
  const t = useTranslations("iaIskurReports.weekly.status");
  const text = {
    [WeeklyStatusNote.InReview]: t("inReview"),
    [WeeklyStatusNote.Approved]: t("approved"),
    [WeeklyStatusNote.Revision]: report.revisionNote
      ? t("revision", { note: report.revisionNote })
      : t("revisionNoNote"),
    [WeeklyStatusNote.Late]: t("late"),
  }[note];
  return (
    <InlineAlert tone={NOTE_TONE[note]}>
      <span className="flex flex-col items-start gap-2">
        {text}
        {note === WeeklyStatusNote.Revision ? (
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Small}
            onClick={() => document.getElementById(FIRST_ANSWER_ID)?.focus()}
          >
            {t("edit")}
          </Button>
        ) : null}
      </span>
    </InlineAlert>
  );
}

const SUBMIT_REASON_ID = "weekly-submit-reason";

function Footer({
  editable,
  reason,
  opensAt,
  isSaving,
  isSubmitting,
  onPreview,
  onSave,
  onSubmit,
}: {
  editable: boolean;
  reason: Exclude<WeeklySubmitBlock, WeeklySubmitBlock.Locked> | null;
  opensAt: string;
  isSaving: boolean;
  isSubmitting: boolean;
  onPreview: () => void;
  onSave: () => void;
  onSubmit: () => void;
}) {
  const t = useTranslations("iaIskurReports.weekly");
  const locale = useLocale();
  return (
    <div
      className={`${REPORT_CARD_CLASS} flex flex-col gap-3 px-6 py-4 shadow-[0_8px_20px_-4px_rgba(28,32,38,0.08),0_2px_4px_-1px_rgba(28,32,38,0.04)] lg:flex-row lg:items-center lg:justify-between`}
    >
      <div className="flex flex-col gap-0.5">
        <p className="type-caption text-text-muted">{t("footer.note")}</p>
        {editable && reason ? (
          <p
            id={SUBMIT_REASON_ID}
            className="type-caption text-status-warning-text"
          >
            {t(`block.${reason}`, {
              opensAt: formatReportTime(opensAt, locale),
            })}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant={ButtonVariant.Ghost} onClick={onPreview}>
          {t("footer.preview")}
        </Button>
        {editable ? (
          <>
            <Button
              variant={ButtonVariant.Secondary}
              disabled={isSaving || isSubmitting}
              onClick={onSave}
            >
              {isSaving ? t("footer.saving") : t("footer.save")}
            </Button>
            <Button
              disabled={reason !== null || isSaving || isSubmitting}
              aria-describedby={reason ? SUBMIT_REASON_ID : undefined}
              onClick={onSubmit}
            >
              {isSubmitting ? t("footer.submitting") : t("footer.submit")}
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
