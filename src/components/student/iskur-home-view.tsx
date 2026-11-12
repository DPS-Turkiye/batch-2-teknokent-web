"use client";

import { useLocale, useTranslations } from "next-intl";

import { Button, ButtonSize, ButtonVariant } from "@/components/ia/button";
import { Card } from "@/components/ia/card";
import { StatusBadge, StatusTone } from "@/components/ia/status-badge";
import { StudentHomeView } from "@/components/student/home-view";
import { SectionHeader } from "@/components/student/ia/ui";
import {
  InitialsAvatar,
  RequestStatusBadge,
} from "@/components/student/iskur-ui";
import { PEER_MENTOR_WIZARD_HREF } from "@/components/student/peer-mentor-give-view";
import { useIskurHome } from "@/hooks/use-iskur-home";
import { PEER_MENTOR_GIVE_HREF } from "@/lib/peer-mentoring";
import { formatDateTime, initials } from "@/lib/utils";
import { IskurHomeMode } from "@/types/iskur-student";

/**
 * Ana Sayfa for İŞKUR students and peer mentors: the shared student home with "Mentorluk verdiğim" in the main
 * column and "Mentor profilin" (or a step towards it) in the side column. Everyone else gets the shared home.
 */
export function IskurHomeView() {
  const home = useIskurHome();
  if (home.mode === IskurHomeMode.None) return <StudentHomeView />;
  return (
    <StudentHomeView
      main={home.mode === IskurHomeMode.Mentor ? <Giving home={home} /> : null}
      aside={<MentorSide home={home} />}
    />
  );
}

type Home = ReturnType<typeof useIskurHome>;

function Giving({ home }: { home: Home }) {
  const t = useTranslations("iaIskur.home.giving");
  const tTopic = useTranslations("peerTopics");
  const locale = useLocale();
  return (
    <section aria-labelledby="iskur-giving" className="flex flex-col gap-3.5">
      <SectionHeader
        id="iskur-giving"
        title={t("title")}
        hint={t("hint")}
        action={{ href: PEER_MENTOR_GIVE_HREF, label: t("all") }}
      />
      {home.loaded && home.waiting.length === 0 ? (
        <p className="rounded-card border border-border-subtle p-5 type-body-sm text-text-muted">
          {t("empty")}
        </p>
      ) : null}
      {home.waiting.length > 0 ? (
        <ul className="divide-y divide-border-subtle overflow-hidden rounded-card border border-border-subtle bg-background-surface">
          {home.waiting.map((request) => (
            <li
              key={request.id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <InitialsAvatar initials={initials(request.mentee.fullName)} />
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="truncate type-label text-text-primary">
                      {request.mentee.fullName}
                    </span>
                    {home.isNew(request) ? (
                      <StatusBadge tone={StatusTone.Info}>
                        {t("new")}
                      </StatusBadge>
                    ) : (
                      <RequestStatusBadge status={request.status} />
                    )}
                  </p>
                  <p className="type-caption text-text-secondary">
                    {t("sentAt", {
                      topic: tTopic(request.category),
                      date: formatDateTime(request.createdAt, locale),
                    })}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={ButtonVariant.Ghost}
                  size={ButtonSize.Small}
                  disabled={home.decision.pendingId === request.id}
                  onClick={() => home.decision.decline(request.id)}
                >
                  {t("decline")}
                </Button>
                <Button
                  size={ButtonSize.Small}
                  disabled={home.decision.pendingId === request.id}
                  onClick={() => home.decision.accept(request.id)}
                >
                  {t("accept")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {home.moreWaiting > 0 ? (
        <p className="type-caption text-text-muted">
          {t("more", { count: home.moreWaiting })}
        </p>
      ) : null}
    </section>
  );
}

function MentorSide({ home }: { home: Home }) {
  if (home.mode === IskurHomeMode.Mentor) return <MentorCard home={home} />;
  if (home.mode === IskurHomeMode.CreateProfile) {
    return (
      <NextStep
        mode={IskurHomeMode.CreateProfile}
        href={PEER_MENTOR_WIZARD_HREF}
      />
    );
  }
  return (
    <NextStep mode={IskurHomeMode.Training} href={PEER_MENTOR_GIVE_HREF} />
  );
}

function NextStep({
  mode,
  href,
}: {
  mode: IskurHomeMode.Training | IskurHomeMode.CreateProfile;
  href: string;
}) {
  const t = useTranslations("iaIskur.home");
  return (
    <Card
      featured
      labelledBy="iskur-next-step"
      className="flex flex-col items-start gap-3"
    >
      <h2 id="iskur-next-step" className="type-title-card text-text-primary">
        {t(`${mode}.title`)}
      </h2>
      <p className="type-body-sm text-text-secondary">{t(`${mode}.body`)}</p>
      <Button href={href} size={ButtonSize.Small}>
        {t(`${mode}.action`)}
      </Button>
    </Card>
  );
}

function MentorCard({ home }: { home: Home }) {
  const t = useTranslations("iaIskur.home.mentor");
  const { capacity } = home;
  return (
    <Card labelledBy="iskur-mentor-card" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2
          id="iskur-mentor-card"
          className="type-title-card text-text-primary"
        >
          {t("title")}
        </h2>
        <StatusBadge tone={StatusTone.Success}>{t("active")}</StatusBadge>
      </div>
      <dl className="flex flex-col gap-3">
        <div className="flex justify-between gap-3">
          <dt className="type-body-sm text-text-secondary">{t("badge")}</dt>
          <dd className="type-label text-text-primary">{t("badgeVerified")}</dd>
        </div>
        {capacity ? (
          <div className="flex justify-between gap-3">
            <dt className="type-body-sm text-text-secondary">
              {t("capacity")}
            </dt>
            <dd className="type-label text-text-primary">
              {capacity.capacity === null
                ? t("noCapacity")
                : t("capacityValue", {
                    used: capacity.used,
                    capacity: capacity.capacity,
                  })}
            </dd>
          </div>
        ) : null}
      </dl>
      {typeof capacity?.capacity !== "number" ? null : (
        <div
          role="progressbar"
          aria-label={t("capacity")}
          aria-valuemin={0}
          aria-valuemax={capacity.capacity}
          aria-valuenow={capacity.filled}
          className="h-2 overflow-hidden rounded-full bg-background-muted"
        >
          <div
            className="h-2 rounded-full bg-brand-mentor-primary"
            style={{ width: `${capacity.percent}%` }}
          />
        </div>
      )}
      <Button
        href={PEER_MENTOR_GIVE_HREF}
        variant={ButtonVariant.Secondary}
        fullWidth
      >
        {t("open")}
      </Button>
    </Card>
  );
}
