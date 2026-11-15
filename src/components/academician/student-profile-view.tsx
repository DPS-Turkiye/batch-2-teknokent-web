"use client";

import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, type ReactNode } from "react";

import { AdviseeChip } from "@/components/academician/advisee-chip";
import { SampleDataNotice } from "@/components/academician/sample-data-notice";
import { StudentAvatar } from "@/components/academician/student-avatar";
import { WorkspaceQueryState } from "@/components/academician/workspace-query-state";
import { Button, ButtonVariant } from "@/components/ia/button";
import { Card } from "@/components/ia/card";
import { InlineAlert } from "@/components/ia/inline-alert";
import { PageHeader } from "@/components/ia/page-header";
import { StatusBadge, StatusTone } from "@/components/ia/status-badge";
import {
  useAcademicianStudent,
  type AcademicianStudent,
} from "@/hooks/use-academician-student";
import { useAdviseeInterests } from "@/hooks/use-advisee-interests";
import {
  StudentHistoryBadge,
  type StudentProfileOrigin,
} from "@/types/academician-office-hours";

const BADGE_TONE: Record<StudentHistoryBadge, StatusTone> = {
  [StudentHistoryBadge.Pending]: StatusTone.Warning,
  [StudentHistoryBadge.Proposed]: StatusTone.Info,
  [StudentHistoryBadge.Confirmed]: StatusTone.Success,
  [StudentHistoryBadge.Completed]: StatusTone.Neutral,
  [StudentHistoryBadge.Cancelled]: StatusTone.Error,
};

/** The full-page student profile, reached from Danışan Öğrencilerim or from a request's "Tam Profili Gör". */
export function StudentProfileView({
  userId,
  from,
}: {
  userId: string;
  from: StudentProfileOrigin;
}) {
  const t = useTranslations("iaAcademician.student");
  const profile = useAcademicianStudent(userId, from);
  return (
    <div className="space-y-6">
      <PageHeader
        title={profile.student?.name ?? t("record")}
        back={profile.back}
      />
      <SampleDataNotice />
      <StudentProfileBody profile={profile} withActions />
    </div>
  );
}

/** Loading, error, unknown student or the profile itself; the page and the pop-up show the same body. */
export function StudentProfileBody({
  profile,
  withActions,
}: {
  profile: ReturnType<typeof useAcademicianStudent>;
  withActions: boolean;
}) {
  const t = useTranslations("iaAcademician.student");
  if (profile.student) {
    return (
      <StudentProfileContent
        student={profile.student}
        withActions={withActions}
      />
    );
  }
  if (profile.notFound) {
    return <InlineAlert tone={StatusTone.Neutral}>{t("notFound")}</InlineAlert>;
  }
  return (
    <WorkspaceQueryState
      isLoading={profile.isLoading}
      error={profile.error}
      onRetry={profile.retry}
      isRetrying={profile.isRetrying}
    />
  );
}

function StudentProfileContent({
  student,
  withActions,
}: {
  student: AcademicianStudent;
  /** The pop-up opens over the request drawer, which already answers the request. */
  withActions: boolean;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
      <div className="space-y-6 self-start">
        <StudentRecordCard student={student} />
        {/* Only their advisor may read it; for anyone else's student the backend has nothing to show. */}
        {student.isAdvisee ? <InterestsCard userId={student.userId} /> : null}
      </div>
      <div className="space-y-6">
        {student.pendingRequest ? (
          <PendingRequestCard
            request={student.pendingRequest}
            withActions={withActions}
          />
        ) : null}
        <HistoryCard history={student.history} />
      </div>
    </div>
  );
}

