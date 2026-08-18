"use client";

import { useEffect, useState } from "react";

import { Avatar } from "@/components/common/avatar";
import { Badge } from "@/components/common/badge";
import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import { AppShell } from "@/components/hoc/app-shell";
import { AppArea } from "@/types/app-area";

const DEMO_MENTOR_ID = "00000000-0000-0000-0000-000000000002";

type RequestMessage = {
  messageType: "MENTOR_QUESTION" | "MENTEE_REPLY";
  body: string;
};

type MentorshipRequest = {
  id: string;
  requesterId: string;
  requesterName?: string;
  organizationId: string;
  organizationName?: string;
  mentorId: string;
  mentorName: string;
  supportArea: string;
  status:
    "PENDING" | "MORE_INFO_REQUESTED" | "ACCEPTED" | "DECLINED" | "WITHDRAWN";
  mentorMessage: string | null;
  rejectionReason: string | null;
  createdAt: string;
  messages: RequestMessage[];
};

const statusLabels: Record<string, string> = {
  PENDING: "Yanıt Bekliyor",
  MORE_INFO_REQUESTED: "Ek Bilgi İstendi",
  ACCEPTED: "Kabul Edildi",
  DECLINED: "Uygun Değil",
  WITHDRAWN: "Geri Çekildi",
};

const statusVariant: Record<string, "amber" | "purple" | "green" | "gray"> = {
  PENDING: "amber",
  MORE_INFO_REQUESTED: "purple",
  ACCEPTED: "green",
  DECLINED: "gray",
  WITHDRAWN: "gray",
};

