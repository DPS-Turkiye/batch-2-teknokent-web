"use client";

import { AlarmClock, CalendarPlus, GraduationCap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { QueryNotice } from "@/components/admin/admin-ui";
import { AppointmentRow } from "@/components/student/ia/appointment-row";
import {
  AppointmentStatusPill,
  iaButton,
  iaCard,
  iaText,
  InitialsAvatar,
  Pill,
  ReasonBox,
  SectionHeader,
} from "@/components/student/ia/ui";
import { PeerMentorRequestDialog } from "@/components/student/peer-mentor-request-dialog";
import { useStudentHome, type StudentHomeModel } from "@/hooks/use-student-home";
import {
  AppointmentKind,
  AppointmentStatus,
  type Appointment,
} from "@/interfaces/appointment";
import type {
  PeerMentorCard,
  PeerMentoringRequest,
} from "@/interfaces/peer-mentoring";
import { timeLabel } from "@/lib/calendar";
import { formatDayMonth } from "@/lib/utils";

const OFFICE_HOURS_HREF = "/student/office-hours";
const PEER_MENTORING_HREF = "/student/peer-mentoring";
const APPOINTMENTS_HREF = "/student/appointments";

export function StudentHomeView() {
  const t = useTranslations("studentIa.home");
  const tGreeting = useTranslations("common.greeting");
  const home = useStudentHome();
  const [asking, setAsking] = useState<PeerMentorCard | null>(null);
  const greeting = tGreeting(home.greeting);

  return (
    <div className="flex flex-col gap-8">
      <h1
        className={`text-[28px] leading-10 font-bold tracking-[-0.48px] sm:text-[32px] ${iaText.primary}`}
      >
        {home.name ? t("greeting", { greeting, name: home.name }) : greeting}
      </h1>
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
                  <p className={`${iaCard} p-5 text-[13px] ${iaText.muted}`}>
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
            </div>
            <div className="flex flex-col gap-8">
              {home.advisor ? <AdvisorCard advisor={home.advisor} /> : null}
              <PendingRequests home={home} />
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
  const t = useTranslations("studentIa.home.next");
  const tKind = useTranslations("studentIa.common.kind");
  const tTopic = useTranslations("peerTopics");
  const locale = useLocale();
  const { counterpart } = appointment;
  const who = [counterpart.title, counterpart.fullName]
    .filter(Boolean)
    .join(" ");
  const when = [
    formatDayMonth(new Date(appointment.startsAt), locale),
    `${timeLabel(appointment.startsAt, locale)} – ${timeLabel(appointment.endsAt, locale)}`,
    tKind(appointment.kind),
  ].join(" · ");

  return (
    <section
      aria-label={t("label")}
      className="rounded-[28px] bg-[var(--color-brand-odtu-primary,#d0112b)] p-3 sm:px-5 sm:py-4"
    >
      <div className="flex flex-col gap-4 rounded-[20px] border border-white/50 bg-[rgba(28,32,38,0.2)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-center gap-3.5">
          <InitialsAvatar name={counterpart.fullName} />
          <div className="min-w-0 text-white">
            <p className="truncate text-[13px] leading-5">
              {[who, counterpart.department].filter(Boolean).join(" · ")}
            </p>
            <p className="text-[18px] leading-[26px] font-bold tracking-[-0.054px] break-words">
              {appointment.category
                ? tTopic(appointment.category)
                : appointment.topic}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <p className="flex items-center gap-1.5 text-[13px] leading-5 text-white">
            <AlarmClock aria-hidden className="size-4" strokeWidth={1.5} />
            {when}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <AppointmentStatusPill status={appointment.status} />
            <Link href={APPOINTMENTS_HREF} className={iaButton.small}>
              {t("view")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function QuickActions({ home }: { home: StudentHomeModel }) {
  const t = useTranslations("studentIa.home.quick");
  const cards = [
    {
      key: "officeHours",
      href: OFFICE_HOURS_HREF,
      image: "/student/quick-office-hours.png",
      body: t("officeHours.body"),
      featured: true,
    },
    {
      key: "peerMentor",
      href: PEER_MENTORING_HREF,
      image: "/student/quick-peer-mentor.png",
      body: t("peerMentor.body"),
      featured: false,
    },
    {
      key: "appointments",
      href: APPOINTMENTS_HREF,
      image: "/student/quick-appointments.png",
      body: t("appointments.body", {
        upcoming: home.confirmedCount,
        requests: home.requestCount,
      }),
      featured: false,
    },
    {
      key: "profile",
      href: home.profileHref,
      image: "/student/quick-profile.png",
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
              className={`flex h-[105px] items-center gap-3.5 overflow-hidden p-5 transition ${
                card.featured
                  ? "rounded-[20px] bg-[var(--color-brand-odtu-bg,#fdedef)] hover:bg-[#fbdde1]"
                  : `${iaCard} rounded-[20px] hover:border-[var(--color-border-default,#dce1e6)]`
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
                <span
                  className={`text-[16px] leading-[22px] font-bold tracking-[-0.032px] ${iaText.primary}`}
                >
                  {t(`${card.key}.title`)}
                </span>
                <span
                  className={`truncate text-[12px] leading-4 ${iaText.muted}`}
                >
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
  const t = useTranslations("studentIa.home.mentors");
  return (
    <article
      className={`${iaCard} flex w-full flex-col gap-4 p-6 shadow-[0_1px_1.5px_rgba(28,32,38,0.05),0_1px_1px_rgba(28,32,38,0.04)]`}
    >
      <div className="flex items-center gap-3">
        <InitialsAvatar name={mentor.fullName} size="lg" />
        <div className="min-w-0">
          <h3
            className={`text-[18px] leading-[26px] font-bold ${iaText.primary}`}
          >
            {mentor.fullName}
          </h3>
          <p className={`text-[13px] leading-5 ${iaText.secondary}`}>
            {[mentor.department, t("role")].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
      <ReasonBox reasons={mentor.recommendationReasons} />
      <div className="mt-auto flex flex-wrap gap-3">
        <Link href={PEER_MENTORING_HREF} className={iaButton.secondary}>
          {t("profile")}
        </Link>
        <button
          type="button"
          className={`${iaButton.primary} flex-1`}
          onClick={onAsk}
        >
          {t("request")}
        </button>
      </div>
    </article>
  );
}

function AdvisorCard({
  advisor,
}: {
  advisor: NonNullable<StudentHomeModel["advisor"]>;
}) {
  const t = useTranslations("studentIa.home.advisor");
  const name = [advisor.academicTitle, advisor.fullName]
    .filter(Boolean)
    .join(" ");
  return (
    <section
      aria-labelledby="student-advisor"
      className="flex flex-col gap-4 rounded-[28px] border border-[var(--color-card-featured-border,#f9c9cf)] p-6"
    >
      <p
        className={`flex items-center gap-2 text-[11px] leading-4 font-semibold tracking-[0.88px] uppercase ${iaText.accent}`}
      >
        <GraduationCap aria-hidden className="size-5" strokeWidth={1.5} />
        {t("label")}
      </p>
      <div className="flex items-center gap-3">
        <InitialsAvatar name={advisor.fullName} size="lg" />
        <div className="min-w-0">
          <h2
            id="student-advisor"
            className={`text-[18px] leading-[26px] font-bold ${iaText.primary}`}
          >
            {name}
          </h2>
          <p className={`text-[13px] leading-5 ${iaText.secondary}`}>
            {t("source")}
          </p>
        </div>
      </div>
      <Link
        href={OFFICE_HOURS_HREF}
        className={`${iaButton.primary} justify-start`}
      >
        <CalendarPlus aria-hidden className="size-5" strokeWidth={1.5} />
        {t("request")}
      </Link>
    </section>
  );
}

function PendingRequests({ home }: { home: StudentHomeModel }) {
  const t = useTranslations("studentIa.home.requests");
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
        <p
          className={`${iaCard} rounded-[20px] p-5 text-[13px] ${iaText.muted}`}
        >
          {t("empty")}
        </p>
      ) : (
        <ul
          className={`${iaCard} divide-y divide-[var(--color-border-subtle,#e5e9ed)] rounded-[20px]`}
        >
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
  const t = useTranslations("studentIa.home.requests");
  const tKind = useTranslations("studentIa.common.kind");
  const locale = useLocale();
  const { counterpart } = appointment;
  const replyNeeded =
    appointment.status === AppointmentStatus.AlternativeProposed;
  return (
    <li className="flex flex-col gap-3 p-5">
      <div className="flex items-start gap-3">
        <InitialsAvatar name={counterpart.fullName} size="sm" />
        <div className="min-w-0">
          <p className={`text-[14px] leading-5 font-medium ${iaText.primary}`}>
            {[counterpart.title, counterpart.fullName]
              .filter(Boolean)
              .join(" ")}
          </p>
          <p className={`text-[12px] leading-4 ${iaText.muted}`}>
            {`${tKind(appointment.kind)} · ${formatDayMonth(new Date(appointment.startsAt), locale)}, ${timeLabel(appointment.startsAt, locale)}`}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 pl-11">
        <AppointmentStatusPill status={appointment.status} />
        {replyNeeded ? (
          <Link
            href={APPOINTMENTS_HREF}
            className={`${iaButton.small} bg-[var(--color-background-selected,#fdedef)] shadow-none`}
          >
            {t("reply")}
          </Link>
        ) : null}
      </div>
    </li>
  );
}

function AwaitingPeerRequest({ request }: { request: PeerMentoringRequest }) {
  const t = useTranslations("studentIa.home.requests");
  const tKind = useTranslations("studentIa.common.kind");
  const tTopic = useTranslations("peerTopics");
  return (
    <li className="flex items-center gap-3 p-5">
      <InitialsAvatar name={request.mentor.fullName} size="sm" />
      <div className="min-w-0 flex-1">
        <p className={`text-[14px] leading-5 font-medium ${iaText.primary}`}>
          {request.mentor.fullName}
        </p>
        <p className={`text-[12px] leading-4 ${iaText.muted}`}>
          {`${tKind(AppointmentKind.PeerMentoring)} · ${tTopic(request.category)}`}
        </p>
      </div>
      <Pill tone="warning">{t("waiting")}</Pill>
    </li>
  );
}
