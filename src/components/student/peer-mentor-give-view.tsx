"use client";

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import type { ReactNode } from "react";

import { QueryNotice } from "@/components/admin/admin-ui";
import { WeeklyAvailabilityEditor } from "@/components/availability/weekly-availability-editor";
import { Button, ButtonSize, ButtonVariant } from "@/components/ia/button";
import { Card } from "@/components/ia/card";
import {
  InfoCard,
  InitialsAvatar,
  JourneySteps,
  RequestStatusBadge,
  TabPanel,
  Tag,
  TagTone,
  UnderlineTabs,
} from "@/components/student/iskur-ui";
import { ActivityReportView } from "@/components/student/reports/activity-report-view";
import { ReportDayPill } from "@/components/student/reports/report-day-pill";
import { useAvailabilitySettingsForm } from "@/hooks/use-mentor-profile";
import { usePeerMenteesTab } from "@/hooks/use-peer-mentees-tab";
import {
  usePeerGivePublished,
  usePeerMentorGate,
  usePeerMentorProfile,
  usePeerMentorTrainingEntry,
} from "@/hooks/use-peer-mentor-give";
import {
  PeerMentorGateState,
  type PeerMentoringRequest,
  type PeerMentorProfile,
} from "@/interfaces/peer-mentoring";
import type { PeerMentorCapacity } from "@/lib/peer-mentoring";
import { formatDateTime, initials } from "@/lib/utils";
import { PeerGiveTab, PeerMentorJourneyStep } from "@/types/iskur-student";

export const PEER_MENTOR_WIZARD_HREF = "/student/peer-mentoring/profile";

const TABS_ID = "peer-give";
const JOURNEY = [
  PeerMentorJourneyStep.EarnBadge,
  PeerMentorJourneyStep.BadgeVerified,
  PeerMentorJourneyStep.CreateProfile,
  PeerMentorJourneyStep.Published,
] as const;

/** Akran Mentörlüğü › Mentorluk Ver, by where the student stands with the Akran Mentoru badge. */
export function PeerMentorGiveView() {
  const t = useTranslations("iaIskur.give");
  const gate = usePeerMentorGate();

  if (gate.isLoading) {
    return (
      <p role="status" className="type-body-sm text-text-muted">
        {t("loading")}
      </p>
    );
  }
  if (gate.state === PeerMentorGateState.NoBadge) {
    return (
      <div className="space-y-5">
        <Journey
          current={PeerMentorJourneyStep.EarnBadge}
          title={t("noBadge.title")}
          body={t("noBadge.body")}
        >
          <TrainingEntry />
        </Journey>
        <div className="grid gap-5 md:grid-cols-3">
          <InfoCard
            icon="/ia/iskur/user.svg"
            title={t("cards.keepGetting.title")}
          >
            {t("cards.keepGetting.body")}
          </InfoCard>
          <InfoCard
            icon="/ia/iskur/info.svg"
            title={t("cards.badgeMissing.title")}
          >
            {t("cards.badgeMissing.body")}
          </InfoCard>
          <InfoCard
            icon="/ia/iskur/lock.svg"
            title={t("cards.oneAccount.title")}
          >
            {t("cards.oneAccount.body")}
          </InfoCard>
        </div>
      </div>
    );
  }
  if (gate.state === PeerMentorGateState.Revoked) {
    return (
      <Featured
        title={gate.expired ? t("revoked.expiredTitle") : t("revoked.title")}
        body={t("revoked.body")}
      >
        {gate.gateAward?.reason ? (
          <p className="type-body text-text-secondary">
            {t("revoked.reason", { reason: gate.gateAward.reason })}
          </p>
        ) : null}
      </Featured>
    );
  }
  if (gate.state === PeerMentorGateState.Earned) {
    return <EarnedView sessionBehind={gate.sessionBehind} />;
  }
  return null;
}

