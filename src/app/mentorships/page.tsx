"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";

import { AppShell } from "@/components/hoc/app-shell";
import { ListPagination } from "@/components/common/list-pagination";
import { MentorsDirectory } from "@/components/mentors/mentors-directory";
import { MeetLinkDisplay } from "@/components/mentorships/meet-link-display";
import { MeetingFeedbackHistoryLink } from "@/components/mentorships/meeting-feedback-history-link";
import { MentorMentorshipsWorkspace } from "@/components/mentorships/mentor-mentorships-workspace";
import { RegularMentorshipsTab } from "@/components/mentorships/regular-mentorships-tab";
import { useAppSession } from "@/components/providers/session-provider";
import {
  useMentorshipRequestsPage,
  useMentorshipWorkspace,
} from "@/hooks/use-mentorship-workspace";
import { formatMeetingShort } from "@/lib/format";
import { MENTORSHIPS_TABS } from "@/lib/const";
import {
  activeMentorshipHref,
  meetingAboutHref,
  meetingCallHref,
  menteeRequestOwnerLabel,
  menteeRequestDetailHref,
  menteeRequestStatusHref,
  pickRequestMeeting,
  requestProgressPercent,
} from "@/lib/mentorship-workspace";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import { AppArea } from "@/types/app-area";
import { MentorshipWorkspaceTab } from "@/types/mentorship";
import type { MeetingItem } from "@/interfaces/meeting";

function tabFromSearchParam(value: string | null): MentorshipWorkspaceTab {
  if (value === MentorshipWorkspaceTab.Requests) {
    return MentorshipWorkspaceTab.Requests;
  }
  if (value === MentorshipWorkspaceTab.History) {
    return MentorshipWorkspaceTab.History;
  }
  if (value === MentorshipWorkspaceTab.MentorPool) {
    return MentorshipWorkspaceTab.MentorPool;
  }
  if (value === MentorshipWorkspaceTab.Regular) {
    return MentorshipWorkspaceTab.Regular;
  }
  return MentorshipWorkspaceTab.Active;
}

export default function MentorshipsPage() {
  const session = useAppSession();
  if (session?.role === UserRole.Mentor) {
    return <MentorMentorshipsWorkspace />;
  }

  return (
    <Suspense
      fallback={
        <AppShell active={AppArea.Mentorships}>
          <div className="mx-auto w-full max-w-[1120px] px-4 pb-14 pt-8 sm:px-8">
            <div className="mt-5 rounded-[20px] border border-[#e4e7ea] bg-white p-10 text-center text-sm text-[#676e78]">
              Yükleniyor...
            </div>
          </div>
        </AppShell>
      }
    >
      <MenteeMentorshipsWorkspace />
    </Suspense>
  );
}

function MenteeMentorshipsWorkspace() {
  const searchParams = useSearchParams();
  const { meetings, meetingsError, meetingsLoading, setTab, tab } =
    useMentorshipWorkspace(tabFromSearchParam(searchParams.get("tab")));

  return (
    <AppShell active={AppArea.Mentorships}>
      <div className="mx-auto w-full max-w-[1120px] px-4 pb-14 pt-8 sm:px-8">
        <section className="rounded-[20px] border border-[#f97316] bg-white p-[18px]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[17px] font-medium text-[#22262b]">
              Yeni bir mentor mu arıyorsun?
            </p>
            <Link
              href="/mentor-request"
              className="inline-flex min-h-[52px] items-center justify-center gap-1.5 rounded-lg bg-[#e86f22] px-4 text-[13px] font-medium text-white hover:bg-[#ce5e19]"
            >
              İhtiyacını Tanımla
              <ArrowRight className="size-6" aria-hidden />
            </Link>
          </div>
        </section>

        <div
          className="mt-[22px] grid grid-cols-5"
          role="tablist"
          aria-label="Mentorluk görünümleri"
        >
          {MENTORSHIPS_TABS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={
                "border-b-[3px] px-3 py-[7px] text-xs font-medium transition " +
                (tab === id
                  ? "border-[#f97316] text-[#e86f22]"
                  : "border-[#e4e7ea] text-[#676e78] hover:text-[#515861]")
              }
            >
              {label}
            </button>
          ))}
        </div>

        {tab === MentorshipWorkspaceTab.MentorPool ? (
          <div className="mt-5">
            <MentorsDirectory embedded />
          </div>
        ) : tab === MentorshipWorkspaceTab.Regular ? (
          <RegularMentorshipsTab role={UserRole.Mentee} />
        ) : meetingsLoading ? (
          <div className="mt-5 rounded-[20px] border border-[#e4e7ea] bg-white p-10 text-center text-sm text-[#676e78]">
            Yükleniyor...
          </div>
        ) : meetingsError ? (
          <div className="mt-5 rounded-[20px] border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            {meetingsError.message}
          </div>
        ) : tab === MentorshipWorkspaceTab.Active ? (
          <ActiveTab meetings={meetings} />
        ) : tab === MentorshipWorkspaceTab.History ? (
          <HistoryTab meetings={meetings} />
        ) : (
          <RequestsTab />
        )}
      </div>
    </AppShell>
  );
}

