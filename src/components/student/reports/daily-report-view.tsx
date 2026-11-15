"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { QueryNotice } from "@/components/admin/admin-ui";
import { Button, ButtonVariant } from "@/components/ia/button";
import { Card } from "@/components/ia/card";
import { AddActivityDialog } from "@/components/student/reports/add-activity-dialog";
import {
  ChipToggleGroup,
  TextAreaField,
} from "@/components/student/reports/report-fields";
import { ReportStatusPill } from "@/components/student/reports/report-status-pill";
import { useDailyReport } from "@/hooks/use-daily-report";
import { PEER_MENTOR_SKILLS } from "@/interfaces/peer-reports";
import { DAILY_TEXT_MAX } from "@/lib/peer-daily-report";
import { REPORT_WORKING_DAYS } from "@/lib/peer-reports";

/** "Günlük Rapor" (Figma 221:73 / flow 3.2.3): one working day, below the shell's segment, week and day strip. */
export function DailyReportView({
  day,
  dailySent,
}: {
  day: string;
  dailySent: number;
}) {
  const t = useTranslations("iaIskurReports");
  const view = useDailyReport(day);
  const { report, form, readOnly } = view;

  if (!report || !form) {
    return (
      <QueryNotice isLoading={view.query.isLoading} error={view.query.error} />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {view.showRevisionNote ? (
        <p className="rounded-card bg-status-error-bg p-4 type-body text-status-error-text">
          {t("daily.revisionNote", { note: view.revisionNote })}
        </p>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-6">
          <Card labelledBy="daily-activities-title">
            <h2
              id="daily-activities-title"
              className="type-title-card text-text-primary"
            >
              {t("daily.activitiesTitle")}
            </h2>
            <p className="type-caption text-text-muted">
              {t("daily.activitiesHint")}
            </p>
            <ul className="mt-4 divide-y divide-border-subtle">
              {view.meetingRows.map((row) => (
                <li
                  key={row.id}
                  className={`flex flex-wrap items-center gap-4 py-4 ${
                    row.sent ? "" : "bg-status-warning-bg/40"
                  }`}
                >
                  <span className="w-14 type-label text-text-secondary">
                    {row.time}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="type-label text-text-primary">
                      {row.title}
                    </span>
                    <span className="type-caption text-text-muted">
                      {row.meta}
                    </span>
                  </div>
                  <ReportStatusPill badge={row.badge} />
                  <span className="type-body-sm text-text-secondary">
                    {row.statusText}
                  </span>
                  <Button
                    href={row.href}
                    variant={
                      row.sent ? ButtonVariant.Ghost : ButtonVariant.Primary
                    }
                  >
                    {row.actionLabel}
                  </Button>
                </li>
              ))}
              {view.activityRows.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center gap-4 py-4"
                >
                  <span className="w-14 type-label text-text-secondary">
                    {row.time}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="type-label text-text-primary">
                      {row.title}
                    </span>
                    <span className="type-caption text-text-muted">
                      {row.meta}
                    </span>
                  </div>
                  <span className="type-body-sm text-text-secondary">
                    {t("daily.addedByYou")}
                  </span>
                  {readOnly ? null : (
                    <Button
                      variant={ButtonVariant.Tertiary}
                      aria-label={row.deleteLabel}
                      disabled={view.deletingActivityId !== null}
                      onClick={() => view.deleteActivity(row.id)}
                    >
                      <X aria-hidden className="size-4" />
                    </Button>
                  )}
                </li>
              ))}
              {view.anyWork ? null : (
                <li className="py-4 type-body-sm text-text-muted">
                  {t("daily.noActivities")}
                </li>
              )}
            </ul>
            {readOnly ? null : (
              <Button
                variant={ButtonVariant.Tertiary}
                className="mt-2 w-fit text-text-accent"
                onClick={view.openActivity}
              >
                {t("daily.addActivity")}
              </Button>
            )}
          </Card>

          <Card labelledBy="daily-evaluation-title">
            <h2
              id="daily-evaluation-title"
              className="type-title-card text-text-primary"
            >
              {t("daily.evaluationTitle")}
            </h2>
            <p className="type-caption text-text-muted">
              {t("daily.evaluationHint")}
            </p>
            <div className="mt-4 flex flex-col gap-5">
              <TextAreaField
                id="daily-did-today"
                label={t("daily.didToday")}
                value={form.didToday}
                onChange={(didToday) => view.update({ didToday })}
                maxLength={DAILY_TEXT_MAX}
                required
                readOnly={readOnly}
              />
              <TextAreaField
                id="daily-challenge"
                label={t("daily.challenge")}
                value={form.challenge}
                onChange={(challenge) => view.update({ challenge })}
                maxLength={DAILY_TEXT_MAX}
                required
                readOnly={readOnly}
              />
              <div className="flex flex-col gap-1">
                <ChipToggleGroup
                  legend={t("daily.skills")}
                  options={PEER_MENTOR_SKILLS.map((skill) => ({
                    id: skill,
                    label: t(`skills.${skill}`),
                  }))}
                  selected={form.skills}
                  onToggle={view.toggleSkill}
                  readOnly={readOnly}
                />
                <p className="type-caption text-text-muted">
                  {t("daily.skillsHint")}
                </p>
              </div>
              <TextAreaField
                id="daily-learned"
                label={t("daily.learned")}
                value={form.learned}
                onChange={(learned) => view.update({ learned })}
                maxLength={DAILY_TEXT_MAX}
                required
                readOnly={readOnly}
              />
              <TextAreaField
                id="daily-tomorrow"
                label={t("daily.tomorrowPlan")}
                value={form.tomorrowPlan}
                onChange={(tomorrowPlan) => view.update({ tomorrowPlan })}
                maxLength={DAILY_TEXT_MAX}
                required
                readOnly={readOnly}
              />
              <p className="rounded-card bg-background-muted p-3 type-caption text-text-secondary">
                {t("daily.privacy")}
              </p>
            </div>
          </Card>
        </div>

        <aside className="flex flex-col gap-4">
          <Card compact labelledBy="daily-summary-title">
            <div className="flex items-center justify-between gap-2">
              <h2
                id="daily-summary-title"
                className="type-title-card text-text-primary"
              >
                {t("daily.summaryTitle")}
              </h2>
              {view.dayBadge ? (
                <ReportStatusPill badge={view.dayBadge} />
              ) : null}
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-2">
              <SummaryTile
                label={t("daily.meetings")}
                value={String(view.meetingCount)}
              />
              <SummaryTile
                label={t("daily.otherActivities")}
                value={String(view.activityCount)}
              />
              <SummaryTile label={t("daily.recorded")} value={view.recorded} />
            </dl>
            <p className="mt-3 type-caption text-text-muted">
              {t("duration.recordedNote")}
            </p>
            <h3 className="mt-5 type-label text-text-primary">
              {t("daily.readyTitle")}
            </h3>
            <ul className="mt-2 flex flex-col gap-2 type-body-sm">
              {view.readyLines.map((line) => (
                <li key={line.id} className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={`size-4 rounded-full ${
                      line.done
                        ? "bg-status-success-text"
                        : "bg-status-warning-text"
                    }`}
                  />
                  <span
                    className={
                      line.done
                        ? "text-text-primary"
                        : "text-status-warning-text"
                    }
                  >
                    {line.label}
                  </span>
                  <span className="sr-only">
                    {line.done ? t("daily.readyDone") : t("daily.readyMissing")}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-card bg-background-muted p-3 type-caption text-text-secondary">
              {view.deadlineText}
            </p>
          </Card>
          <Card compact labelledBy="daily-week-title">
            <h2
              id="daily-week-title"
              className="type-title-card text-text-primary"
            >
              {t("daily.weekTitle")}
            </h2>
            <div className="mt-3 flex items-center justify-between type-body-sm">
              <span className="text-text-secondary">
                {t("daily.weekDaily")}
              </span>
              <span className="type-label text-text-primary">
                {t("daily.weekSent", {
                  sent: dailySent,
                  total: REPORT_WORKING_DAYS,
                })}
              </span>
            </div>
            <progress
              className="mt-2 h-1.5 w-full accent-action-primary-bg"
              value={dailySent}
              max={REPORT_WORKING_DAYS}
              aria-label={t("daily.weekDaily")}
            />
            <p className="mt-2 type-caption text-text-muted">
              {t("daily.weekNote")}
            </p>
          </Card>
        </aside>
      </div>

      <footer className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-card border border-border-default bg-background-surface p-4 shadow-raised">
        <p className="type-caption text-text-muted">{view.savedText}</p>
        {readOnly ? null : (
          <div className="flex flex-wrap items-center gap-3">
            {view.blockedByMeetings ? (
              <span className="type-caption text-status-warning-text">
                {t("daily.sendBlocked")}
              </span>
            ) : null}
            <Button
              variant={ButtonVariant.Secondary}
              onClick={view.saveDraft}
              disabled={view.busy}
            >
              {t("daily.saveDraft")}
            </Button>
            <Button onClick={view.send} disabled={view.busy || !view.ready}>
              {t("daily.send")}
            </Button>
          </div>
        )}
      </footer>

      {view.activityForm ? (
        <AddActivityDialog
          form={view.activityForm}
          errors={view.activityErrors}
          busy={view.activityBusy}
          mentees={view.menteeOptions}
          onChange={view.updateActivity}
          onClose={view.closeActivity}
          onSubmit={view.submitActivity}
        />
      ) : null}
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col-reverse gap-1 rounded-card bg-background-muted p-3">
      <dt className="type-caption text-text-muted">{label}</dt>
      <dd className="type-title-card text-text-primary">{value}</dd>
    </div>
  );
}