function TrainingEntry() {
  const t = useTranslations("iaIskur.give.noBadge");
  const entry = usePeerMentorTrainingEntry();
  if (entry.href) {
    return (
      <Button href={entry.href} size={ButtonSize.Large}>
        {t("training")}
      </Button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size={ButtonSize.Large} disabled>
        {t("training")}
      </Button>
      {entry.reason ? (
        <p className="type-caption text-text-muted">
          {t(`trainingReason.${entry.reason}`)}
        </p>
      ) : null}
    </div>
  );
}

/** The featured (tinted) panel: certificate icon, title, body and actions, with an optional side column. */
function Featured({
  title,
  body,
  children,
  aside,
}: {
  title: string;
  body: string;
  children?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className="flex flex-col gap-8 rounded-featured border border-card-featured-border bg-card-featured-bg p-6 sm:p-10 lg:flex-row lg:items-center lg:gap-12"
    >
      <div className="flex min-w-0 flex-1 flex-col items-start gap-5">
        <span className="grid size-14 place-items-center rounded-2xl bg-background-surface">
          <Image
            src="/ia/iskur/certificate.svg"
            alt=""
            width={28}
            height={28}
          />
        </span>
        <div className="space-y-2.5">
          <h2 className="type-h2 text-text-primary">{title}</h2>
          <p className="max-w-[620px] type-body-lg text-text-secondary">
            {body}
          </p>
        </div>
        {children}
      </div>
      {aside}
    </section>
  );
}

function Journey({
  current,
  title,
  body,
  children,
}: {
  current: PeerMentorJourneyStep;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  const t = useTranslations("iaIskur.give.journey");
  return (
    <Featured
      title={title}
      body={body}
      aside={
        <JourneySteps
          heading={t("heading")}
          currentKey={current}
          steps={JOURNEY.map((step) => ({
            key: step,
            title: t(`${step}.title`),
            hint: step === current ? t("youAreHere") : t(`${step}.hint`),
          }))}
        />
      }
    >
      {children}
    </Featured>
  );
}

function EarnedView({ sessionBehind }: { sessionBehind: boolean }) {
  const t = useTranslations("iaIskur.give.earned");
  const profile = usePeerMentorProfile(!sessionBehind);

  if (sessionBehind) {
    return (
      <Journey
        current={PeerMentorJourneyStep.BadgeVerified}
        title={t("title")}
        body={t("signInAgain")}
      />
    );
  }
  if (profile.isLoading || profile.error) {
    return <QueryNotice isLoading={profile.isLoading} error={profile.error} />;
  }
  if (!profile.data) {
    return (
      <Journey
        current={PeerMentorJourneyStep.CreateProfile}
        title={t("title")}
        body={t("body")}
      >
        <Button href={PEER_MENTOR_WIZARD_HREF} size={ButtonSize.Large}>
          {t("createProfile")}
        </Button>
      </Journey>
    );
  }
  return <PublishedView profile={profile.data} />;
}

function PublishedView({ profile }: { profile: PeerMentorProfile }) {
  const t = useTranslations("iaIskur.give");
  const tReports = useTranslations("iaIskurReports.give");
  const view = usePeerGivePublished(profile.menteeCapacity);
  const { received, loaded } = view;

  return (
    <div className="space-y-7">
      <UnderlineTabs
        label={t("tabs.label")}
        idPrefix={TABS_ID}
        selected={view.tab}
        onSelect={view.setTab}
        tabs={[
          {
            id: PeerGiveTab.Mentees,
            label: t("tabs.mentees"),
            ...(loaded ? { count: received.waiting.length } : {}),
          },
          { id: PeerGiveTab.Report, label: tReports("reportTab") },
          { id: PeerGiveTab.Profile, label: t("tabs.profile") },
        ]}
      />
      <TabPanel
        idPrefix={TABS_ID}
        id={PeerGiveTab.Mentees}
        selected={view.tab === PeerGiveTab.Mentees}
      >
        {view.tab === PeerGiveTab.Mentees ? <MenteesTab view={view} /> : null}
      </TabPanel>
      <TabPanel
        idPrefix={TABS_ID}
        id={PeerGiveTab.Report}
        selected={view.tab === PeerGiveTab.Report}
      >
        {view.tab === PeerGiveTab.Report ? <ActivityReportView /> : null}
      </TabPanel>
      <TabPanel
        idPrefix={TABS_ID}
        id={PeerGiveTab.Profile}
        selected={view.tab === PeerGiveTab.Profile}
      >
        {/* The profile and availability panels stay here until the Mentor Profilim screen replaces them. */}
        {view.tab === PeerGiveTab.Profile ? (
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            <div className="flex min-w-0 flex-1 flex-col gap-8">
              <ProfilePanel profile={profile} />
              <AvailabilityPanel />
            </div>
            <aside className="flex w-full flex-col gap-6 lg:w-[400px] lg:shrink-0">
              {view.capacity ? <CapacityCard capacity={view.capacity} /> : null}
              <ProfileSummaryCard profile={profile} />
            </aside>
          </div>
        ) : null}
      </TabPanel>
    </div>
  );
}

/** Menteelerim: a meeting report due, waiting requests, active mentees, capacity and this week's report. */
function MenteesTab({
  view,
}: {
  view: ReturnType<typeof usePeerGivePublished>;
}) {
  const t = useTranslations("iaIskur.give");
  const tReports = useTranslations("iaIskurReports.give");
  const cards = usePeerMenteesTab();
  const { received, decision, loaded } = view;

  return (
    <div className="flex flex-col gap-6">
      {cards.dueMeeting ? (
        <div
          role="status"
          aria-labelledby="peer-meeting-report-due"
          className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-status-warning-border bg-status-warning-bg px-6 py-4"
        >
          <div className="flex flex-col gap-0.5">
            <p
              id="peer-meeting-report-due"
              className="type-label text-status-warning-text"
            >
              {tReports("dueTitle", { name: cards.dueMeeting.menteeName })}
            </p>
            <p className="type-body-sm text-text-secondary">
              {tReports("dueBody")}
            </p>
          </div>
          <Button href={cards.dueMeeting.href}>{tReports("dueAction")}</Button>
        </div>
      ) : null}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-8">
          <QueryNotice
            isLoading={received.query.isLoading}
            error={received.query.error}
          />
          {loaded ? (
            <RequestList
              requests={received.waiting}
              empty={t("requests.empty")}
              renderActions={(request, index) => (
                <div className="flex gap-3">
                  <Button
                    variant={ButtonVariant.Secondary}
                    fullWidth
                    className="flex-1"
                    disabled={decision.pendingId === request.id}
                    onClick={() => decision.decline(request.id)}
                  >
                    {t("requests.decline")}
                  </Button>
                  <span
                    className="flex flex-1"
                    data-tour={index === 0 ? "peer-request-accept" : undefined}
                    title={
                      view.capacityFull ? tReports("capacityFull") : undefined
                    }
                  >
                    <Button
                      fullWidth
                      disabled={
                        view.capacityFull || decision.pendingId === request.id
                      }
                      onClick={() => decision.accept(request.id)}
                    >
                      {t("requests.accept")}
                    </Button>
                  </span>
                </div>
              )}
            />
          ) : null}
          {loaded ? (
            <section
              aria-labelledby="peer-active-mentees"
              className="flex flex-col gap-4"
            >
              <h2
                id="peer-active-mentees"
                className="type-title-card text-text-primary"
              >
                {tReports("activeMentees")}
                <span className="ml-2 type-body text-text-muted">
                  · {received.mentees.length}
                </span>
              </h2>
              <RequestList
                requests={received.mentees}
                empty={t("mentees.empty")}
              />
            </section>
          ) : null}
        </div>
        <aside className="flex w-full flex-col gap-6 lg:w-[400px] lg:shrink-0">
          {view.capacity ? (
            <div className="flex flex-col gap-2">
              <CapacityCard capacity={view.capacity} />
              <button
                type="button"
                onClick={() => view.setTab(PeerGiveTab.Profile)}
                className="w-fit type-label text-text-accent hover:underline focus-visible:outline-2 focus-visible:outline-border-selected"
              >
                {tReports("editCapacity")}
              </button>
            </div>
          ) : null}
          {cards.week ? (
            <Card labelledBy="peer-week-report" className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <h2
                  id="peer-week-report"
                  className="type-title-card text-text-primary"
                >
                  {tReports("weekTitle")}
                </h2>
                <ReportDayPill badge={cards.week.badge} />
              </div>
              <p className="type-h3 text-text-primary">{cards.week.label}</p>
              <ul className="flex flex-col gap-2 type-body-sm text-text-secondary">
                <li>{tReports("weekAdded", { count: cards.week.added })}</li>
                {cards.week.waitingForAnswers ? (
                  <li>{tReports("weekWaiting")}</li>
                ) : null}
                <li>{tReports("weekDue", { time: cards.week.deadline })}</li>
              </ul>
              <Button href={cards.week.href} fullWidth>
                {tReports("weekAction")}
              </Button>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function RequestList({
  requests,
  empty,
  renderActions,
}: {
  requests: PeerMentoringRequest[];
  empty: string;
  renderActions?: (request: PeerMentoringRequest, index: number) => ReactNode;
}) {
  if (requests.length === 0) {
    return (
      <Card>
        <p className="type-body text-text-secondary">{empty}</p>
      </Card>
    );
  }
  return (
    <ul className="space-y-4">
      {requests.map((request, index) => (
        <li key={request.id}>
          <RequestCard request={request}>
            {renderActions?.(request, index)}
          </RequestCard>
        </li>
      ))}
    </ul>
  );
}

function RequestCard({
  request,
  children,
}: {
  request: PeerMentoringRequest;
  children?: ReactNode;
}) {
  const t = useTranslations("iaIskur.give.requests");
  const tTopic = useTranslations("peerTopics");
  const locale = useLocale();
  return (
    <article
      aria-label={request.mentee.fullName}
      className="flex flex-col gap-4 rounded-card border border-border-subtle bg-background-surface px-6 py-5"
    >
      <div className="flex items-center gap-3">
        <InitialsAvatar initials={initials(request.mentee.fullName)} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="truncate type-label text-text-primary">
            {request.mentee.fullName}
          </p>
          <p className="type-caption text-text-secondary">
            {t("sentAt", { date: formatDateTime(request.createdAt, locale) })}
          </p>
        </div>
        <RequestStatusBadge status={request.status} />
      </div>
      <p className="type-body break-words text-text-primary">
        {t("quote", { message: request.message })}
      </p>
      <div className="flex flex-wrap gap-1">
        <Tag>{tTopic(request.category)}</Tag>
      </div>
      {children}
    </article>
  );
}

function CapacityCard({ capacity }: { capacity: PeerMentorCapacity }) {
  const t = useTranslations("iaIskur.give.capacity");
  return (
    <Card labelledBy="peer-capacity-title" className="flex flex-col gap-3.5">
      <h2
        id="peer-capacity-title"
        className="type-title-card text-text-primary"
      >
        {t("title")}
      </h2>
      <p className="flex items-end gap-1.5">
        <span className="type-h2 text-text-primary">{capacity.used}</span>
        <span className="type-body text-text-secondary">
          {capacity.capacity === null
            ? t("noLimit")
            : t("ofCapacity", { capacity: capacity.capacity })}
        </span>
      </p>
      {capacity.capacity === null ? null : (
        <div
          role="progressbar"
          aria-label={t("title")}
          aria-valuemin={0}
          aria-valuemax={capacity.capacity}
          aria-valuenow={capacity.filled}
          aria-valuetext={t("valueText", {
            used: capacity.used,
            capacity: capacity.capacity,
          })}
          className="h-2 overflow-hidden rounded-full bg-background-muted"
        >
          <div
            className="h-2 rounded-full bg-brand-mentor-primary"
            style={{ width: `${capacity.percent}%` }}
          />
        </div>
      )}
      <p className="type-caption text-text-muted">
        {t(`note.${capacity.note}`)}
      </p>
    </Card>
  );
}

function ProfileSummaryCard({ profile }: { profile: PeerMentorProfile }) {
  const t = useTranslations("iaIskur.give.profileCard");
  const tTopic = useTranslations("peerTopics");
  return (
    <Card
      labelledBy="peer-profile-card-title"
      className="flex flex-col items-start gap-3"
    >
      <div className="flex w-full items-center justify-between gap-3">
        <h2
          id="peer-profile-card-title"
          className="type-title-card text-text-primary"
        >
          {t("title")}
        </h2>
        <Tag tone={TagTone.Success}>{t("published")}</Tag>
      </div>
      <p className="type-body-sm text-text-secondary">
        {profile.categories.map((category) => tTopic(category)).join(" · ")}
      </p>
      <Button
        href={PEER_MENTOR_WIZARD_HREF}
        variant={ButtonVariant.Secondary}
        size={ButtonSize.Small}
      >
        {t("edit")}
      </Button>
    </Card>
  );
}

function ProfilePanel({ profile }: { profile: PeerMentorProfile }) {
  const t = useTranslations("iaIskur.give.profilePanel");
  const tTopic = useTranslations("peerTopics");
  return (
    <Card className="space-y-5">
      <div className="space-y-2.5">
        <h2 className="type-label text-text-primary">{t("topics")}</h2>
        <div className="flex flex-wrap gap-2">
          {profile.categories.map((category) => (
            <Tag key={category} tone={TagTone.Accent}>
              {tTopic(category)}
            </Tag>
          ))}
          {profile.subTopics.map((subTopic) => (
            <Tag key={subTopic}>{subTopic}</Tag>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="type-label text-text-primary">{t("helpWith")}</h2>
        <p className="type-body whitespace-pre-line text-text-secondary">
          {profile.helpWith}
        </p>
      </div>
      <Button href={PEER_MENTOR_WIZARD_HREF} variant={ButtonVariant.Ghost}>
        {t("edit")}
      </Button>
    </Card>
  );
}

function AvailabilityPanel() {
  const t = useTranslations("iaIskur.give.availability");
  const availability = useAvailabilitySettingsForm(() => undefined);
  return (
    <Card className="space-y-4">
      <WeeklyAvailabilityEditor editor={availability} />
      <Button
        disabled={!availability.draft || availability.isSaving}
        onClick={() => void availability.save()}
      >
        {availability.isSaving ? t("saving") : t("save")}
      </Button>
    </Card>
  );
}
