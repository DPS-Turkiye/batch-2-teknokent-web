"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

import { Avatar } from "@/components/common/avatar";
import { AppShell } from "@/components/hoc/app-shell";
import { MeetingUnavailable } from "@/components/meetings/meeting-unavailable";
import { MentorAccent } from "@/components/mentorships/mentor-accent";
import { MentorshipsBackLink } from "@/components/mentorships/mentorships-back-link";
import { DocumentRequestChecklist } from "@/components/mentorships/document-request-checklist";
import { RequestDetailsPanel } from "@/components/mentorships/request-details-panel";
import { StartupNameLink } from "@/components/common/startup-name-link";
import { ReportBlock } from "@/components/notes/meeting-assistant-share-panel";
import { useAppSession } from "@/components/providers/session-provider";
import { useMeetingLifecycle } from "@/hooks/use-meeting-lifecycle";
import { useAssistantShare } from "@/hooks/use-meeting-notes";
import { useMentorshipRequest } from "@/hooks/use-mentorship-requests";
import { MeetingStatus } from "@/interfaces/meeting";
import { UserRole } from "@/interfaces/session";
import { getMeetingRoom } from "@/lib/client/meetings";
import {
  isCalendarOriginRequest,
  meetingCounterpartName,
  meetingInviteeLabels,
  meetingScheduleLabel,
} from "@/lib/meeting-context";
import { needLabels } from "@/lib/mentor-request-need";
import { buildRequestDetailContent } from "@/lib/request-detail-content";
import { MENTORSHIPS_HISTORY_HREF } from "@/lib/const";
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