export function MentorDashboardView() {
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("ALL");

  // Selected request for modal review
  const [selectedRequest, setSelectedRequest] =
    useState<MentorshipRequest | null>(null);

  // Decision Modal State
  const [decisionMode, setDecisionMode] = useState<
    "ACCEPT" | "ASK_INFO" | "DECLINE" | null
  >(null);
  const [decisionMessage, setDecisionMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Availability selection state (post-accept step)
  const [showAvailabilityStep, setShowAvailabilityStep] = useState(false);
  const [selectedSlots] = useState<string[]>([
    "12 Ağustos 2026, 14:00",
    "14 Ağustos 2026, 10:30",
  ]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mentor-requests?role=mentor");
      if (!res.ok) throw new Error("Talepler yüklenemedi.");
      const data = await res.json();
      setRequests(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Talepler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    void fetch("/api/mentor-requests?role=mentor")
      .then(async (response) => {
        if (!response.ok) throw new Error("Talepler yüklenemedi.");
        return (await response.json()) as MentorshipRequest[];
      })
      .then((data) => {
        if (!active) return;
        setRequests(data);
        setError("");
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(
          reason instanceof Error ? reason.message : "Talepler yüklenemedi.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleDecisionSubmit = async () => {
    if (!selectedRequest || !decisionMode) return;
    setSubmitting(true);

    let statusString = "ACCEPTED";
    if (decisionMode === "ASK_INFO") statusString = "MORE_INFO_REQUESTED";
    if (decisionMode === "DECLINE") statusString = "DECLINED";

    try {
      const res = await fetch(
        `/api/mentor-requests/${selectedRequest.id}/decision`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mentorId: DEMO_MENTOR_ID,
            status: statusString,
            message:
              decisionMessage ||
              (decisionMode === "ACCEPT"
                ? "Talebiniz kabul edildi."
                : "Detaylı bilgi rica ederim."),
          }),
        },
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message ?? "Karar kaydedilemedi.");
      }

      if (decisionMode === "ACCEPT") {
        // Move to Figma screen 3: Availability selection
        setShowAvailabilityStep(true);
      } else {
        // Close modal and refresh
        setDecisionMode(null);
        setSelectedRequest(null);
        setDecisionMessage("");
      }
      await loadRequests();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "İşlem sırasında hata oluştu.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (filter === "ALL") return true;
    return r.status === filter;
  });

  return (
    <AppShell active={AppArea.MentorDashboard}>
      <div className="mx-auto w-full max-w-[1208px] space-y-6 px-4 pb-12 pt-8 sm:px-8 sm:pt-10">
        {/* Banner Section */}
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
                {requests.filter((r) => r.status === "PENDING").length}
              </p>
            </div>
          </div>
        </section>

        {/* Figma Screen 1: Incoming Requests Dashboard with Filter Tabs */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-3">
            <div className="flex flex-wrap gap-2">
              {[
                ["ALL", "Tüm Talepler"],
                ["PENDING", "Bekleyenler"],
                ["MORE_INFO_REQUESTED", "Ek Bilgi İstenenler"],
                ["ACCEPTED", "Kabul Edilenler"],
                ["DECLINED", "Uygun Değil"],
              ].map(([key, label]) => (
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

          {loading ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500">
              Talepler yükleniyor...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
              {error}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500">
              Bu filtreye uygun mentorluk talebi bulunamadı.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRequests.map((req) => (
                <article
                  key={req.id}
                  className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <Avatar
                          initials={
                            req.organizationName
                              ? req.organizationName
                                  .substring(0, 2)
                                  .toUpperCase()
                              : "GR"
                          }
                        />
                        <div>
                          <h3 className="text-sm font-bold text-zinc-900">
                            {req.organizationName ?? "NovaMed AI"}
                          </h3>
                          <p className="text-xs text-zinc-500">
                            Girişimci Destek Talebi
                          </p>
                        </div>
                      </div>
                      <Badge tone={statusVariant[req.status] ?? "gray"}>
                        {statusLabels[req.status] ?? req.status}
                      </Badge>
                    </div>

                    <div className="mt-4 rounded-lg bg-zinc-50 p-3">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                        Destek Alanı
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-zinc-800">
                        {req.supportArea}
                      </p>
                    </div>

                    {req.mentorMessage && (
                      <div className="mt-3 text-xs text-zinc-600">
                        <span className="font-semibold text-zinc-700">
                          Mentor Notu:
                        </span>{" "}
                        {req.mentorMessage}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 border-t border-zinc-100 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRequest(req);
                        setDecisionMode(null);
                        setShowAvailabilityStep(false);
                      }}
                      className="w-full rounded-lg bg-zinc-900 py-2 text-center text-xs font-semibold text-white transition hover:bg-zinc-800"
                    >
                      Talebi İncele &amp; Yanıtla →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Figma Screen 2 & 3: Request Review, Decision Modal & Availability Selection */}
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
              {!showAvailabilityStep ? (
                <>
                  {/* Screen 2 Header */}
                  <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Talep Detayı #{selectedRequest.id.substring(0, 8)}
                      </span>
                      <h2 className="mt-1 text-xl font-bold text-zinc-900">
                        {selectedRequest.organizationName ?? "NovaMed AI"}{" "}
                        Destek Talebi
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRequest(null);
                        setDecisionMode(null);
                      }}
                      className="text-zinc-400 hover:text-zinc-600"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="my-6 space-y-4 text-xs leading-relaxed text-zinc-700">
                    <div className="grid grid-cols-2 gap-4 rounded-xl bg-zinc-50 p-4">
                      <div>
                        <span className="text-zinc-400">Destek Alanı:</span>
                        <p className="font-semibold text-zinc-800">
                          {selectedRequest.supportArea}
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-400">Mevcut Durum:</span>
                        <p className="font-semibold text-zinc-800">
                          {statusLabels[selectedRequest.status]}
                        </p>
                      </div>
                    </div>

                    {selectedRequest.messages &&
                      selectedRequest.messages.length > 0 && (
                        <div className="space-y-2">
                          <p className="font-semibold text-zinc-800">
                            Mesaj Geçmişi:
                          </p>
                          <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-3">
                            {selectedRequest.messages.map((m, idx) => (
                              <div
                                key={idx}
                                className={`p-2 rounded-lg text-xs ${
                                  m.messageType === "MENTOR_QUESTION"
                                    ? "bg-amber-50 text-amber-900 border border-amber-200"
                                    : "bg-blue-50 text-blue-900 border border-blue-200"
                                }`}
                              >
                                <span className="font-bold">
                                  {m.messageType === "MENTOR_QUESTION"
                                    ? "Mentor Sorusu:"
                                    : "Girişimci Yanıtı:"}
                                </span>{" "}
                                {m.body}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Decision Form Selection */}
                    <div className="space-y-3 pt-2">
                      <p className="font-bold text-zinc-900">
                        Kararınız / Yanıtınız:
                      </p>

                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setDecisionMode("ACCEPT")}
                          className={`rounded-xl border p-3 text-center transition ${
                            decisionMode === "ACCEPT"
                              ? "border-emerald-600 bg-emerald-50 font-bold text-emerald-800 ring-2 ring-emerald-500"
                              : "border-zinc-200 bg-white hover:bg-zinc-50"
                          }`}
                        >
                          <span className="block text-sm">✅ Kabul Et</span>
                          <span className="text-[10px] text-zinc-500">
                            Toplantı planlanacak
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDecisionMode("ASK_INFO")}
                          className={`rounded-xl border p-3 text-center transition ${
                            decisionMode === "ASK_INFO"
                              ? "border-amber-600 bg-amber-50 font-bold text-amber-800 ring-2 ring-amber-500"
                              : "border-zinc-200 bg-white hover:bg-zinc-50"
                          }`}
                        >
                          <span className="block text-sm">
                            💬 Ek Bilgi İste
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            Soru sorulacak
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDecisionMode("DECLINE")}
                          className={`rounded-xl border p-3 text-center transition ${
                            decisionMode === "DECLINE"
                              ? "border-red-600 bg-red-50 font-bold text-red-800 ring-2 ring-red-500"
                              : "border-zinc-200 bg-white hover:bg-zinc-50"
                          }`}
                        >
                          <span className="block text-sm">❌ Uygun Değil</span>
                          <span className="text-[10px] text-zinc-500">
                            Gerekçeyle reddet
                          </span>
                        </button>
                      </div>

                      {decisionMode && (
                        <div className="space-y-2 pt-2">
                          <label className="block text-xs font-semibold text-zinc-700">
                            {decisionMode === "ACCEPT"
                              ? "Kabul Mesajınız (Opsiyonel):"
                              : decisionMode === "ASK_INFO"
                                ? "Girişimciye Sorulacak Soru / İstenecek Detay:"
                                : "Red Gerekçesi / Açıklama:"}
                          </label>
                          <textarea
                            rows={3}
                            value={decisionMessage}
                            onChange={(e) => setDecisionMessage(e.target.value)}
                            placeholder="Mesajınızı buraya yazın..."
                            className="w-full rounded-xl border border-zinc-300 p-3 text-xs focus:border-zinc-900 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Modal Footer Actions */}
                  <div className="flex justify-end gap-3 border-t border-zinc-100 pt-4">
                    <SecondaryButton
                      onClick={() => {
                        setSelectedRequest(null);
                        setDecisionMode(null);
                      }}
                    >
                      Vazgeç
                    </SecondaryButton>
                    <PrimaryButton
                      disabled={!decisionMode || submitting}
                      onClick={handleDecisionSubmit}
                    >
                      {submitting
                        ? "Kaydediliyor..."
                        : "Kararı Kaydet & Devam Et →"}
                    </PrimaryButton>
                  </div>
                </>
              ) : (
                /* Figma Screen 3: Availability Selection Screen After Accepting */
                <>
                  <div className="border-b border-zinc-100 pb-4">
                    <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                      ✅ Talep Kabul Edildi
                    </span>
                    <h2 className="mt-2 text-xl font-bold text-zinc-900">
                      Müsaitlik Zaman Dilimi Seçimi
                    </h2>
                    <p className="mt-1 text-xs text-zinc-500">
                      Girişimciye sunmak istediğiniz uygun zaman dilimlerini
                      teyit edin.
                    </p>
                  </div>

                  <div className="my-6 space-y-3">
                    <p className="text-xs font-semibold text-zinc-700">
                      Sunulan Zaman Dilimleri:
                    </p>
                    {selectedSlots.map((slot, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-emerald-900"
                      >
                        <span className="font-semibold">📅 {slot}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                          Aktif Slot
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3 border-t border-zinc-100 pt-4">
                    <PrimaryButton
                      onClick={() => {
                        setSelectedRequest(null);
                        setDecisionMode(null);
                        setShowAvailabilityStep(false);
                      }}
                    >
                      Tamamla &amp; Kapat
                    </PrimaryButton>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
