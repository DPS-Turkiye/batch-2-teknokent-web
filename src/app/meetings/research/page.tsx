"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { Avatar } from "@/components/common/avatar";
import { StartupNameLink } from "@/components/common/startup-name-link";
import { AppShell } from "@/components/hoc/app-shell";
import { MeetingUnavailable } from "@/components/meetings/meeting-unavailable";
import { DocumentRequestChecklist } from "@/components/mentorships/document-request-checklist";
import { MeetLinkDisplay } from "@/components/mentorships/meet-link-display";
import { MentorAccent } from "@/components/mentorships/mentor-accent";
import { MentorshipsBackLink } from "@/components/mentorships/mentorships-back-link";
import { RequestDetailsPanel } from "@/components/mentorships/request-details-panel";
import { useAppSession } from "@/components/providers/session-provider";
import { useMeetingLifecycle } from "@/hooks/use-meeting-lifecycle";
import { useMeetings } from "@/hooks/use-meetings";
import { useMentorshipRequest } from "@/hooks/use-mentorship-requests";
import {
  ORGANIZATION_PROGRAMS_QUERY_KEY,
  PROGRAMS_QUERY_KEY,
} from "@/hooks/use-programs";
import { UserRole } from "@/interfaces/session";
import { getMeetingRoom } from "@/lib/client/meetings";
import { getOrganizationPrograms, getPrograms } from "@/lib/client/programs";
import { CALENDAR_SUPPORT_AREA, MENTORSHIPS_ACTIVE_HREF } from "@/lib/const";
import {
  isCalendarOriginRequest,
  isFirstMeetingWithMentor,
  meetingCounterpartName,
  meetingInviteeLabels,
  meetingScheduleLabel,
  programsForOrganization,
} from "@/lib/meeting-context";
import { needLabels } from "@/lib/mentor-request-need";
import { buildRequestDetailContent } from "@/lib/request-detail-content";
import { initials } from "@/lib/utils";
import { AppArea } from "@/types/app-area";

function ContextCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[10px] border border-[#e4e7ea] bg-white px-6 py-5">
      <h2 className="text-base font-semibold text-[#1a1a1a]">{title}</h2>
      <div className="mt-3 text-sm text-[#666b75]">{children}</div>
    </section>
  );
}

