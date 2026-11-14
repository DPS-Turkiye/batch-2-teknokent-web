"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import type { ReactNode } from "react";

import { QueryNotice } from "@/components/admin/admin-ui";
import { Button, ButtonVariant } from "@/components/ia/button";
import { Card } from "@/components/ia/card";
import {
  InitialsAvatar,
  ISKUR_FIELD_CLASS,
} from "@/components/student/iskur-ui";
import {
  ChipToggleGroup,
  ChoiceGroup,
  ChoiceLook,
  FieldLabel,
  TextAreaField,
} from "@/components/student/reports/report-fields";
import { ReportStatusPill } from "@/components/student/reports/report-status-pill";
import { useMeetingReportForm } from "@/hooks/use-meeting-report-form";
import {
  PEER_MEETING_TOPICS,
  PEER_MENTOR_SKILLS,
  PeerActionOwner,
  PeerMeetingFormat,
  PeerMeetingType,
  type PeerMeetingReport,
} from "@/interfaces/peer-reports";
import {
  MEETING_REPORT_ACTION_TEXT_MAX,
  MEETING_REPORT_TEXT_MAX,
  meetingDayLabel,
  meetingReportShownStatus,
  meetingSlotLabel,
  PRODUCTIVITY_CHOICES,
} from "@/lib/peer-meeting-report";
import {
  dailyReportHref,
  meetingReportHref,
  peerReportBadge,
} from "@/lib/peer-reports";
import { formatDateTime, initials } from "@/lib/utils";
import {
  MEETING_REPORT_SECTIONS,
  MeetingReportFooterNote,
  MeetingReportSection,
  SupportChoice,
} from "@/types/peer-meeting-report";

type View = ReturnType<typeof useMeetingReportForm>;

function sectionHeadingId(section: MeetingReportSection) {
  return `meeting-section-${section}`;
}

