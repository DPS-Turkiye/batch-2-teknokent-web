"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

import { SampleDataNotice } from "@/components/academician/sample-data-notice";
import { WorkspaceQueryState } from "@/components/academician/workspace-query-state";
import {
  EmptyLine,
  PersonLine,
  StatCard,
  WorkspaceList,
  WorkspaceRow,
  WorkspaceSection,
} from "@/components/academician/workspace-ui";
import { PageHeading } from "@/components/admin/admin-ui";
import { AppointmentStatusChip } from "@/components/appointments/appointment-status-chip";
import { useAcademicianHome } from "@/hooks/use-academician-home";
import { formatTimeRange } from "@/lib/utils";

const REQUESTS_HREF = "/academician/requests";
const APPOINTMENTS_HREF = "/academician/appointments";
const ADVISEES_HREF = "/academician/advisees";
const CALENDAR_HREF = "/academician/calendar";

export function AcademicianHomeView() {
  const t = useTranslations("academicianWorkspace.home");
  const locale = useLocale();
  const home = useAcademicianHome();
  const loaded = !home.isLoading && !home.error;
  const seeAll = (href: string) => (
    <Link href={href} className="text-[13px] font-medium text-[#22262b]">
      {t("seeAll")} →
    </Link>
  );
  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <PageHeading
          title={
            home.name
              ? t("greeting", { name: home.name })
              : t("greetingFallback")
          }
          subtitle={t("subtitle")}
          actions={
            <Link
              href={CALENDAR_HREF}
              className="inline-flex h-10 items-center rounded-full border border-[#e9ecef] bg-white px-4 text-[13px] font-medium text-[#22262b]"
            >
              {t("calendarLink")}
            </Link>
          }
        />
        <SampleDataNotice />
      </div>
      <WorkspaceQueryState
        isLoading={home.isLoading}
        error={home.error}
        onRetry={home.retry}
      />
      {loaded ? (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              value={home.pendingCount}
              title={t("pendingTitle")}
              hint={t("pendingHint")}
              href={REQUESTS_HREF}
              linkLabel={t("pendingLink")}
              highlight={home.pendingCount > 0}
            />
            <StatCard
              value={home.weekCount}
              title={t("weekTitle")}
              hint={t("weekHint")}
              href={APPOINTMENTS_HREF}
              linkLabel={t("weekLink")}
            />
            {home.adviseeCount !== null ? (
              <StatCard
                value={home.adviseeCount}
                title={t("adviseesTitle")}
                hint={t("adviseesHint")}
                href={ADVISEES_HREF}
                linkLabel={t("adviseesLink")}
              />
            ) : null}
          </section>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <WorkspaceSection
              title={t("nextTitle")}
              action={seeAll(APPOINTMENTS_HREF)}
            >
              {home.nextAppointments.length ? (
                <WorkspaceList label={t("nextTitle")}>
                  {home.nextAppointments.map((item) => (
                    <WorkspaceRow key={item.id}>
                      <div className="flex items-center justify-between gap-3">
                        <PersonLine
                          name={item.counterpart.fullName}
                          detail={item.topic}
                        />
                        <p className="shrink-0 text-right text-[12.5px] text-[#676e78]">
                          {formatTimeRange(item.startsAt, item.endsAt, locale)}
                        </p>
                      </div>
                    </WorkspaceRow>
                  ))}
                </WorkspaceList>
              ) : (
                <EmptyLine text={t("nextEmpty")} />
              )}
            </WorkspaceSection>
            <WorkspaceSection
              title={t("requestsTitle")}
              action={seeAll(REQUESTS_HREF)}
            >
              {home.latestRequests.length ? (
                <WorkspaceList label={t("requestsTitle")}>
                  {home.latestRequests.map((item) => (
                    <WorkspaceRow key={item.id}>
                      <div className="flex items-center justify-between gap-3">
                        <PersonLine
                          name={item.student.fullName}
                          detail={item.topic}
                          tone="orange"
                        />
                        <AppointmentStatusChip status={item.status} />
                      </div>
                    </WorkspaceRow>
                  ))}
                </WorkspaceList>
              ) : (
                <EmptyLine text={t("requestsEmpty")} />
              )}
            </WorkspaceSection>
          </div>
        </>
      ) : null}
    </div>
  );
}
