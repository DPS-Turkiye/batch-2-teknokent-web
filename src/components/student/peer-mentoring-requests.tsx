"use client";

import { CalendarDays, Info } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { QueryNotice } from "@/components/admin/admin-ui";
import { Button, ButtonSize, ButtonVariant } from "@/components/ia/button";
import {
  InitialsAvatar,
  RequestStatusBadge,
} from "@/components/student/iskur-ui";
import { NameSuffix } from "@/components/student/peer-mentor-directory";
import { PeerSessionBookingDialog } from "@/components/student/peer-session-booking-dialog";
import { useMyPeerMentorships } from "@/hooks/use-peer-mentoring";
import type { PeerMentoringRequest } from "@/interfaces/peer-mentoring";
import { peerMentorProfileHref } from "@/lib/peer-mentoring";
import { formatDateTime, initials } from "@/lib/utils";

const APPOINTMENTS_HREF = "/student/appointments";

/**
 * Mentorluk Al › Mentorluklarım: the active mentorships (accepted requests, with the next meeting or a way to plan
 * one) and the student's other requests.
 */
export function PeerMentoringRequests({
  onFindAnother,
}: {
  /** "Başka Mentor Bul" on a closed request: back to Keşfet. */
  onFindAnother: () => void;
}) {
  const t = useTranslations("iaIskur.take.mine");
  const mine = useMyPeerMentorships();

  return (
    <div className="space-y-8">
      <QueryNotice isLoading={mine.query.isLoading} error={mine.query.error} />
      {mine.query.data && mine.count === 0 ? (
        <p className="rounded-card border border-border-subtle bg-background-surface p-6 type-body text-text-secondary">
          {t("empty")}
        </p>
      ) : null}
      {mine.query.data && mine.count > 0 ? (
        <>
          <section aria-labelledby="peer-active-title" className="space-y-4">
            <Heading id="peer-active-title" count={mine.active.length}>
              {t("activeTitle")}
            </Heading>
            {mine.active.length === 0 ? (
              <p className="type-body-sm text-text-secondary">
                {t("noActive")}
              </p>
            ) : (
              <ul className="space-y-4">
                {mine.active.map((request) => (
                  <li key={request.id}>
                    <ActiveMentorship
                      request={request}
                      session={mine.sessionOf(request.id)}
                      sessionsLoading={mine.sessionsLoading}
                      onBook={() => mine.openBooking(request)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section aria-labelledby="peer-others-title" className="space-y-4">
            <Heading id="peer-others-title" count={mine.others.length}>
              {t("othersTitle")}
            </Heading>
            {mine.others.length === 0 ? (
              <p className="type-body-sm text-text-secondary">
                {t("noOthers")}
              </p>
            ) : (
              <ul className="divide-y divide-border-subtle overflow-hidden rounded-card border border-border-subtle bg-background-surface">
                {mine.others.map((request) => (
                  <li
                    key={request.id}
                    className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <RequestSummary request={request} />
                    <div className="flex flex-wrap items-center gap-2">
                      <RequestStatusBadge status={request.status} />
                      {mine.isClosed(request) ? (
                        <Button
                          variant={ButtonVariant.Secondary}
                          size={ButtonSize.Small}
                          onClick={onFindAnother}
                        >
                          {t("findAnother")}
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <p className="flex items-center gap-2 type-caption text-text-muted">
            <Info aria-hidden className="size-4 shrink-0" />
            {t("note")}
          </p>
        </>
      ) : null}
      {mine.booking ? (
        <PeerSessionBookingDialog
          request={mine.booking}
          onClose={mine.closeBooking}
        />
      ) : null}
    </div>
  );
}

function Heading({
  id,
  count,
  children,
}: {
  id: string;
  count: number;
  children: string;
}) {
  return (
    <h2 id={id} className="flex items-baseline gap-2">
      <span className="type-title-card text-text-primary">{children}</span>
      <span className="type-caption text-text-muted">{count}</span>
    </h2>
  );
}

function RequestSummary({ request }: { request: PeerMentoringRequest }) {
  const t = useTranslations("iaIskur.take.mine");
  const tTopic = useTranslations("peerTopics");
  const locale = useLocale();
  return (
    <div className="flex min-w-0 items-center gap-3">
      <InitialsAvatar initials={initials(request.mentor.fullName)} />
      <div className="min-w-0">
        <p className="truncate type-title-card text-text-primary">
          {request.mentor.fullName}
        </p>
        <p className="type-caption text-text-secondary">
          {tTopic(request.category)} ·{" "}
          {t("sentAt", { date: formatDateTime(request.createdAt, locale) })}
        </p>
      </div>
    </div>
  );
}

function ActiveMentorship({
  request,
  session,
  sessionsLoading,
  onBook,
}: {
  request: PeerMentoringRequest;
  session: { startsAt: string } | null;
  sessionsLoading: boolean;
  onBook: () => void;
}) {
  const t = useTranslations("iaIskur.take.mine");
  const tTopic = useTranslations("peerTopics");
  const locale = useLocale();
  return (
    <article
      aria-label={request.mentor.fullName}
      className="flex flex-col gap-4 rounded-card border border-card-featured-border bg-card-featured-bg p-6 md:flex-row md:items-center md:justify-between"
    >
      <div className="flex min-w-0 items-center gap-4">
        <InitialsAvatar initials={initials(request.mentor.fullName)} />
        <div className="min-w-0 space-y-1">
          <h3 className="type-h4 text-text-primary">
            {request.mentor.fullName}
          </h3>
          <p className="type-body-sm text-text-secondary">
            {tTopic(request.category)}
          </p>
          {session ? (
            <p className="flex items-center gap-1.5 type-caption text-text-accent">
              <CalendarDays aria-hidden className="size-3.5" />
              {t("nextSession", {
                date: formatDateTime(session.startsAt, locale),
              })}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          href={peerMentorProfileHref(request.mentor.userId)}
          variant={ButtonVariant.Ghost}
        >
          {t("seeProfile")}
          <NameSuffix name={request.mentor.fullName} />
        </Button>
        {session ? (
          <Button href={APPOINTMENTS_HREF}>{t("seeAppointment")}</Button>
        ) : sessionsLoading ? null : (
          <Button onClick={onBook}>{t("book")}</Button>
        )}
      </div>
    </article>
  );
}
