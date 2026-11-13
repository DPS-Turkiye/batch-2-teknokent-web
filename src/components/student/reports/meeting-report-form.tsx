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
import { isEnumValue } from "@/lib/enum";
import {
  MEETING_REPORT_ACTION_TEXT_MAX,
  MEETING_REPORT_DURATION_MAX,
  MEETING_REPORT_TEXT_MAX,
  meetingDayLabel,
  meetingReportShownStatus,
  meetingSlotLabel,
  PRODUCTIVITY_SCALE,
  supportChoice,
  supportValue,
} from "@/lib/peer-meeting-report";
import {
  dailyReportHref,
  meetingReportHref,
  peerReportBadge,
} from "@/lib/peer-reports";
import { formatDateTime, initials } from "@/lib/utils";
import {
  MEETING_REPORT_SECTIONS,
  MeetingReportSection,
  SupportChoice,
} from "@/types/peer-meeting-report";

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
  const flagged = (section: MeetingReportSection) =>
    view.showMissing && view.missing.includes(section);

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-8 md:px-10">
      <header className="flex flex-col gap-2">
        <Link
          href={dailyReportHref(report.scheduledAt)}
          className="w-fit type-label text-text-accent"
        >
          ← {t("back", { day: meetingDayLabel(report.scheduledAt, locale) })}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="type-h1 text-text-primary">{t("title")}</h1>
          <ReportPill report={report} />
        </div>
        <p className="type-body text-text-secondary">{t("intro")}</p>
        {report.revisionNote && view.editable ? (
          <p className="rounded-card bg-status-error-bg p-4 type-body text-status-error-text">
            {t("revisionNote", { note: report.revisionNote })}
          </p>
        ) : null}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-6">
          <ReportSection
            section={MeetingReportSection.Meeting}
            number={1}
            flagged={flagged}
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
                <span className="type-label text-text-primary">
                  {t("meetingType")}
                </span>
                <ChoiceGroup
                  label={t("meetingType")}
                  options={Object.values(PeerMeetingType).map((type) => ({
                    id: type,
                    label: t(`types.${type}`),
                  }))}
                  selected={form.meetingType}
                  onSelect={(meetingType) => view.update({ meetingType })}
                  disabled={readOnly}
                />
              </div>
              <div className="flex flex-col gap-2">
                <span className="type-label text-text-primary">
                  {t("format")}
                </span>
                <ChoiceGroup
                  label={t("format")}
                  options={Object.values(PeerMeetingFormat).map((format) => ({
                    id: format,
                    label: t(`formats.${format}`),
                  }))}
                  selected={form.meetingFormat}
                  onSelect={(meetingFormat) => view.update({ meetingFormat })}
                  disabled={readOnly}
                />
              </div>
              <div className="flex flex-col gap-2">
                <FieldLabel htmlFor="meeting-duration" required>
                  {t("duration")}
                </FieldLabel>
                <div className="flex items-center gap-2">
                  <input
                    id="meeting-duration"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={MEETING_REPORT_DURATION_MAX}
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
            section={MeetingReportSection.Topic}
            number={2}
            flagged={flagged}
          >
            <ChipToggleGroup
              legend={t("topicsLabel")}
              options={PEER_MEETING_TOPICS.map((topic) => ({
                id: topic,
                label: t(`topics.${topic}`),
              }))}
              selected={form.topics}
              onToggle={view.toggleTopic}
              disabled={readOnly}
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
            section={MeetingReportSection.Details}
            number={3}
            flagged={flagged}
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

          <SkillsSection view={view} readOnly={readOnly} flagged={flagged} />
          <OutcomesSection view={view} readOnly={readOnly} flagged={flagged} />
          <EvaluationSection
            view={view}
            readOnly={readOnly}
            flagged={flagged}
          />
        </div>

        <aside className="flex flex-col gap-4">
          <MenteeCard report={report} />
          <ProgressCard missing={view.missing} completed={view.completed} />
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
          {readOnly && report.submittedAt
            ? t("sentNote", {
                time: formatDateTime(report.submittedAt, locale),
              })
            : report.updatedAt
              ? t("lastSaved", {
                  time: formatDateTime(report.updatedAt, locale),
                })
              : t("notSaved")}
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
            <Button onClick={view.send} disabled={view.busy}>
              {t("send")}
            </Button>
          </div>
        )}
      </footer>
    </div>
  );
}

type View = ReturnType<typeof useMeetingReportForm>;
type Flagged = (section: MeetingReportSection) => boolean;

