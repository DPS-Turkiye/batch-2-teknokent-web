"use client";

import { AlarmClock, CalendarPlus, GraduationCap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { QueryNotice } from "@/components/admin/admin-ui";
import {
  Button,
  buttonClasses,
  ButtonSize,
  ButtonVariant,
} from "@/components/ia/button";
import { StatusBadge, StatusTone } from "@/components/ia/status-badge";
import { AppointmentRow } from "@/components/student/ia/appointment-row";
import {
  AppointmentStatusBadge,
  InitialsAvatar,
  ReasonBox,
  SectionHeader,
} from "@/components/student/ia/ui";
import { PeerMentorRequestDialog } from "@/components/student/peer-mentor-request-dialog";
import {
  useStudentHome,
  type StudentHomeModel,
} from "@/hooks/use-student-home";
import {
  AppointmentKind,
  AppointmentStatus,
  type Appointment,
} from "@/interfaces/appointment";
import type {
  PeerMentorCard,
  PeerMentoringRequest,
} from "@/interfaces/peer-mentoring";
import { currentTime } from "@/lib/appointments";
import { timeLabel } from "@/lib/calendar";
import { formatDayMonth } from "@/lib/utils";

const OFFICE_HOURS_HREF = "/student/office-hours";
const PEER_MENTORING_HREF = "/student/peer-mentoring";
const APPOINTMENTS_HREF = "/student/appointments";

/**
 * Ana Sayfa (Figma 80:2). `main` and `aside` are extension points: another student edition (İŞKUR) adds its own
 * blocks below the main column or the side column without changing this screen.
 */
export function StudentHomeView({
  main,
  aside,
}: {
  main?: ReactNode;
  aside?: ReactNode;
}) {
  const t = useTranslations("iaStudent.home");
  const home = useStudentHome();
  const [asking, setAsking] = useState<PeerMentorCard | null>(null);

  return (
    <div className="flex flex-col gap-8">
      {home.greeting ? (
        <h1 className="type-h1 text-text-primary">
          {home.name
            ? t("greeting", { greeting: home.greeting, name: home.name })
            : home.greeting}
        </h1>
      ) : null}
      <QueryNotice isLoading={home.isLoading} error={home.error} />
      {home.ready ? (
        <>
          {home.next ? <NextAppointment appointment={home.next} /> : null}
          <QuickActions home={home} />
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
            <div className="flex min-w-0 flex-col gap-8">
              <section
                aria-labelledby="student-upcoming"
                className="flex flex-col gap-3.5"
              >
                <SectionHeader
                  id="student-upcoming"
                  title={t("upcoming.title")}
                  action={{ href: APPOINTMENTS_HREF, label: t("seeAll") }}
                />
                {home.upcoming.length === 0 ? (
                  <p className="rounded-card border border-border-subtle p-5 type-body-sm text-text-muted">
                    {t("upcoming.empty")}
                  </p>
                ) : (
                  <ul className="flex flex-col gap-3.5">
                    {home.upcoming.map((appointment) => (
                      <li key={appointment.id}>
                        <AppointmentRow
                          appointment={appointment}
                          href={APPOINTMENTS_HREF}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              {home.mentors.length > 0 ? (
                <section
                  aria-labelledby="student-mentors"
                  className="flex flex-col gap-3.5"
                >
                  <SectionHeader
                    id="student-mentors"
                    title={t("mentors.title")}
                    hint={t("mentors.hint")}
                    action={{
                      href: PEER_MENTORING_HREF,
                      label: t("mentors.all"),
                    }}
                  />
                  <ul className="grid gap-4 md:grid-cols-2">
                    {home.mentors.map((mentor) => (
                      <li key={mentor.mentorId} className="flex">
                        <MentorCard
                          mentor={mentor}
                          onAsk={() => setAsking(mentor)}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {main}
            </div>
            <div className="flex flex-col gap-8">
              {home.advisor ? <AdvisorCard advisor={home.advisor} /> : null}
              <PendingRequests home={home} />
              {aside}
            </div>
          </div>
        </>
      ) : null}
      {asking ? (
        <PeerMentorRequestDialog
          mentor={asking}
          onClose={() => setAsking(null)}
        />
      ) : null}
    </div>
  );
}

function NextAppointment({ appointment }: { appointment: Appointment }) {
  const t = useTranslations("iaStudent.home.next");
  const tKind = useTranslations("iaStudent.common.kind");
  const tTopic = useTranslations("peerTopics");
  const locale = useLocale();
  const { counterpart } = appointment;
  const who = [counterpart.title, counterpart.fullName]
    .filter(Boolean)
    .join(" ");
  const time = currentTime(appointment);
  const when = [
    formatDayMonth(new Date(time.startsAt), locale),
    `${timeLabel(time.startsAt, locale)} – ${timeLabel(time.endsAt, locale)}`,
    tKind(appointment.kind),
  ].join(" · ");

  return (
    <section
      aria-label={t("label")}
      className="rounded-featured bg-action-primary-bg p-3 sm:px-5 sm:py-4"
    >
      <div className="flex flex-col gap-4 rounded-[20px] border border-white/50 bg-background-inverse/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-center gap-3.5">
          <InitialsAvatar name={counterpart.fullName} />
          <div className="min-w-0 text-text-inverse">
            <p className="truncate type-body-sm">
              {[who, counterpart.department].filter(Boolean).join(" · ")}
            </p>
            <p className="type-h4 break-words">
              {appointment.category
                ? tTopic(appointment.category)
                : appointment.topic}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <p className="flex items-center gap-1.5 type-body-sm text-text-inverse">
            <AlarmClock aria-hidden className="size-4" strokeWidth={1.5} />
            {when}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <AppointmentStatusBadge status={appointment.status} />
            <Link
              href={APPOINTMENTS_HREF}
              className={`${buttonClasses(ButtonVariant.Ghost, ButtonSize.Small)} border-0 text-text-accent`}
            >
              {t("view")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

const QUICK_IMAGE_DIR = "/ia/student";

function QuickActions({ home }: { home: StudentHomeModel }) {
  const t = useTranslations("iaStudent.home.quick");
  const cards = [
    {
      key: "officeHours",
      href: OFFICE_HOURS_HREF,
      image: `${QUICK_IMAGE_DIR}/quick-office-hours.png`,
      body: t("officeHours.body"),
      featured: true,
    },
    {
      key: "peerMentor",
      href: PEER_MENTORING_HREF,
      image: `${QUICK_IMAGE_DIR}/quick-peer-mentor.png`,
      body: t("peerMentor.body"),
      featured: false,
    },
    {
      key: "appointments",
      href: APPOINTMENTS_HREF,
      image: `${QUICK_IMAGE_DIR}/quick-appointments.png`,
      body: t("appointments.body", {
        upcoming: home.confirmedCount,
        requests: home.requestCount,
      }),
      featured: false,
    },
    {
      key: "profile",
      href: home.profileHref,
      image: `${QUICK_IMAGE_DIR}/quick-profile.png`,
      body: t("profile.body"),
      featured: false,
    },
  ] as const;

  return (
    <nav aria-label={t("label")}>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <li key={card.key}>
            <Link
              href={card.href}
              className={`flex h-[105px] items-center gap-3.5 overflow-hidden rounded-[20px] p-5 transition hover:shadow-hover ${
                card.featured
                  ? "bg-card-featured-bg"
                  : "border border-border-subtle bg-background-surface"
              }`}
            >
              <Image
                src={card.image}
                alt=""
                width={80}
                height={64}
                className="h-16 w-20 shrink-0 object-contain"
              />
              <span className="flex min-w-0 flex-col gap-1">
                <span className="type-title-card text-text-primary">
                  {t(`${card.key}.title`)}
                </span>
                <span className="truncate type-caption text-text-muted">
                  {card.body}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function MentorCard({
  mentor,
  onAsk,
}: {
  mentor: PeerMentorCard;
  onAsk: () => void;
}) {
  const t = useTranslations("iaStudent.home.mentors");
  return (
    <article className="flex w-full flex-col gap-4 rounded-card border border-border-subtle bg-background-surface p-6 shadow-raised">
      <div className="flex items-center gap-3">
        <InitialsAvatar name={mentor.fullName} size="lg" />
        <div className="min-w-0">
          <h3 className="type-h4 text-text-primary">{mentor.fullName}</h3>
          <p className="type-body-sm text-text-secondary">
            {[mentor.department, t("role")].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
      <ReasonBox reasons={mentor.recommendationReasons} />
      <div className="mt-auto flex flex-wrap gap-3">
        <Button variant={ButtonVariant.Ghost} href={PEER_MENTORING_HREF}>
          {t("profile")}
        </Button>
        <Button onClick={onAsk} className="flex-1">
          {t("request")}
        </Button>
      </div>
    </article>
  );
}

function AdvisorCard({
  advisor,
}: {
  advisor: NonNullable<StudentHomeModel["advisor"]>;
}) {
  const t = useTranslations("iaStudent.home.advisor");
  const name = [advisor.academicTitle, advisor.fullName]
    .filter(Boolean)
    .join(" ");
  return (
    <section
      aria-labelledby="student-advisor"
      className="flex flex-col gap-4 rounded-featured border border-card-featured-border bg-background-surface p-6"
    >
      <p className="flex items-center gap-2 type-overline text-text-accent">
        <GraduationCap aria-hidden className="size-5" strokeWidth={1.5} />
        {t("label")}
      </p>
      <div className="flex items-center gap-3">
        <InitialsAvatar name={advisor.fullName} size="lg" />
        <div className="min-w-0">
          <h2 id="student-advisor" className="type-h4 text-text-primary">
            {name}
          </h2>
          <p className="type-body-sm text-text-secondary">{t("source")}</p>
        </div>
      </div>
      <Button href={OFFICE_HOURS_HREF} fullWidth className="justify-start">
        <CalendarPlus aria-hidden className="size-5" strokeWidth={1.5} />
        {t("request")}
      </Button>
    </section>
  );
}

function PendingRequests({ home }: { home: StudentHomeModel }) {
  const t = useTranslations("iaStudent.home.requests");
  return (
    <section
      aria-labelledby="student-requests"
      className="flex flex-col gap-3.5"
    >
      <SectionHeader
        id="student-requests"
        title={t("title")}
        action={
          home.requestCount > 0
            ? {
                href: APPOINTMENTS_HREF,
                label: t("all", { count: home.requestCount }),
              }
            : undefined
        }
      />
      {home.requestCount === 0 ? (
        <p className="rounded-[20px] border border-border-subtle p-5 type-body-sm text-text-muted">
          {t("empty")}
        </p>
      ) : (
        <ul className="divide-y divide-border-subtle rounded-[20px] border border-border-subtle bg-background-surface">
          {home.awaiting.map((appointment) => (
            <AwaitingAppointment
              key={appointment.id}
              appointment={appointment}
            />
          ))}
          {home.peerRequests.map((request) => (
            <AwaitingPeerRequest key={request.id} request={request} />
          ))}
        </ul>
      )}
    </section>
  );
}

function AwaitingAppointment({ appointment }: { appointment: Appointment }) {
  const t = useTranslations("iaStudent.home.requests");
  const tKind = useTranslations("iaStudent.common.kind");
  const locale = useLocale();
  const { counterpart } = appointment;
  const replyNeeded =
    appointment.status === AppointmentStatus.AlternativeProposed;
  return (
    <li className="flex flex-col gap-3 p-5">
      <div className="flex items-start gap-3">
        <InitialsAvatar name={counterpart.fullName} size="sm" />
        <div className="min-w-0">
          <p className="type-label text-text-primary">
            {[counterpart.title, counterpart.fullName]
              .filter(Boolean)
              .join(" ")}
          </p>
          <p className="type-caption text-text-muted">
            {`${tKind(appointment.kind)} · ${formatDayMonth(new Date(currentTime(appointment).startsAt), locale)}, ${timeLabel(currentTime(appointment).startsAt, locale)}`}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 pl-11">
        <AppointmentStatusBadge status={appointment.status} />
        {replyNeeded ? (
          <Button
            href={APPOINTMENTS_HREF}
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Small}
          >
            {t("reply")}
          </Button>
        ) : null}
      </div>
    </li>
  );
}

function AwaitingPeerRequest({ request }: { request: PeerMentoringRequest }) {
  const t = useTranslations("iaStudent.home.requests");
  const tKind = useTranslations("iaStudent.common.kind");
  const tTopic = useTranslations("peerTopics");
  return (
    <li className="flex items-center gap-3 p-5">
      <InitialsAvatar name={request.mentor.fullName} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="type-label text-text-primary">
          {request.mentor.fullName}
        </p>
        <p className="type-caption text-text-muted">
          {`${tKind(AppointmentKind.PeerMentoring)} · ${tTopic(request.category)}`}
        </p>
      </div>
      <StatusBadge tone={StatusTone.Warning}>{t("waiting")}</StatusBadge>
    </li>
  );
}
