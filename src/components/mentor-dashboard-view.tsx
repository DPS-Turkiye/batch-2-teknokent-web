"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { AppShell } from "@/components/hoc/app-shell";
import { MentorDecisionModal } from "@/components/mentor-dashboard/decision-modal";
import { useMentorDashboard } from "@/hooks/use-mentor-dashboard";
import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import { formatMeetingShort } from "@/lib/format";
import { initials } from "@/lib/utils";
import { AppArea } from "@/types/app-area";

function StateCard({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-[20px] border border-[var(--metual-line)] p-5 text-sm text-[var(--metual-muted)]">
      {children}
    </p>
  );
}
function MentorshipCard({
  request,
  onReview,
}: {
  request: MentorshipRequest;
  onReview?: () => void;
}) {
  const name = request.requesterName || request.organizationName || "Girişimci";
  const content = (
    <>
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#fbe2d0] text-[12.5px] font-medium text-[#a8480e]">
          {initials(name)}
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium">{name}</h3>
          <p className="mt-0.5 truncate text-xs text-[#7a828d]">
            {request.supportArea}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1 border-t border-[#eef0f3] pt-3 text-[12.5px] font-semibold text-[#565e68]">
        Mentorluğa git{" "}
        <Image
          src="/mentor-dashboard/chevron.svg"
          alt=""
          width={16}
          height={16}
        />
      </div>
    </>
  );
  const style =
    "block w-full rounded-[20px] border border-[#dde1e6] bg-white p-4 text-left transition hover:border-[var(--metual-orange)]";
  return onReview ? (
    <button type="button" className={style} onClick={onReview}>
      {content}
    </button>
  ) : (
    <Link
      className={style}
      href={`/mentor-dashboard/mentorship/${encodeURIComponent(request.id)}`}
    >
      {content}
    </Link>
  );
}
export function MentorDashboardView() {
  const {
    firstName,
    pending,
    accepted,
    upcomingMeetings,
    weekMeetingCount,
    requestsQuery,
    meetingsQuery,
    decision,
  } = useMentorDashboard();
  const requestState = requestsQuery.isLoading
    ? "Talepler yükleniyor..."
    : requestsQuery.error
      ? "Mentorluk talepleri yüklenemedi. Lütfen yeniden deneyin."
      : null;
  const metric = (value: number, loading: boolean, failed: boolean) =>
    loading ? "…" : failed ? "—" : value;
  return (
    <AppShell active={AppArea.MentorDashboard} mentorHome>
      <div className="mx-auto w-full max-w-[1292px] px-4 pb-16 pt-8 sm:px-8 sm:pt-10">
        <header>
          <h1 className="text-[28px] font-semibold leading-tight">
            Merhaba {firstName},
          </h1>
          <p className="mt-2 text-sm text-[var(--metual-muted)]">
            Bugün mentorluk süreçlerinde senden beklenenleri tek yerde
            toparladık.
          </p>
        </header>
        <dl className="mt-6 grid gap-5 sm:grid-cols-3">
          {[
            [
              "Yeni mentorluk talebi",
              metric(
                pending.length,
                requestsQuery.isLoading,
                !!requestsQuery.error,
              ),
            ],
            [
              "Aktif mentorluk",
              metric(
                accepted.length,
                requestsQuery.isLoading,
                !!requestsQuery.error,
              ),
            ],
            [
              "Bu hafta görüşme",
              metric(
                weekMeetingCount,
                meetingsQuery.isLoading,
                !!meetingsQuery.error,
              ),
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex flex-col-reverse gap-2 rounded-[10px] border border-[var(--metual-line)] px-5 py-4"
            >
              <dt className="text-[13px] text-[var(--metual-muted)]">
                {label}
              </dt>
              <dd className="text-[28px] font-semibold leading-tight">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-[26px] grid items-start gap-8 lg:grid-cols-[minmax(0,745fr)_minmax(0,401fr)] lg:gap-[6.6%]">
          <div className="min-w-0 space-y-6">
            <section aria-labelledby="attention-heading">
              <h2 id="attention-heading" className="mb-3 text-lg font-semibold">
                Dikkat isteyenler
              </h2>
              {requestState ? (
                <StateCard>{requestState}</StateCard>
              ) : pending.length === 0 ? (
                <StateCard>Bekleyen talep bulunmuyor.</StateCard>
              ) : (
                <div className="space-y-3">
                  {pending.map((request) => (
                    <article
                      key={request.id}
                      className="flex flex-col gap-5 rounded-[20px] border border-[var(--metual-line)] px-5 py-6 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <h3 className="break-words text-lg font-semibold">
                          {[request.organizationName, request.requesterName]
                            .filter(Boolean)
                            .join(" · ") || "Mentorluk talebi"}
                        </h3>
                        {request.recommendationSnapshot?.startupStage ? (
                          <p className="mt-3 text-xs text-[var(--metual-muted)]">
                            {request.recommendationSnapshot.startupStage}
                          </p>
                        ) : null}
                        <p className="mt-3 inline-block rounded-full bg-[#fff7f2] px-[11px] py-1.5 text-xs font-medium text-[var(--metual-orange)]">
                          {request.supportArea}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => decision.selectRequest(request)}
                        className="min-h-[38px] shrink-0 rounded-lg bg-[var(--metual-orange)] px-7 py-2 text-[13px] font-medium text-white hover:bg-[var(--metual-orange-dark)]"
                      >
                        Talebi incele
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>
            <section aria-labelledby="meetings-heading">
              <h2 id="meetings-heading" className="mb-3 text-lg font-semibold">
                Yaklaşan görüşmeler
              </h2>
              {meetingsQuery.isLoading ? (
                <StateCard>Görüşmeler yükleniyor...</StateCard>
              ) : meetingsQuery.error ? (
                <StateCard>
                  Görüşmeler yüklenemedi. Lütfen yeniden deneyin.
                </StateCard>
              ) : upcomingMeetings.length === 0 ? (
                <StateCard>Yaklaşan görüşme bulunmuyor.</StateCard>
              ) : (
                <div className="space-y-5">
                  {upcomingMeetings.map((meeting) => (
                    <article
                      key={meeting.id}
                      className="rounded-[20px] border border-[var(--metual-line)] px-5 py-[18px]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="break-words text-[15px] font-semibold">
                            {meeting.organizationName || "Mentorluk görüşmesi"}
                          </h3>
                          <p className="mt-2 text-[13px] text-[var(--metual-muted)]">
                            {meeting.agenda || "Görüşme konusu belirtilmedi."}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-[#f6f7f9] px-[11px] py-1.5 text-xs text-[var(--metual-muted)]">
                          Planlandı
                        </span>
                      </div>
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-[13px] font-medium">
                        <time dateTime={meeting.scheduledAt}>
                          {formatMeetingShort(meeting.scheduledAt)} ·{" "}
                          {meeting.durationMinutes} dk
                        </time>
                        {meeting.meetLink ? (
                          <a
                            href={meeting.meetLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[var(--metual-orange)] hover:underline"
                          >
                            Katıl →
                          </a>
                        ) : (
                          <Link
                            href="/mentor-dashboard/calendar"
                            className="text-[var(--metual-orange)] hover:underline"
                          >
                            Takvimi aç →
                          </Link>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
          <aside className="min-w-0 space-y-6">
            <section id="requests" aria-labelledby="requests-heading">
              <h2
                id="requests-heading"
                className="mb-3 text-[15px] font-semibold tracking-[-0.15px]"
              >
                Mentorluk Talepleri
              </h2>
              {requestState ? (
                <StateCard>{requestState}</StateCard>
              ) : pending.length === 0 ? (
                <StateCard>Yeni mentorluk talebiniz yok.</StateCard>
              ) : (
                <div className="space-y-3">
                  {pending.map((request) => (
                    <MentorshipCard
                      key={request.id}
                      request={request}
                      onReview={() => decision.selectRequest(request)}
                    />
                  ))}
                </div>
              )}
            </section>
            <section id="mentorships" aria-labelledby="active-heading">
              <h2
                id="active-heading"
                className="mb-3 text-[15px] font-semibold tracking-[-0.15px]"
              >
                Aktif Mentorluklar
              </h2>
              {requestState ? (
                <StateCard>{requestState}</StateCard>
              ) : accepted.length === 0 ? (
                <StateCard>
                  Henüz kabul edilmiş bir mentorluk talebiniz yok.
                </StateCard>
              ) : (
                <div className="space-y-3">
                  {accepted.map((request) => (
                    <MentorshipCard key={request.id} request={request} />
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
        {decision.selectedRequest ? (
          <MentorDecisionModal
            request={decision.selectedRequest}
            mode={decision.decisionMode}
            message={decision.decisionMessage}
            selectedSlots={decision.selectedSlots}
            isLoadingSlots={decision.isLoadingSlots}
            showAvailability={decision.showAvailabilityStep}
            isPending={decision.isPending}
            error={decision.actionError}
            onModeChange={decision.setDecisionMode}
            onMessageChange={decision.setDecisionMessage}
            onClose={decision.closeDecision}
            onSubmit={() => void decision.submitDecision()}
          />
        ) : null}
      </div>
    </AppShell>
  );
}
