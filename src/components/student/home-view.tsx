"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import {
  EmptyNote,
  PageHeading,
  Panel,
  QueryNotice,
  StatusChip,
} from "@/components/admin/admin-ui";
import { AppointmentRoleLabel } from "@/components/appointments/appointment-role-label";
import { AppointmentStatusChip } from "@/components/appointments/appointment-status-chip";
import {
  studentRouteReady,
  studentRouteSoon,
} from "@/components/student/student-frame";
import { useStudentHome } from "@/hooks/use-student-home";
import type { Appointment } from "@/interfaces/appointment";
import { formatDateTime } from "@/lib/utils";

export const STUDENT_PROFILE_COMPLETION_HREF = "/student/profile/complete";
const APPOINTMENTS_HREF = "/student/appointments";

const ENTRY_CARDS = [
  { href: "/student/peer-mentoring", key: "peerMentoring" },
  { href: "/student/office-hours", key: "officeHours" },
] as const;

export function StudentHomeView() {
  const t = useTranslations("odtuWorkspaces.student.home");
  const home = useStudentHome();
  const data = home.data;

  return (
    <div className="space-y-8">
      <PageHeading title={t("title")} subtitle={t("subtitle")} />
      <QueryNotice isLoading={home.isLoading} error={home.error} />
      {data ? (
        <>
          {data.profileCompleted ? null : (
            <Panel>
              <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-[16px] font-semibold text-[#22262b]">
                    {t("profileTitle")}
                  </h2>
                  <p className="mt-1 text-[13.5px] text-[#676e78]">
                    {t("profileBody")}
                  </p>
                </div>
                <ReadyLink
                  href={STUDENT_PROFILE_COMPLETION_HREF}
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-[#22262b] px-4 text-[13px] font-medium text-white"
                >
                  {t("profileAction")}
                </ReadyLink>
              </div>
            </Panel>
          )}

          <section aria-labelledby="student-upcoming" className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2
                id="student-upcoming"
                className="text-[16px] font-semibold text-[#1d3a5f]"
              >
                {t("upcomingTitle")}
              </h2>
              <ReadyLink
                href={APPOINTMENTS_HREF}
                className="text-[13px] font-medium text-[#1583d6]"
              >
                {t("seeAll")}
              </ReadyLink>
            </div>
            <Panel>
              {data.upcomingAppointments.length === 0 ? (
                <EmptyNote>{t("upcomingEmpty")}</EmptyNote>
              ) : (
                <ul className="divide-y divide-[#eef0f2]">
                  {data.upcomingAppointments.map((appointment) => (
                    <UpcomingRow
                      key={appointment.id}
                      appointment={appointment}
                    />
                  ))}
                </ul>
              )}
            </Panel>
          </section>

          <section
            aria-label={t("entryLabel")}
            className="grid gap-4 sm:grid-cols-2"
          >
            {ENTRY_CARDS.map((card) => (
              <ReadyLink
                key={card.key}
                href={card.href}
                className="block rounded-3xl border border-[#e9ecef] bg-white p-6"
              >
                <h2 className="text-[16px] font-semibold text-[#22262b]">
                  {t(`${card.key}.title`)}
                </h2>
                <p className="mt-1 text-[13.5px] text-[#676e78]">
                  {t(`${card.key}.body`)}
                </p>
              </ReadyLink>
            ))}
          </section>
        </>
      ) : null}
    </div>
  );
}

function UpcomingRow({ appointment }: { appointment: Appointment }) {
  const locale = useLocale();
  const { counterpart } = appointment;
  const who = counterpart.title
    ? `${counterpart.title} ${counterpart.fullName}`
    : counterpart.fullName;
  return (
    <li className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-[14px] font-medium text-[#22262b]">
          {appointment.topic}
        </p>
        <p className="mt-0.5 text-[12.5px] text-[#676e78]">
          {who} · {formatDateTime(appointment.startsAt, locale)}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <AppointmentRoleLabel kind={appointment.kind} side={appointment.side} />
        <AppointmentStatusChip status={appointment.status} />
      </div>
    </li>
  );
}

/** A link once its screen has landed (chipped "Yakında" while it only says what is coming); before that, the same content unclickable with the chip. */
function ReadyLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: ReactNode;
}) {
  const t = useTranslations("roleFrame");
  if (studentRouteReady(href)) {
    return (
      <Link href={href} className={className}>
        {children}
        {studentRouteSoon(href) ? (
          <span className="mt-3 inline-block">
            <StatusChip tone="neutral">{t("soon")}</StatusChip>
          </span>
        ) : null}
      </Link>
    );
  }
  return (
    <div aria-disabled="true" className={`${className} opacity-60`}>
      {children}
      <span className="ml-2 inline-block align-middle">
        <StatusChip tone="neutral">{t("soon")}</StatusChip>
      </span>
    </div>
  );
}