function StudentRecordCard({ student }: { student: AcademicianStudent }) {
  const t = useTranslations("iaAcademician.student");
  const recordId = useId();
  return (
    <Card className="space-y-5">
      <div className="flex items-center gap-3">
        <StudentAvatar name={student.name} />
        <div>
          <p className="flex flex-wrap items-center gap-2 type-label-lg text-text-primary">
            {student.name}
            {student.isAdvisee ? <AdviseeChip /> : null}
          </p>
          {student.subtitle === "" ? null : (
            <p className="type-caption text-text-muted">{student.subtitle}</p>
          )}
        </div>
      </div>
      <section aria-labelledby={recordId} className="space-y-3">
        <h2 id={recordId} className="type-label text-text-secondary">
          {t("record")}
        </h2>
        <dl className="space-y-3">
          {student.facts.map((fact) => (
            <div key={fact.key} className="flex justify-between gap-3">
              <dt className="type-body-sm text-text-muted">{fact.label}</dt>
              <dd className="type-body-sm text-right text-text-primary">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <p className="flex items-start gap-2 type-caption text-text-muted">
        <Lock aria-hidden className="mt-0.5 size-3.5 shrink-0" />
        {t("privacy")}
      </p>
    </Card>
  );
}

function InterestsCard({ userId }: { userId: string }) {
  const t = useTranslations("iaAcademician.student.interests");
  const titleId = useId();
  const interests = useAdviseeInterests(userId);
  // The backend found them not to be this academician's advisee after all: no empty card.
  if (!interests.isLoading && !interests.error && interests.profile === null) {
    return null;
  }
  return (
    <Card labelledBy={titleId} className="space-y-4">
      <h2 id={titleId} className="type-label text-text-secondary">
        {t("title")}
      </h2>
      <WorkspaceQueryState
        isLoading={interests.isLoading}
        error={interests.error}
        onRetry={interests.retry}
        isRetrying={interests.isRetrying}
      />
      <InterestsBody interests={interests} />
    </Card>
  );
}

/** The saved topics and goal; nothing while loading or after a failure, which the card's state line covers. */
function InterestsBody({
  interests,
}: {
  interests: ReturnType<typeof useAdviseeInterests>;
}) {
  const t = useTranslations("iaAcademician.student.interests");
  const tSub = useTranslations("studentProfileCompletion.subtopics");
  const topicLabel = useTranslations("peerTopics");
  if (interests.profile === null) return null;
  if (interests.isEmpty) {
    return <p className="type-body-sm text-text-muted">{t("empty")}</p>;
  }
  return (
    <dl className="space-y-4">
      {interests.topics.length === 0 ? null : (
        <div className="space-y-2">
          <dt className="type-caption text-text-muted">{t("topics")}</dt>
          <dd>
            <ul className="flex flex-wrap gap-2">
              {interests.topics.map((topic) => (
                <Chip key={topic}>{topicLabel(topic)}</Chip>
              ))}
              {interests.subtopics.map((sub) => (
                <Chip key={sub.id}>{tSub(sub.labelKey)}</Chip>
              ))}
            </ul>
          </dd>
        </div>
      )}
      <div className="space-y-1">
        <dt className="type-caption text-text-muted">{t("goal")}</dt>
        <dd className="type-body-sm whitespace-pre-line text-text-primary">
          {interests.goal || t("noGoal")}
        </dd>
      </div>
    </dl>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <li className="rounded-full bg-background-selected px-3 py-1.5 type-label-sm text-text-accent">
      {children}
    </li>
  );
}

function PendingRequestCard({
  request,
  withActions,
}: {
  request: NonNullable<AcademicianStudent["pendingRequest"]>;
  withActions: boolean;
}) {
  const t = useTranslations("iaAcademician.student");
  const titleId = useId();
  return (
    <Card featured labelledBy={titleId} className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={titleId} className="type-label text-text-secondary">
          {t("pendingTitle")}
        </h2>
        <StatusBadge tone={BADGE_TONE[StudentHistoryBadge.Pending]}>
          {t("badges.pending")}
        </StatusBadge>
      </div>
      <p className="type-h3 text-text-primary">{request.topic}</p>
      {request.when === null ? null : (
        <p className="type-body-sm text-text-secondary">{request.when}</p>
      )}
      {request.note === null ? null : (
        <p className="rounded-2xl bg-background-subtle px-4 py-3 type-body-sm text-text-secondary">
          {request.note}
        </p>
      )}
      {withActions ? (
        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant={ButtonVariant.Ghost} href={request.href}>
            {t("decline")}
          </Button>
          <Button variant={ButtonVariant.Secondary} href={request.proposeHref}>
            {t("propose")}
          </Button>
          <Button href={request.href}>{t("accept")}</Button>
        </div>
      ) : null}
    </Card>
  );
}

function HistoryCard({ history }: { history: AcademicianStudent["history"] }) {
  const t = useTranslations("iaAcademician.student");
  const titleId = useId();
  return (
    <Card labelledBy={titleId} className="space-y-3">
      <h2 id={titleId} className="type-label text-text-secondary">
        {t("history")}
      </h2>
      {history.length === 0 ? (
        <p className="type-body-sm text-text-muted">{t("historyEmpty")}</p>
      ) : (
        <ul className="divide-y divide-border-subtle">
          {history.map((item) => (
            <li
              key={item.key}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div>
                <p className="type-label text-text-primary">{item.title}</p>
                <p className="type-caption text-text-muted">{item.when}</p>
              </div>
              <StatusBadge tone={BADGE_TONE[item.badge]}>
                {t(`badges.${item.badge}`)}
              </StatusBadge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