function MeetingDetailContent() {
  const t = useTranslations("meetingPages.call");
  const tContext = useTranslations("meetingPages.context");
  const tNeed = useTranslations("mentorRequest");
  const locale = useLocale();
  const texts = { t: tContext, locale };
  const session = useAppSession();
  const isMentor = session?.role === UserRole.Mentor;
  const { error, isLoading, meeting } = useMeetingLifecycle();
  const meetingsQuery = useMeetings();
  const requestQuery = useMentorshipRequest(
    meeting?.mentorshipRequestId ?? null,
  );
  const request = requestQuery.data ?? null;
  const calendarMode = isCalendarOriginRequest(request);
  const requestDetail =
    request && !calendarMode
      ? buildRequestDetailContent(request, {
          labels: needLabels(tNeed),
          locale,
        })
      : null;
  const roomQuery = useQuery({
    queryKey: ["meeting-room", meeting?.id],
    queryFn: () => getMeetingRoom(meeting!.id),
    enabled: Boolean(meeting?.id) && calendarMode,
  });
  const mentorProgramsQuery = useQuery({
    queryKey: PROGRAMS_QUERY_KEY,
    queryFn: getPrograms,
    enabled: isMentor && Boolean(meeting) && calendarMode,
  });
  const orgProgramsQuery = useQuery({
    queryKey: ORGANIZATION_PROGRAMS_QUERY_KEY,
    queryFn: getOrganizationPrograms,
    enabled: !isMentor && Boolean(meeting) && calendarMode,
  });

  if (!meeting) {
    return (
      <AppShell
        active={AppArea.Mentorships}
        mentorHome={isMentor}
        title={t("title")}
        backHref={MENTORSHIPS_ACTIVE_HREF}
      >
        <MeetingUnavailable error={error} isLoading={isLoading} />
      </AppShell>
    );
  }

  const counterpart = meetingCounterpartName(meeting, request, isMentor, texts);
  const schedule = meetingScheduleLabel(meeting, texts);
  const relatedPrograms = isMentor
    ? programsForOrganization(
        mentorProgramsQuery.data,
        meeting.organizationId,
      ).map((program) => ({ id: program.id, name: program.name }))
    : (orgProgramsQuery.data?.programs ?? []).map((program) => ({
        id: program.id,
        name: program.name,
      }));
  const firstMeeting = isFirstMeetingWithMentor(
    meetingsQuery.data ?? [],
    meeting,
  );
  const mentorLabel =
    meeting.mentorName || request?.mentorName || tContext("mentor");
  const ownerLabel = request?.requestedForName || request?.requesterName || "";
  const startupLabel =
    meeting.organizationName || request?.organizationName || "—";
  const organizationId = meeting.organizationId || request?.organizationId;
  const linkedStartupName =
    isMentor && organizationId ? (
      <StartupNameLink organizationId={organizationId}>
        {startupLabel}
      </StartupNameLink>
    ) : (
      startupLabel
    );
  const startupTitle =
    isMentor && organizationId ? (
      <StartupNameLink organizationId={organizationId}>
        {counterpart}
      </StartupNameLink>
    ) : (
      counterpart
    );
  const invitees = meetingInviteeLabels(roomQuery.data ?? [meeting], texts);
  const supportArea = request?.supportArea.trim();
  const calendarTopic =
    meeting.agenda?.trim() ||
    (supportArea && supportArea !== CALENDAR_SUPPORT_AREA
      ? supportArea
      : tContext("calendarTopic"));
  const requestTopic =
    requestDetail?.topic ||
    request?.supportArea ||
    meeting.agenda ||
    t("topicFallback");

  return (
    <AppShell
      active={AppArea.Mentorships}
      mentorHome={isMentor}
      title={t("title")}
      backHref={MENTORSHIPS_ACTIVE_HREF}
    >
      <MentorAccent enabled={isMentor}>
        <div className="mx-auto w-full max-w-[1116px] px-4 pb-14 pt-6 sm:px-8">
          <MentorshipsBackLink href={MENTORSHIPS_ACTIVE_HREF} />
          <nav className="mt-4 flex items-center gap-1.5 text-[13px]">
            <Link
              href={MENTORSHIPS_ACTIVE_HREF}
              className="text-[#858c96] hover:text-[#22262b]"
            >
              {t("breadcrumb")}
            </Link>
            <span className="text-[#858c96]">›</span>
            <span className="font-medium text-[#22262b]">{startupTitle}</span>
          </nav>

          <section className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-1 gap-[22px]">
              <Avatar
                initials={initials(counterpart)}
                size="lg"
                tone={isMentor ? "blue" : "orange"}
              />
              <div className="min-w-0">
                <h1 className="text-[28px] font-medium leading-tight text-[#22262b]">
                  {t.rich("heading", { name: () => startupTitle })}
                </h1>
                <p className="mt-1.5 text-[15px] font-medium text-[#676e78]">
                  {calendarMode ? calendarTopic : requestTopic}
                </p>
                {schedule ? (
                  <p className="mt-1 text-[13px] text-[#858c96]">{schedule}</p>
                ) : null}
              </div>
            </div>
            <div className="w-full max-w-[325px] shrink-0 sm:pt-10">
              <p className="text-[11px] text-[#858c96]">{t("meetLink")}</p>
              <MeetLinkDisplay meetLink={meeting.meetLink} className="mt-1" />
            </div>
          </section>

          {!calendarMode && request ? (
            <div className="mt-6 grid gap-[18px] lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
              <div className="space-y-[18px]">
                <ContextCard title={t("requestSummary")}>
                  <RequestDetailsPanel
                    request={request}
                    showSentAt={false}
                    showPreferredSlots={false}
                  />
                </ContextCard>
              </div>
              <div className="space-y-[18px]">
                <ContextCard title={t("requestInfo")}>
                  <dl className="space-y-3 text-[13px]">
                    <div>
                      <dt className="text-[#858c96]">{t("requester")}</dt>
                      <dd className="mt-0.5 font-medium text-[#22262b]">
                        {ownerLabel || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#858c96]">{t("startup")}</dt>
                      <dd className="mt-0.5 font-medium text-[#22262b]">
                        {linkedStartupName}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#858c96]">{t("mentor")}</dt>
                      <dd className="mt-0.5 font-medium text-[#22262b]">
                        {mentorLabel}
                      </dd>
                    </div>
                  </dl>
                </ContextCard>
                <ContextCard title={t("previous")}>
                  <p>
                    {firstMeeting
                      ? t("firstMeeting", { name: mentorLabel })
                      : t("metBefore", { name: mentorLabel })}
                  </p>
                </ContextCard>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-[18px] lg:grid-cols-2">
              <ContextCard title={t("meetLink")}>
                <MeetLinkDisplay meetLink={meeting.meetLink} />
              </ContextCard>
              <ContextCard title={t("meetingTime")}>
                <dl className="space-y-3 text-[13px]">
                  <div>
                    <dt className="text-[#858c96]">{t("time")}</dt>
                    <dd className="mt-0.5 font-medium text-[#22262b]">
                      {schedule || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#858c96]">{t("duration")}</dt>
                    <dd className="mt-0.5 font-medium text-[#22262b]">
                      {t("minutes", { count: meeting.durationMinutes })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#858c96]">{t("topic")}</dt>
                    <dd className="mt-0.5 font-medium text-[#22262b]">
                      {calendarTopic}
                    </dd>
                  </div>
                </dl>
              </ContextCard>
              <ContextCard title={t("who")}>
                {invitees.length === 0 ? (
                  <ul className="space-y-2 text-[13px] text-[#22262b]">
                    <li>
                      <span className="text-[#858c96]">{t("mentorLabel")}</span>
                      {mentorLabel}
                    </li>
                    <li>
                      <span className="text-[#858c96]">
                        {t("startupLabel")}
                      </span>
                      {linkedStartupName}
                    </li>
                    {ownerLabel ? (
                      <li>
                        <span className="text-[#858c96]">
                          {t("personLabel")}
                        </span>
                        {ownerLabel}
                      </li>
                    ) : null}
                  </ul>
                ) : (
                  <ul className="space-y-2.5">
                    {invitees.map((label) => (
                      <li
                        key={label}
                        className="flex items-center gap-3 text-[13px] text-[#22262b]"
                      >
                        <Avatar
                          initials={initials(label.split(" · ")[0] ?? label)}
                          size="sm"
                          tone={isMentor ? "blue" : "orange"}
                        />
                        <span>{label}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </ContextCard>
              <ContextCard title={t("agenda")}>
                <p className="whitespace-pre-wrap leading-6">
                  {meeting.agenda?.trim() ||
                    request?.summary?.trim() ||
                    t("noAgenda")}
                </p>
              </ContextCard>
              <ContextCard title={t("startup")}>
                <dl className="space-y-3 text-[13px]">
                  <div>
                    <dt className="text-[#858c96]">{t("name")}</dt>
                    <dd className="mt-0.5 font-medium text-[#22262b]">
                      {linkedStartupName}
                    </dd>
                  </div>
                  {ownerLabel ? (
                    <div>
                      <dt className="text-[#858c96]">{t("contact")}</dt>
                      <dd className="mt-0.5 font-medium text-[#22262b]">
                        {ownerLabel}
                      </dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="text-[#858c96]">{t("mentor")}</dt>
                    <dd className="mt-0.5 font-medium text-[#22262b]">
                      {mentorLabel}
                    </dd>
                  </div>
                </dl>
              </ContextCard>
              <ContextCard title={t("programs")}>
                {relatedPrograms.length === 0 ? (
                  <p>{t("noPrograms")}</p>
                ) : (
                  <ul className="list-disc space-y-1 pl-5 text-[#22262b]">
                    {relatedPrograms.map((program) => (
                      <li key={program.id}>{program.name}</li>
                    ))}
                  </ul>
                )}
              </ContextCard>
            </div>
          )}

          <div className="mt-6">
            <DocumentRequestChecklist
              scope={{
                meetingId: meeting.id,
                mentorshipRequestId: meeting.mentorshipRequestId ?? undefined,
              }}
              canManage={isMentor}
              canUpload={!isMentor}
            />
          </div>
        </div>
      </MentorAccent>
    </AppShell>
  );
}

export default function MeetingDetailPage() {
  const t = useTranslations("meetingPages.call");
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-[#f7f7f8] text-sm text-[#676e78]">
          {t("loading")}
        </div>
      }
    >
      <MeetingDetailContent />
    </Suspense>
  );
}