function MeetingAboutContent() {
  const t = useTranslations("meetingPages.about");
  const tContext = useTranslations("meetingPages.context");
  const tCall = useTranslations("meetingPages.call");
  const tStatus = useTranslations("meetingPages.status");
  const tNeed = useTranslations("mentorRequest");
  const locale = useLocale();
  const texts = { t: tContext, locale };
  const session = useAppSession();
  const isMentor = session?.role === UserRole.Mentor;
  const { error, isLoading, meeting } = useMeetingLifecycle();
  const requestQuery = useMentorshipRequest(
    meeting?.mentorshipRequestId ?? null,
  );
  const roomQuery = useQuery({
    queryKey: ["meeting-room", meeting?.id],
    queryFn: () => getMeetingRoom(meeting!.id),
    enabled: Boolean(meeting?.id),
  });
  const shareQuery = useAssistantShare(meeting?.id ?? "");
  const request = requestQuery.data ?? null;
  const calendarMode = isCalendarOriginRequest(request);
  const requestDetail =
    request && !calendarMode
      ? buildRequestDetailContent(request, {
          labels: needLabels(tNeed),
          locale,
        })
      : null;

  if (!meeting) {
    return (
      <AppShell
        active={AppArea.Mentorships}
        mentorHome={isMentor}
        title={t("title")}
        backHref={MENTORSHIPS_HISTORY_HREF}
      >
        <MeetingUnavailable error={error} isLoading={isLoading} />
      </AppShell>
    );
  }

  const counterpart = meetingCounterpartName(
    meeting,
    request,
    Boolean(isMentor),
    texts,
  );
  const organizationId = meeting.organizationId || request?.organizationId;
  const startupTitle =
    isMentor && organizationId ? (
      <StartupNameLink organizationId={organizationId}>
        {counterpart}
      </StartupNameLink>
    ) : (
      counterpart
    );
  const schedule = meetingScheduleLabel(meeting, texts);
  const invitees = meetingInviteeLabels(roomQuery.data ?? [meeting], texts);
  const report = shareQuery.data?.report ?? null;
  const hasNotes = Boolean(meeting.notes?.trim() || meeting.outcomes?.trim());
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
      backHref={MENTORSHIPS_HISTORY_HREF}
    >
      <MentorAccent enabled={Boolean(isMentor)}>
        <div className="mx-auto w-full max-w-[1116px] px-4 pb-14 pt-6 sm:px-8">
          <MentorshipsBackLink href={MENTORSHIPS_HISTORY_HREF} />
          <nav className="mt-4 flex items-center gap-1.5 text-[13px]">
            <Link
              href={MENTORSHIPS_HISTORY_HREF}
              className="text-[#858c96] hover:text-[#22262b]"
            >
              {t("breadcrumb")}
            </Link>
            <span className="text-[#858c96]">›</span>
            <span className="font-medium text-[#22262b]">{startupTitle}</span>
          </nav>

          <section className="mt-5 flex gap-[22px]">
            <Avatar
              initials={initials(counterpart)}
              size="lg"
              tone={isMentor ? "blue" : "orange"}
            />
            <div className="min-w-0">
              <h1 className="text-[28px] font-medium leading-tight text-[#22262b]">
                {tCall.rich("heading", { name: () => startupTitle })}
              </h1>
              <p className="mt-1.5 text-[15px] font-medium text-[#676e78]">
                {requestTopic}
              </p>
              {schedule ? (
                <p className="mt-1 text-[13px] text-[#858c96]">{schedule}</p>
              ) : null}
              <p className="mt-1 text-[13px] text-[#858c96]">
                {t("meta", {
                  minutes: meeting.durationMinutes,
                  status: Object.values(MeetingStatus).includes(
                    meeting.status as MeetingStatus,
                  )
                    ? tStatus(meeting.status as MeetingStatus)
                    : String(meeting.status),
                })}
              </p>
            </div>
          </section>

          <div className="mt-6 grid gap-[18px] lg:grid-cols-2">
            <ContextCard title={t("invitees")}>
              {roomQuery.isLoading ? (
                <p>{t("loading")}</p>
              ) : invitees.length === 0 ? (
                <p>{t("noInvitees")}</p>
              ) : (
                <ul className="space-y-2 text-[#22262b]">
                  {invitees.map((label) => (
                    <li key={label}>{label}</li>
                  ))}
                </ul>
              )}
            </ContextCard>

            {request && !calendarMode ? (
              <ContextCard title={tCall("requestSummary")}>
                <RequestDetailsPanel
                  request={request}
                  showSentAt={false}
                  showPreferredSlots={false}
                />
              </ContextCard>
            ) : (
              <ContextCard title={tCall("requestInfo")}>
                <p>{t("noRequest")}</p>
              </ContextCard>
            )}

            {hasNotes ? (
              <ContextCard title={t("savedNotes")}>
                {meeting.notes?.trim() ? (
                  <div className="mb-3">
                    <p className="text-[11px] font-medium text-[#858c96]">
                      {t("notes")}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-[#22262b]">
                      {meeting.notes}
                    </p>
                  </div>
                ) : null}
                {meeting.outcomes?.trim() ? (
                  <div>
                    <p className="text-[11px] font-medium text-[#858c96]">
                      {t("outcomes")}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-[#22262b]">
                      {meeting.outcomes}
                    </p>
                  </div>
                ) : null}
              </ContextCard>
            ) : null}
          </div>

          <div className="mt-[18px]">
            <DocumentRequestChecklist
              scope={{
                meetingId: meeting.id,
                mentorshipRequestId: meeting.mentorshipRequestId ?? undefined,
              }}
              canManage={session?.role === UserRole.Mentor}
              canUpload={session?.role !== UserRole.Mentor}
            />
          </div>

          <div className="mt-[18px]">
            {shareQuery.isLoading ? (
              <ContextCard title={t("report")}>
                <p>{t("loading")}</p>
              </ContextCard>
            ) : shareQuery.isError ? (
              <ContextCard title={t("report")}>
                <p className="text-[#9b2c2c]">{t("reportFailed")}</p>
              </ContextCard>
            ) : report ? (
              <ReportBlock report={report} />
            ) : (
              <ContextCard title={t("report")}>
                <p>{t("noReport")}</p>
              </ContextCard>
            )}
          </div>
        </div>
      </MentorAccent>
    </AppShell>
  );
}

export default function MeetingAboutPage() {
  const t = useTranslations("meetingPages.about");
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-[#f7f7f8] text-sm text-[#676e78]">
          {t("pageLoading")}
        </div>
      }
    >
      <MeetingAboutContent />
    </Suspense>
  );
}