/** "Görüşme Raporu" (Figma 220:2 / flow 3.2.2): one meeting's report, editable until sent, read-only after. */
export function MeetingReportScreen({ meetingId }: { meetingId: string }) {
  const t = useTranslations("iaIskurReports.meeting");
  const locale = useLocale();
  const view = useMeetingReportForm(meetingId);
  const { report, form } = view;

  if (!report || !form) {
    return (
      <QueryNotice isLoading={view.query.isLoading} error={view.query.error} />
    );
  }
  const readOnly = !view.editable;

  function send() {
    const first = view.send();
    if (first !== null)
      document.getElementById(sectionHeadingId(first))?.focus();
  }

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-8 md:px-10">
      <header className="flex flex-col gap-2">
        <Link
          href={dailyReportHref(report.scheduledAt)}
          className="w-fit type-label text-text-accent"
        >
          {t("back", { day: meetingDayLabel(report.scheduledAt, locale) })}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="type-h1 text-text-primary">{t("title")}</h1>
          <ReportPill report={report} />
        </div>
        <p className="type-body text-text-secondary">{t("intro")}</p>
        {view.showRevisionNote ? (
          <p className="rounded-card bg-status-error-bg p-4 type-body text-status-error-text">
            {t("revisionNote", { note: report.revisionNote ?? "" })}
          </p>
        ) : null}
        {view.showMissing && view.missing.length > 0 ? (
          <p
            role="alert"
            className="rounded-card bg-status-error-bg p-4 type-body text-status-error-text"
          >
            {t("missingSummary", {
              sections: view.missing
                .map((section) => t(`sections.${section}.title`))
                .join(", "),
            })}
          </p>
        ) : null}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-6">
          <ReportSection
            view={view}
            section={MeetingReportSection.Meeting}
            number={1}
          >
            <div className="grid gap-3 md:grid-cols-3">
              <InfoTile label={t("mentee")} value={report.mentee.fullName} />
              <InfoTile
                label={t("date")}
                value={meetingDayLabel(report.scheduledAt, locale)}
              />
              <InfoTile
                label={t("plannedTime")}
                value={meetingSlotLabel(
                  report.scheduledAt,
                  report.plannedDurationMinutes,
                  locale,
                )}
              />
            </div>
            <div className="flex flex-wrap gap-6">
              <div className="flex flex-col gap-2">
                <span
                  id="meeting-type-label"
                  className="type-label text-text-primary"
                >
                  {t("meetingType")}
                </span>
                <ChoiceGroup
                  labelledBy="meeting-type-label"
                  options={Object.values(PeerMeetingType).map((type) => ({
                    id: type,
                    label: t(`types.${type}`),
                  }))}
                  selected={form.meetingType}
                  onSelect={(meetingType) => view.update({ meetingType })}
                  readOnly={readOnly}
                />
              </div>
              <div className="flex flex-col gap-2">
                <span
                  id="meeting-format-label"
                  className="type-label text-text-primary"
                >
                  {t("format")}
                </span>
                <ChoiceGroup
                  labelledBy="meeting-format-label"
                  options={Object.values(PeerMeetingFormat).map((format) => ({
                    id: format,
                    label: t(`formats.${format}`),
                  }))}
                  selected={form.meetingFormat}
                  onSelect={(meetingFormat) => view.update({ meetingFormat })}
                  readOnly={readOnly}
                />
              </div>
              <div className="flex flex-col gap-2">
                <FieldLabel htmlFor="meeting-duration" required>
                  {t("duration")}
                </FieldLabel>
                <div className="flex items-center gap-2">
                  <input
                    id="meeting-duration"
                    inputMode="numeric"
                    maxLength={3}
                    aria-required="true"
                    className={`${ISKUR_FIELD_CLASS} w-28`}
                    value={form.actualDurationMinutes}
                    readOnly={readOnly}
                    onChange={(event) =>
                      view.update({ actualDurationMinutes: event.target.value })
                    }
                  />
                  <span className="type-body text-text-secondary">
                    {t("minutesUnit")}
                  </span>
                </div>
              </div>
            </div>
          </ReportSection>

          <ReportSection
            view={view}
            section={MeetingReportSection.Topic}
            number={2}
          >
            <ChipToggleGroup
              legend={t("topicsLabel")}
              options={PEER_MEETING_TOPICS.map((topic) => ({
                id: topic,
                label: t(`topics.${topic}`),
              }))}
              selected={form.topics}
              onToggle={view.toggleTopic}
              readOnly={readOnly}
            />
            <TextAreaField
              id="meeting-need"
              label={t("menteeNeed")}
              value={form.menteeNeed}
              onChange={(menteeNeed) => view.update({ menteeNeed })}
              maxLength={MEETING_REPORT_TEXT_MAX}
              required
              readOnly={readOnly}
            />
          </ReportSection>

          <ReportSection
            view={view}
            section={MeetingReportSection.Details}
            number={3}
          >
            <TextAreaField
              id="meeting-discussion"
              label={t("discussion")}
              value={form.discussion}
              onChange={(discussion) => view.update({ discussion })}
              maxLength={MEETING_REPORT_TEXT_MAX}
              required
              readOnly={readOnly}
            />
            <TextAreaField
              id="meeting-approach"
              label={t("approach")}
              value={form.approach}
              onChange={(approach) => view.update({ approach })}
              maxLength={MEETING_REPORT_TEXT_MAX}
              required
              readOnly={readOnly}
            />
          </ReportSection>

          <SkillsSection view={view} readOnly={readOnly} />
          <OutcomesSection view={view} readOnly={readOnly} />
          <EvaluationSection view={view} readOnly={readOnly} />
        </div>

        <aside className="flex flex-col gap-4">
          <MenteeCard report={report} />
          <ProgressCard view={view} />
          <Card compact featured>
            <h2 className="type-title-card text-text-accent">
              {t("tipTitle")}
            </h2>
            <p className="mt-2 type-body-sm text-text-secondary">{t("tip")}</p>
          </Card>
        </aside>
      </div>

      <footer className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-card border border-border-default bg-background-surface p-4 shadow-raised">
        <p className="type-caption text-text-muted">
          {view.footerNote === MeetingReportFooterNote.NotSaved ||
          !view.footerAt
            ? t("notSaved")
            : view.footerNote === MeetingReportFooterNote.Sent
              ? t("sentNote", { time: formatDateTime(view.footerAt, locale) })
              : t("lastSaved", { time: formatDateTime(view.footerAt, locale) })}
        </p>
        {readOnly ? null : (
          <div className="flex flex-wrap gap-3">
            <Button
              variant={ButtonVariant.Secondary}
              onClick={view.saveDraft}
              disabled={view.busy}
            >
              {t("saveDraft")}
            </Button>
            <Button onClick={send} disabled={view.busy}>
              {t("send")}
            </Button>
          </div>
        )}
      </footer>
    </div>
  );
}