function SkillsSection({
  view,
  readOnly,
  flagged,
}: {
  view: View;
  readOnly: boolean;
  flagged: Flagged;
}) {
  const t = useTranslations("iaIskurReports");
  if (!view.form) return null;
  return (
    <ReportSection
      section={MeetingReportSection.Skills}
      number={4}
      flagged={flagged}
    >
      <ChipToggleGroup
        legend={t("meeting.skillsLabel")}
        options={PEER_MENTOR_SKILLS.map((skill) => ({
          id: skill,
          label: t(`skills.${skill}`),
        }))}
        selected={view.form.skills}
        onToggle={view.toggleSkill}
        disabled={readOnly}
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
  flagged,
}: {
  view: View;
  readOnly: boolean;
  flagged: Flagged;
}) {
  const t = useTranslations("iaIskurReports.meeting");
  const form = view.form;
  if (!form) return null;
  return (
    <ReportSection
      section={MeetingReportSection.Outcomes}
      number={5}
      flagged={flagged}
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
          {form.actions.map((action) => (
            <li
              key={action.key}
              className="flex flex-wrap items-center gap-3 p-3"
            >
              <input
                type="checkbox"
                aria-label={t("actionDone")}
                className="size-4"
                checked={action.done}
                disabled={!view.canTickAction(action)}
                onChange={(event) =>
                  view.toggleActionDone(action, event.target.checked)
                }
              />
              <input
                aria-label={t("actionText")}
                className={`${ISKUR_FIELD_CLASS} min-w-48 flex-1 py-2`}
                value={action.text}
                maxLength={MEETING_REPORT_ACTION_TEXT_MAX}
                readOnly={readOnly}
                onChange={(event) =>
                  view.updateAction(action.key, { text: event.target.value })
                }
              />
              <select
                aria-label={t("actionOwner")}
                className={`${ISKUR_FIELD_CLASS} w-32 py-2`}
                value={action.owner}
                disabled={readOnly}
                onChange={(event) => {
                  const owner = event.target.value;
                  if (isEnumValue(PeerActionOwner, owner)) {
                    view.updateAction(action.key, { owner });
                  }
                }}
              >
                {Object.values(PeerActionOwner).map((owner) => (
                  <option key={owner} value={owner}>
                    {t(`owners.${owner}`)}
                  </option>
                ))}
              </select>
              <input
                type="date"
                aria-label={t("actionDue")}
                className={`${ISKUR_FIELD_CLASS} w-40 py-2`}
                value={action.dueDate}
                readOnly={readOnly}
                onChange={(event) =>
                  view.updateAction(action.key, { dueDate: event.target.value })
                }
              />
              {readOnly ? null : (
                <Button
                  variant={ButtonVariant.Tertiary}
                  onClick={() => view.removeAction(action.key)}
                  aria-label={t("removeAction")}
                >
                  ×
                </Button>
              )}
            </li>
          ))}
        </ul>
        {readOnly || !view.canAddAction ? null : (
          <Button
            variant={ButtonVariant.Tertiary}
            className="w-fit text-text-accent"
            onClick={view.addAction}
          >
            + {t("addAction")}
          </Button>
        )}
      </fieldset>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-background-muted p-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            role="switch"
            className="size-5"
            checked={form.followUpNeeded}
            disabled={readOnly}
            onChange={(event) =>
              view.update({ followUpNeeded: event.target.checked })
            }
          />
          <span className="flex flex-col">
            <span className="type-label text-text-primary">
              {t("followUp")}
            </span>
            <span className="type-caption text-text-muted">
              {t("followUpHint")}
            </span>
          </span>
        </label>
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
  flagged,
}: {
  view: View;
  readOnly: boolean;
  flagged: Flagged;
}) {
  const t = useTranslations("iaIskurReports.meeting");
  const form = view.form;
  if (!form) return null;
  return (
    <ReportSection
      section={MeetingReportSection.Evaluation}
      number={6}
      flagged={flagged}
    >
      <div className="flex flex-col gap-2">
        <span
          id="meeting-productivity"
          className="type-label text-text-primary"
        >
          {t("productivity")}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="radiogroup"
            aria-labelledby="meeting-productivity"
            className="flex gap-2"
          >
            {PRODUCTIVITY_SCALE.map((score) => {
              const active = form.productivity === score;
              return (
                <button
                  key={score}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={readOnly}
                  onClick={() => view.update({ productivity: score })}
                  className={`size-11 rounded-button border type-label ${
                    active
                      ? "border-action-primary-bg bg-action-primary-bg text-action-primary-fg"
                      : "border-border-default bg-background-surface text-text-primary"
                  }`}
                >
                  {score}
                </button>
              );
            })}
          </div>
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
        <span className="type-label text-text-primary">{t("support")}</span>
        <ChoiceGroup
          label={t("support")}
          options={[
            { id: SupportChoice.No, label: t("supportNo") },
            { id: SupportChoice.Yes, label: t("supportYes") },
          ]}
          selected={supportChoice(form.coordinatorSupportNeeded)}
          onSelect={(choice) =>
            view.update({ coordinatorSupportNeeded: supportValue(choice) })
          }
          disabled={readOnly}
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
  section,
  number,
  flagged,
  children,
}: {
  section: MeetingReportSection;
  number: number;
  flagged: Flagged;
  children: ReactNode;
}) {
  const t = useTranslations("iaIskurReports.meeting");
  const headingId = `meeting-section-${section}`;
  const missing = flagged(section);
  return (
    <section
      aria-labelledby={headingId}
      className={`flex flex-col gap-5 rounded-card border bg-background-surface p-6 ${
        missing ? "border-status-error-border" : "border-border-default"
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
          <h2 id={headingId} className="type-title-card text-text-primary">
            {t(`sections.${section}.title`)}
          </h2>
          <p className="type-caption text-text-muted">
            {t(`sections.${section}.hint`)}
          </p>
          {missing ? (
            <p
              role="alert"
              className="mt-1 type-caption text-status-error-text"
            >
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
  const tTopics = useTranslations("iaIskurReports.meeting.topics");
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
          <dd className="text-right text-text-primary">
            {previous
              ? [
                  formatDateTime(previous.scheduledAt, locale),
                  ...previous.topics.map((topic) => tTopics(topic)),
                ].join(" · ")
              : t("noPrevious")}
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

function ProgressCard({
  missing,
  completed,
}: {
  missing: readonly MeetingReportSection[];
  completed: number;
}) {
  const t = useTranslations("iaIskurReports.meeting");
  return (
    <Card compact>
      <div className="flex items-center justify-between">
        <h2 className="type-title-card text-text-primary">{t("progress")}</h2>
        <span className="type-label text-status-success-text">
          {completed} / {MEETING_REPORT_SECTIONS.length}
        </span>
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {MEETING_REPORT_SECTIONS.map((section) => {
          const done = !missing.includes(section);
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
