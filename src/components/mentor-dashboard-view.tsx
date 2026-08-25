"use client";

import Link from "next/link";
import { useState } from "react";
import { Users } from "lucide-react";

import { Avatar } from "@/components/common/avatar";
import { Badge } from "@/components/common/badge";
import { SecondaryButton } from "@/components/common/secondary-button";
import { AppShell } from "@/components/hoc/app-shell";
import { MentorDecisionModal } from "@/components/mentor-dashboard/decision-modal";
import { MentorRequestCard } from "@/components/mentor-dashboard/request-card";
import { useDemoSession } from "@/components/providers/session-provider";
import { useDashboardNotifications } from "@/hooks/use-dashboard-notifications";
import { useDecision } from "@/hooks/use-decision";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import {
  MentorRequestFilter,
  MentorshipRequestStatus,
} from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import { initials } from "@/lib/utils";
import { AppArea } from "@/types/app-area";

const filterStatuses: Record<
  Exclude<MentorRequestFilter, MentorRequestFilter.All>,
  MentorshipRequestStatus
> = {
  [MentorRequestFilter.Accepted]: MentorshipRequestStatus.Accepted,
  [MentorRequestFilter.Declined]: MentorshipRequestStatus.Declined,
  [MentorRequestFilter.MoreInfoRequested]:
    MentorshipRequestStatus.MoreInfoRequested,
  [MentorRequestFilter.Pending]: MentorshipRequestStatus.Pending,
};

const filterOptions = [
  [MentorRequestFilter.All, "Tüm Talepler"],
  [MentorRequestFilter.Pending, "Bekleyenler"],
  [MentorRequestFilter.MoreInfoRequested, "Ek Bilgi İstenenler"],
  [MentorRequestFilter.Accepted, "Kabul Edilenler"],
  [MentorRequestFilter.Declined, "Uygun Değil"],
] as const;

export function MentorDashboardView() {
  const session = useDemoSession();
  const { notifications } = useDashboardNotifications();
  const requestsQuery = useMentorshipRequests(UserRole.Mentor);
  const requests = requestsQuery.data ?? [];
  const [filter, setFilter] = useState<MentorRequestFilter>(
    MentorRequestFilter.All,
  );
  const decision = useDecision();

  const pendingCount = requests.filter(
    (request) => request.status === MentorshipRequestStatus.Pending,
  ).length;
  const accepted = requests.filter(
    (request) => request.status === MentorshipRequestStatus.Accepted,
  );

  const filteredRequests = requests.filter((request) => {
    if (filter === MentorRequestFilter.All) return true;
    return request.status === filterStatuses[filter];
  });

  return (
    <AppShell active={AppArea.MentorDashboard}>
      <div className="mx-auto w-full max-w-[1208px] space-y-6 px-4 pb-12 pt-8 sm:px-8 sm:pt-10">
        <section className="rounded-[24px] bg-[#27272a] p-6 text-white sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-block rounded-md bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-white/90">
                Mentor Paneli — DPS Mentor Experience
              </span>
              <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                Hoş geldin, {session?.fullName ?? "Mentor"}
              </h1>
              <p className="mt-1 text-sm text-zinc-300">
                Girişimcilerden gelen destek taleplerini inceleyin, ek bilgi
                isteyin veya takviminize uygun saatleri sunun.
              </p>
            </div>
            <div className="shrink-0 rounded-xl bg-white/5 p-4 text-center sm:text-right">
              <p className="text-xs text-zinc-400">Bekleyen Talepler</p>
              <p className="text-3xl font-black text-amber-400">
                {pendingCount}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                {pendingCount > 0
                  ? `${pendingCount} talep yanıtınızı bekliyor.`
                  : "Bekleyen talep bulunmuyor."}
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#99a1af]">
              Aktif Mentorluklar
            </h2>
          </div>

          {requestsQuery.isLoading ? (
            <div className="rounded-lg border border-[#e5e7eb] bg-white p-8 text-center text-sm text-[#6a7282]">
              Yükleniyor...
            </div>
          ) : accepted.length === 0 ? (
            <div className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white p-6 text-sm text-[#6a7282]">
              <Users
                className="size-4 shrink-0"
                strokeWidth={1.75}
                aria-hidden
              />
              Henüz kabul edilmiş bir mentorluk talebiniz yok.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {accepted.map((request) => (
                <Link
                  key={request.id}
                  href={`/mentor-dashboard/mentorship/${encodeURIComponent(request.id)}`}
                  className="flex items-start gap-4 rounded-lg border border-[#e5e7eb] bg-white p-4 transition hover:border-[#c7c7cc]"
                >
                  <Avatar
                    initials={
                      initials(
                        request.organizationName ?? request.requesterName ?? "",
                      ) || "MN"
                    }
                  />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-[#171717]">
                      {request.organizationName ?? request.requesterName}
                    </h3>
                    <p className="mt-0.5 text-xs text-[#6a7282]">
                      {request.supportArea}
                    </p>
                    <div className="mt-2">
                      <Badge tone="green">Kabul Edildi</Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section id="notifications">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#99a1af]">
            Bildirimler
          </h2>
          {notifications.length === 0 ? (
            <div className="rounded-lg border border-[#e5e7eb] bg-white p-6 text-center text-sm text-[#6a7282]">
              Henüz bir bildiriminiz yok.
            </div>
          ) : (
            <div className="rounded-lg border border-[#e5e7eb] bg-white px-3">
              {notifications.map((notification) => (
                <div
                  key={notification.title}
                  className="flex gap-2 border-b border-[#e5e7eb] py-3 last:border-0"
                >
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#999]" />
                  <div>
                    <p className="text-xs text-[#555]">{notification.title}</p>
                    <p className="mt-1 text-xs text-[#aaa]">
                      {notification.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3 rounded-lg border border-[#e5e7eb] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#171717]">
              Mentor profiliniz
            </h2>
            <p className="mt-1 text-xs text-[#6a7282]">
              Uzmanlık alanlarınızı ve müsaitlik bilgilerinizi güncel tutarak
              daha uygun taleplerle eşleşin.
            </p>
          </div>
          <SecondaryButton href="/mentor-profile" className="shrink-0">
            Profili Görüntüle
          </SecondaryButton>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#99a1af]">
            Gelen Mentorluk Talepleri
          </h2>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-3">
            <div className="flex flex-wrap gap-2">
              {filterOptions.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                    filter === key
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="text-xs font-medium text-zinc-500">
              {filteredRequests.length} talep listeleniyor
            </span>
          </div>

          {requestsQuery.isLoading ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500">
              Talepler yükleniyor...
            </div>
          ) : requestsQuery.error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
              {requestsQuery.error.message}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500">
              Bu filtreye uygun mentorluk talebi bulunamadı.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRequests.map((request) => (
                <MentorRequestCard
                  key={request.id}
                  request={request}
                  onReview={decision.selectRequest}
                />
              ))}
            </div>
          )}
        </section>

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