function SkillsSection({ view, readOnly }: { view: View; readOnly: boolean }) {
  const t = useTranslations("iaIskurReports");
  if (!view.form) return null;
  return (
    <ReportSection view={view} section={MeetingReportSection.Skills} number={4}>
      <ChipToggleGroup
        legend={t("meeting.skillsLabel")}
        options={PEER_MENTOR_SKILLS.map((skill) => ({
          id: skill,
          label: t(`skills.${skill}`),
        }))}
        selected={view.form.skills}
        onToggle={view.toggleSkill}
        readOnly={readOnly}
      />
      <TextAreaField
        id="meeting-skill-example"
        label={t("meeting.skillExample")}
        value={view.form.skillExample}
        onChange={(skillExample) => view.update({ skillExample })}
        maxLength={MEETING_REPORT_TEXT_MAX}
        required
        readOnly={readOnly}
      />
    </ReportSection>
  );
}

function OutcomesSection({
  view,
  readOnly,
}: {
  view: View;
  readOnly: boolean;
}) {
  const t = useTranslations("iaIskurReports.meeting");
  const form = view.form;
  if (!form) return null;
  return (
    <ReportSection
      view={view}
      section={MeetingReportSection.Outcomes}
      number={5}
    >
      <TextAreaField
        id="meeting-outcome"
        label={t("outcome")}
        value={form.outcome}
        onChange={(outcome) => view.update({ outcome })}
        maxLength={MEETING_REPORT_TEXT_MAX}
        required
        readOnly={readOnly}
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 type-label text-text-primary">
          {t("actionsLabel")}
        </legend>
        <ul className="divide-y divide-border-subtle rounded-card border border-border-default">
          {form.actions.length === 0 ? (
            <li className="p-4 type-body-sm text-text-muted">
              {t("noActions")}
            </li>
          ) : null}
          {form.actions.map((action, index) => {
            const number = index + 1;
            return (
              <li
                key={action.key}
                className="flex flex-wrap items-center gap-3 p-3"
              >
                <input
                  type="checkbox"
                  aria-label={t("actionDone", { number })}
                  className="size-4"
                  checked={action.done}
                  disabled={!view.canTickAction(action)}
                  onChange={(event) =>
                    view.toggleActionDone(action, event.target.checked)
                  }
                />
                <input
                  aria-label={t("actionText", { number })}
                  className={`${ISKUR_FIELD_CLASS} min-w-48 flex-1 py-2`}
                  value={action.text}
                  maxLength={MEETING_REPORT_ACTION_TEXT_MAX}
                  readOnly={readOnly}
                  onChange={(event) =>
                    view.updateAction(action.key, { text: event.target.value })
                  }
                />
                <select
                  aria-label={t("actionOwner", { number })}
                  className={`${ISKUR_FIELD_CLASS} w-32 py-2`}
                  value={action.owner}
                  disabled={readOnly}
                  onChange={(event) =>
                    view.setActionOwner(action.key, event.target.value)
                  }
                >
                  {Object.values(PeerActionOwner).map((owner) => (
                    <option key={owner} value={owner}>
                      {t(`owners.${owner}`)}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  aria-label={t("actionDue", { number })}
                  className={`${ISKUR_FIELD_CLASS} w-40 py-2`}
                  value={action.dueDate}
                  readOnly={readOnly}
                  onChange={(event) =>
                    view.updateAction(action.key, {
                      dueDate: event.target.value,
                    })
                  }
                />
                {readOnly ? null : (
                  <Button
                    variant={ButtonVariant.Tertiary}
                    onClick={() => view.removeAction(action.key)}
                    aria-label={t("removeAction", { number })}
                  >
                    <span aria-hidden="true">×</span>
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
        {view.canAddAction ? (
          <Button
            variant={ButtonVariant.Tertiary}
            className="w-fit text-text-accent"
            onClick={view.addAction}
          >
            {t("addAction")}
          </Button>
        ) : null}
      </fieldset>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-background-muted p-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            role="switch"
            className="size-5"
            aria-describedby="meeting-follow-up-hint"
            checked={form.followUpNeeded}
            disabled={readOnly}
            onChange={(event) =>
              view.update({ followUpNeeded: event.target.checked })
            }
          />
          <span className="type-label text-text-primary">{t("followUp")}</span>
        </label>
        <span
          id="meeting-follow-up-hint"
          className="type-caption text-text-muted"
        >
          {t("followUpHint")}
        </span>
        {form.followUpNeeded ? (
          <input
            type="datetime-local"
            aria-label={t("followUpAt")}
            className={`${ISKUR_FIELD_CLASS} w-56 py-2`}
            value={form.followUpAt}
            readOnly={readOnly}
            onChange={(event) =>
              view.update({ followUpAt: event.target.value })
            }
          />
        ) : null}
      </div>
    </ReportSection>
  );
}

function EvaluationSection({
  view,
  readOnly,
}: {
  view: View;
  readOnly: boolean;
}) {
  const t = useTranslations("iaIskurReports.meeting");
  const form = view.form;
  if (!form) return null;
  return (
    <ReportSection
      view={view}
      section={MeetingReportSection.Evaluation}
      number={6}
    >
      <div className="flex flex-col gap-2">
        <span
          id="meeting-productivity"
          className="type-label text-text-primary"
        >
          {t("productivity")}
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <ChoiceGroup
            labelledBy="meeting-productivity"
            look={ChoiceLook.Scale}
            options={PRODUCTIVITY_CHOICES.map((score) => ({
              id: score,
              label: score,
            }))}
            selected={view.productivity}
            onSelect={view.setProductivity}
            readOnly={readOnly}
          />
          <span className="type-caption text-text-muted">
            {t("productivityScale")}
          </span>
        </div>
      </div>
      <TextAreaField
        id="meeting-next-time"
        label={t("nextTime")}
        value={form.nextTime}
        onChange={(nextTime) => view.update({ nextTime })}
        maxLength={MEETING_REPORT_TEXT_MAX}
        required
        readOnly={readOnly}
      />
      <div className="flex flex-col gap-2">
        <span id="meeting-support" className="type-label text-text-primary">
          {t("support")}
        </span>
        <ChoiceGroup
          labelledBy="meeting-support"
          options={[
            { id: SupportChoice.No, label: t("supportNo") },
            { id: SupportChoice.Yes, label: t("supportYes") },
          ]}
          selected={view.support}
          onSelect={view.setSupport}
          readOnly={readOnly}
        />
        <p className="type-caption text-text-muted">{t("supportHint")}</p>
      </div>
      <p className="rounded-card bg-background-muted p-3 type-caption text-text-secondary">
        {t("privacy")}
      </p>
    </ReportSection>
  );
}

function ReportSection({
  view,
  section,
  number,
  children,
}: {
  view: View;
  section: MeetingReportSection;
  number: number;
  children: ReactNode;
}) {
  const t = useTranslations("iaIskurReports.meeting");
  const headingId = sectionHeadingId(section);
  const flagged = view.isFlagged(section);
  return (
    <section
      aria-labelledby={headingId}
      className={`flex flex-col gap-5 rounded-card border bg-background-surface p-6 ${
        flagged ? "border-status-error-border" : "border-border-default"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid size-7 shrink-0 place-items-center rounded-full bg-background-selected type-label-sm text-text-accent"
        >
          {number}
        </span>
        <div className="flex flex-col">
          <h2
            id={headingId}
            tabIndex={-1}
            className="type-title-card text-text-primary focus-visible:outline-2 focus-visible:outline-border-selected"
          >
            {t(`sections.${section}.title`)}
          </h2>
          <p className="type-caption text-text-muted">
            {t(`sections.${section}.hint`)}
          </p>
          {flagged ? (
            <p className="mt-1 type-caption text-status-error-text">
              {t("sectionMissing")}
            </p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-card bg-background-muted p-4">
      <span className="type-caption text-text-muted">{label}</span>
      <span className="type-label text-text-primary">{value}</span>
    </div>
  );
}

function ReportPill({ report }: { report: PeerMeetingReport }) {
  const badge = peerReportBadge(meetingReportShownStatus(report.status));
  return badge ? <ReportStatusPill badge={badge} /> : null;
}

function MenteeCard({ report }: { report: PeerMeetingReport }) {
  const t = useTranslations("iaIskurReports.meeting");
  const locale = useLocale();
  const previous = report.context.previousMeeting;
  return (
    <Card compact>
      <div className="flex items-center gap-3">
        <InitialsAvatar initials={initials(report.mentee.fullName)} />
        <div className="flex flex-col">
          <span className="type-label text-text-primary">
            {report.mentee.fullName}
          </span>
          {report.mentee.department ? (
            <span className="type-caption text-text-muted">
              {report.mentee.department}
            </span>
          ) : null}
        </div>
      </div>
      <dl className="mt-4 flex flex-col gap-2 border-t border-border-subtle pt-4 type-body-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-text-secondary">{t("meetingNumber")}</dt>
          <dd className="text-text-primary">
            {t("meetingOrdinal", { number: report.context.meetingNumber })}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-text-secondary">{t("previousMeeting")}</dt>
          <dd className="flex flex-col items-end text-right text-text-primary">
            {previous ? (
              <>
                <span>{formatDateTime(previous.scheduledAt, locale)}</span>
                {previous.topics.map((topic) => (
                  <span key={topic}>{t(`topics.${topic}`)}</span>
                ))}
              </>
            ) : (
              t("noPrevious")
            )}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-text-secondary">{t("openActions")}</dt>
          <dd className="text-text-primary">
            {t("openActionsValue", { count: report.context.openActions })}
          </dd>
        </div>
      </dl>
      {previous ? (
        <Link
          href={meetingReportHref(previous.meetingId)}
          className="mt-3 inline-block type-label text-text-accent"
        >
          {t("previousReport")}
        </Link>
      ) : null}
    </Card>
  );
}

function ProgressCard({ view }: { view: View }) {
  const t = useTranslations("iaIskurReports.meeting");
  return (
    <Card compact>
      <div className="flex items-center justify-between">
        <h2 className="type-title-card text-text-primary">{t("progress")}</h2>
        <span className="type-label text-status-success-text">
          {view.completed} / {MEETING_REPORT_SECTIONS.length}
        </span>
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {MEETING_REPORT_SECTIONS.map((section) => {
          const done = view.isSectionDone(section);
          return (
            <li key={section} className="flex items-center gap-2 type-body-sm">
              <span
                aria-hidden="true"
                className={`size-4 rounded-full ${
                  done
                    ? "bg-status-success-text"
                    : "border border-border-control"
                }`}
              />
              <span className={done ? "text-text-primary" : "text-text-muted"}>
                {t(`sections.${section}.title`)}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
