"use client";

import { useState } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import { MentorDecisionModal } from "@/components/mentor-dashboard/decision-modal";
import { MentorRequestCard } from "@/components/mentor-dashboard/request-card";
import {
  useMentorRequestDecision,
  useMentorshipRequests,
} from "@/hooks/use-mentorship-requests";
import {
  MentorDecisionMode,
  MentorRequestFilter,
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import { AppArea } from "@/types/app-area";

const DEMO_MENTOR_ID = "00000000-0000-0000-0000-000000000002";

const decisionStatuses: Record<MentorDecisionMode, MentorshipRequestStatus> = {
  [MentorDecisionMode.Accept]: MentorshipRequestStatus.Accepted,
  [MentorDecisionMode.AskInfo]: MentorshipRequestStatus.MoreInfoRequested,
  [MentorDecisionMode.Decline]: MentorshipRequestStatus.Declined,
};

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
  const requestsQuery = useMentorshipRequests("mentor");
  const decisionMutation = useMentorRequestDecision();
  const requests = requestsQuery.data ?? [];
  const [filter, setFilter] = useState<MentorRequestFilter>(
    MentorRequestFilter.All,
  );
  const [selectedRequest, setSelectedRequest] =
    useState<MentorshipRequest | null>(null);
  const [decisionMode, setDecisionMode] = useState<MentorDecisionMode | null>(
    null,
  );
  const [decisionMessage, setDecisionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [showAvailabilityStep, setShowAvailabilityStep] = useState(false);
  const selectedSlots = ["12 Ağustos 2026, 14:00", "14 Ağustos 2026, 10:30"];

  const closeDecision = () => {
    setSelectedRequest(null);
    setDecisionMode(null);
    setDecisionMessage("");
    setActionError("");
    setShowAvailabilityStep(false);
  };

  const handleDecisionSubmit = async () => {
    if (!selectedRequest || !decisionMode) return;
    setActionError("");

    try {
      await decisionMutation.mutateAsync({
        id: selectedRequest.id,
        mentorId: DEMO_MENTOR_ID,
        status: decisionStatuses[decisionMode],
        message:
          decisionMessage ||
          (decisionMode === MentorDecisionMode.Accept
            ? "Talebiniz kabul edildi."
            : "Detaylı bilgi rica ederim."),
      });

      if (decisionMode === MentorDecisionMode.Accept) {
        setShowAvailabilityStep(true);
      } else {
        closeDecision();
      }
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "İşlem sırasında hata oluştu.",
      );
    }
  };

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
                Gelen Mentorluk Talepleri
              </h1>
              <p className="mt-1 text-sm text-zinc-300">
                Girişimcilerden gelen destek taleplerini inceleyin, ek bilgi
                isteyin veya takviminize uygun saatleri sunun.
              </p>
            </div>
            <div className="shrink-0 rounded-xl bg-white/5 p-4 text-center sm:text-right">
              <p className="text-xs text-zinc-400">Bekleyen Talepler</p>
              <p className="text-3xl font-black text-amber-400">
                {
                  requests.filter(
                    (request) =>
                      request.status === MentorshipRequestStatus.Pending,
                  ).length
                }
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
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
                  onReview={(selected) => {
                    setSelectedRequest(selected);
                    setDecisionMode(null);
                    setShowAvailabilityStep(false);
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {selectedRequest ? (
          <MentorDecisionModal
            request={selectedRequest}
            mode={decisionMode}
            message={decisionMessage}
            selectedSlots={selectedSlots}
            showAvailability={showAvailabilityStep}
            isPending={decisionMutation.isPending}
            error={actionError}
            onModeChange={setDecisionMode}
            onMessageChange={setDecisionMessage}
            onClose={closeDecision}
            onSubmit={() => void handleDecisionSubmit()}
          />
        ) : null}
      </div>
    </AppShell>
  );
}
