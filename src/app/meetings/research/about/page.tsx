"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";

import { Avatar } from "@/components/common/avatar";
import { AppShell } from "@/components/hoc/app-shell";
import { MeetingUnavailable } from "@/components/meetings/meeting-unavailable";
import { ReportBlock } from "@/components/notes/meeting-assistant-share-panel";
import { useAppSession } from "@/components/providers/session-provider";
import { useMeetingLifecycle } from "@/hooks/use-meeting-lifecycle";
import { useAssistantShare } from "@/hooks/use-meeting-notes";
import { useMentorshipRequest } from "@/hooks/use-mentorship-requests";
import { UserRole } from "@/interfaces/session";
import { getMeetingRoom } from "@/lib/client/meetings";
import {
  isProfileOriginRequest,
  meetingCounterpartName,
  meetingInviteeLabels,
  meetingScheduleLabel,
  requestAgendaLines,
  requestExpectedOutcome,
} from "@/lib/meeting-context";
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
  const profileMode = isProfileOriginRequest(request);

  if (!meeting) {
    return (
      <AppShell
        active={AppArea.Mentorships}
        mentorHome={isMentor}
        title="Görüşme bilgisi"
        backHref="/mentorships?tab=history"
      >
        <MeetingUnavailable error={error} isLoading={isLoading} />
      </AppShell>
    );
  }

  const counterpart = meetingCounterpartName(
    meeting,
    request,
    Boolean(isMentor),
  );
  const schedule = meetingScheduleLabel(meeting);
  const invitees = meetingInviteeLabels(roomQuery.data ?? [meeting]);
  const agendaLines = profileMode ? requestAgendaLines(request, meeting) : [];
  const expectedOutcome = requestExpectedOutcome(request);
  const report = shareQuery.data?.report ?? null;
  const hasNotes = Boolean(meeting.notes?.trim() || meeting.outcomes?.trim());

  return (
    <AppShell
      active={AppArea.Mentorships}
      mentorHome={isMentor}
      title="Görüşme bilgisi"
      backHref="/mentorships?tab=history"
    >
      <div className="mx-auto w-full max-w-[1116px] px-4 pb-14 pt-6 sm:px-8">
        <nav className="flex items-center gap-1.5 text-[13px]">
          <Link
            href="/mentorships?tab=history"
            className="text-[#858c96] hover:text-[#22262b]"
          >
            Geçmiş
          </Link>
          <span className="text-[#858c96]">›</span>
          <span className="font-medium text-[#22262b]">{counterpart}</span>
        </nav>

        <section className="mt-5 flex gap-[22px]">
          <Avatar initials={initials(counterpart)} size="lg" tone="orange" />
          <div className="min-w-0">
            <h1 className="text-[28px] font-medium leading-tight text-[#22262b]">
              {counterpart} ile Mentorluk Görüşmesi
            </h1>
            <p className="mt-1.5 text-[15px] font-medium text-[#676e78]">
              {request?.supportArea ?? meeting.agenda ?? "Mentorluk görüşmesi"}
            </p>
            {schedule ? (
              <p className="mt-1 text-[13px] text-[#858c96]">{schedule}</p>
            ) : null}
            <p className="mt-1 text-[13px] text-[#858c96]">
              {meeting.durationMinutes} dk · {String(meeting.status)}
            </p>
          </div>
        </section>

        <div className="mt-6 grid gap-[18px] lg:grid-cols-2">
          <ContextCard title="Davetliler">
            {roomQuery.isLoading ? (
              <p>Yükleniyor...</p>
            ) : invitees.length === 0 ? (
              <p>Davetli bilgisi bulunamadı.</p>
            ) : (
              <ul className="space-y-2 text-[#22262b]">
                {invitees.map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
            )}
          </ContextCard>

          {profileMode ? (
            <ContextCard title="Talep bilgileri">
              <dl className="space-y-3 text-[13px]">
                <div>
                  <dt className="text-[#858c96]">Konu</dt>
                  <dd className="mt-0.5 font-medium text-[#22262b]">
                    {request?.supportArea ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#858c96]">Özet</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-[#22262b]">
                    {agendaLines.length > 0 ? agendaLines.join("\n") : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#858c96]">Beklenen çıktı</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-[#22262b]">
                    {expectedOutcome || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#858c96]">Talep eden</dt>
                  <dd className="mt-0.5 font-medium text-[#22262b]">
                    {request?.requestedForName || request?.requesterName || "—"}
                  </dd>
                </div>
              </dl>
            </ContextCard>
          ) : (
            <ContextCard title="Talep bilgileri">
              <p>Bu toplantı için talep özeti bulunmuyor.</p>
            </ContextCard>
          )}

          {hasNotes ? (
            <ContextCard title="Kayıtlı notlar">
              {meeting.notes?.trim() ? (
                <div className="mb-3">
                  <p className="text-[11px] font-medium text-[#858c96]">
                    Notlar
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-[#22262b]">
                    {meeting.notes}
                  </p>
                </div>
              ) : null}
              {meeting.outcomes?.trim() ? (
                <div>
                  <p className="text-[11px] font-medium text-[#858c96]">
                    Sonuçlar
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
          {shareQuery.isLoading ? (
            <ContextCard title="Toplantı raporu">
              <p>Yükleniyor...</p>
            </ContextCard>
          ) : shareQuery.isError ? (
            <ContextCard title="Toplantı raporu">
              <p className="text-[#9b2c2c]">Rapor şu an yüklenemedi.</p>
            </ContextCard>
          ) : report ? (
            <ReportBlock report={report} />
          ) : (
            <ContextCard title="Toplantı raporu">
              <p>Bu toplantı için rapor paylaşılmamış.</p>
            </ContextCard>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export default function MeetingAboutPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-[#f7f7f8] text-sm text-[#676e78]">
          Görüşme bilgisi yükleniyor…
        </div>
      }
    >
      <MeetingAboutContent />
    </Suspense>
  );
}