function RequestsTab() {
  const [page, setPage] = useState(1);
  const { error, isLoading, requests, totalPages } = useMentorshipRequestsPage(
    UserRole.Mentee,
    MentorshipWorkspaceTab.Requests,
    page,
  );

  if (isLoading) {
    return (
      <div className="mt-5 rounded-[20px] border border-[#e4e7ea] bg-white p-10 text-center text-sm text-[#676e78]">
        Yükleniyor...
      </div>
    );
  }
  if (error) {
    return (
      <div className="mt-5 rounded-[20px] border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        {error.message}
      </div>
    );
  }
  if (requests.length === 0) {
    return <EmptyState />;
  }

  return (
    <section className="mt-5">
      <div className="grid gap-4">
        {requests.map((request) => {
          const owner = menteeRequestOwnerLabel(request);
          return (
            <Link
              key={request.id}
              href={menteeRequestDetailHref(request.id)}
              className="rounded-[20px] border border-[#e4e7ea] bg-white p-[18px] transition hover:border-[#f2b78f]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-[17px] font-medium text-[#22262b]">
                    {request.mentorName}
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-[#676e78]">
                    {request.supportArea}
                    {owner ? ` · ${owner}` : ""}
                  </p>
                  {request.status ===
                  MentorshipRequestStatus.CounterProposed ? (
                    <p className="mt-2 text-[13px] font-medium text-[#e86f22]">
                      Mentör saat önerdi — birini seç
                    </p>
                  ) : request.status === MentorshipRequestStatus.Accepted ? (
                    <p className="mt-2 text-[13px] font-medium text-[#676e78]">
                      Onaylandı — görüşme saati kaydı bekleniyor
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 text-[13px] font-medium text-[#e86f22]">
                  Talebi gör →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
      <ListPagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        label="Talepler sayfaları"
      />
    </section>
  );
}

function ActiveTab({ meetings }: { meetings: MeetingItem[] }) {
  const [page, setPage] = useState(1);
  const { error, isLoading, requests, totalPages } = useMentorshipRequestsPage(
    UserRole.Mentee,
    MentorshipWorkspaceTab.Active,
    page,
  );

  if (isLoading) {
    return (
      <div className="mt-5 rounded-[20px] border border-[#e4e7ea] bg-white p-10 text-center text-sm text-[#676e78]">
        Yükleniyor...
      </div>
    );
  }
  if (error) {
    return (
      <div className="mt-5 rounded-[20px] border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        {error.message}
      </div>
    );
  }

  return (
    <section className="mt-5">
      <h2 className="text-lg font-medium text-[#22262b]">Aktif mentorluklar</h2>
      {requests.length === 0 ? (
        <div className="mt-4 rounded-[20px] border border-[#e4e7ea] bg-white px-6 py-[87px] text-center text-[17px] font-medium text-[#22262b]">
          Aktif Mentörlüğünüz Bulunmamaktadır
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-4">
            {requests.map((request) => {
              const meeting = pickRequestMeeting(meetings, request);
              const progress = requestProgressPercent(meetings, request);
              const owner = menteeRequestOwnerLabel(request);
              return (
                <article
                  key={request.id}
                  className="rounded-[20px] border border-[#e4e7ea] bg-white p-[18px]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-[17px] font-medium text-[#22262b]">
                        {request.mentorName}
                      </h3>
                      <p className="mt-0.5 truncate text-xs text-[#676e78]">
                        {request.supportArea}
                        {owner ? ` · ${owner}` : ""}
                      </p>
                    </div>
                    <Link
                      href={activeMentorshipHref(request, meeting, false)}
                      className="shrink-0 text-[13px] font-medium text-[#e86f22]"
                    >
                      Mentorluğa git →
                    </Link>
                  </div>
                  <span className="mt-2.5 inline-flex rounded-[14px] bg-[#fdebdd] px-3 py-[7px] text-xs font-medium text-[#e86f22]">
                    {request.supportArea}
                  </span>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-md bg-[#e4e7ea]">
                    <div
                      className="h-1.5 rounded-md bg-[#e86f22]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-2">
                    <p className="text-[11px] text-[#858c96]">
                      {meeting ? "İlk görüşme" : "Görüşme"}
                    </p>
                    {meeting ? (
                      <Link
                        href={meetingCallHref(meeting.id)}
                        className="mt-0.5 block text-[13px] font-medium text-[#22262b] hover:text-[#e86f22]"
                      >
                        {formatMeetingShort(meeting.scheduledAt)}
                      </Link>
                    ) : (
                      <p className="mt-0.5 text-[13px] font-medium text-[#22262b]">
                        Henüz planlanmadı
                      </p>
                    )}
                  </div>
                  <div className="mt-3">
                    <p className="text-[11px] text-[#858c96]">Meet linki</p>
                    <MeetLinkDisplay
                      meetLink={meeting?.meetLink}
                      className="mt-1"
                    />
                  </div>
                </article>
              );
            })}
          </div>
          <ListPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            label="Aktif mentorluk sayfaları"
          />
        </>
      )}
    </section>
  );
}

function HistoryTab({ meetings }: { meetings: MeetingItem[] }) {
  const [page, setPage] = useState(1);
  const { error, isLoading, requests, totalPages } = useMentorshipRequestsPage(
    UserRole.Mentee,
    MentorshipWorkspaceTab.History,
    page,
  );

  if (isLoading) {
    return (
      <div className="mt-5 rounded-[20px] border border-[#e4e7ea] bg-white p-10 text-center text-sm text-[#676e78]">
        Yükleniyor...
      </div>
    );
  }
  if (error) {
    return (
      <div className="mt-5 rounded-[20px] border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        {error.message}
      </div>
    );
  }

  return (
    <section className="mt-5">
      <h2 className="text-lg font-medium text-[#22262b]">
        Yakın zamanda tamamlanan
      </h2>
      {requests.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="mt-[22px] grid gap-[22px]">
            {requests.map((request) => {
              const owner = menteeRequestOwnerLabel(request);
              const meeting = pickRequestMeeting(meetings, request);
              return (
                <article
                  key={request.id}
                  className="flex flex-col gap-3 rounded-[20px] border border-[#e4e7ea] bg-white px-[18px] py-4 sm:flex-row sm:items-center sm:gap-[18px]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#22262b]">
                      {request.mentorName} · {request.supportArea}
                      {owner ? ` · ${owner}` : ""}
                    </p>
                    {meeting ? (
                      <p className="mt-1 text-xs text-[#858c96]">
                        {formatMeetingShort(meeting.scheduledAt)}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {meeting ? (
                      <>
                        <Link
                          href={meetingAboutHref(meeting.id)}
                          className="inline-flex min-h-[38px] items-center justify-center rounded-lg border border-[#e4e7ea] px-4 text-[13px] font-medium text-[#22262b] hover:border-[#f2b78f]"
                        >
                          Görüşme hakkında bilgi
                        </Link>
                        <MeetingFeedbackHistoryLink meetingId={meeting.id} />
                      </>
                    ) : (
                      <Link
                        href={menteeRequestStatusHref(request.id)}
                        className="inline-flex min-h-[38px] items-center justify-center rounded-lg border border-[#e4e7ea] px-4 text-[13px] font-medium text-[#22262b]"
                      >
                        Talebi aç →
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          <ListPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            label="Geçmiş mentorluk sayfaları"
          />
        </>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="mt-5 rounded-[20px] border border-dashed border-[#d6dade] bg-white p-12 text-center">
      <Sparkles className="mx-auto size-7 text-[#e86f22]" />
      <h2 className="mt-4 text-base font-semibold">
        Henüz bir mentorluk talebiniz yok.
      </h2>
      <p className="mt-1 text-sm text-[#676e78]">
        Bu görünümde gösterilecek bir süreç bulunmuyor.
      </p>
    </div>
  );
}
