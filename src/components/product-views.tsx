"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ReactNode, useEffect, useState, useTransition } from "react";

import {
  AppShell,
  Avatar,
  Badge,
  PrimaryButton,
  SecondaryButton,
} from "@/components/app-shell";
import type { MentorProfile } from "@/interfaces/mentor";

type RequestMessage = {
  messageType: "MENTOR_QUESTION" | "MENTEE_REPLY";
  body: string;
};
type RequestView = {
  id: string;
  mentorId: string;
  mentorName: string;
  supportArea: string;
  status: string;
  mentorMessage: string | null;
  rejectionReason: string | null;
  createdAt: string;
  messages: RequestMessage[];
};
type Slot = { id: string; startsAt: string };
type Alternative = {
  fullName: string;
  initials: string;
  professionalTitle: string;
  company: string;
};

const statusLabels: Record<string, string> = {
  PENDING: "Yanıt Bekleniyor",
  MORE_INFO_REQUESTED: "Ek Bilgi İstendi",
  ACCEPTED: "Kabul Edildi",
  DECLINED: "Uygun Değil",
  WITHDRAWN: "Geri Çekildi",
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Talep yüklenemedi.");
  return body as T;
}

function useRequest(id: string | null) {
  const [request, setRequest] = useState<RequestView | null>(null);
  const [error, setError] = useState("");
  const reload = async () => {
    if (!id) return;
    try {
      setRequest(await requestJson<RequestView>(`/api/mentor-requests/${id}`));
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Talep yüklenemedi.");
    }
  };
  useEffect(() => {
    if (!id) return;
    let active = true;
    void requestJson<RequestView>(`/api/mentor-requests/${id}`)
      .then((data) => {
        if (active) {
          setRequest(data);
          setError("");
        }
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Talep yüklenemedi.",
          );
      });
    return () => {
      active = false;
    };
  }, [id]);
  return { request, error, reload };
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

export function RequestSentView() {
  const id = useSearchParams().get("request");
  const { request, error, reload } = useRequest(id);
  return (
    <AppShell>
      <div className="mx-auto flex min-h-[calc(100vh-56px)] max-w-xl flex-col items-center px-4 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-[#f0f0f0] text-2xl text-[#666]">
          ✓
        </span>
        <h1 className="mt-5 text-2xl font-semibold text-[#171717]">
          Mentorluk talebiniz gönderildi
        </h1>
        <p className="mt-2 text-sm text-[#777]">
          Mentor talebinizi değerlendirdiğinde size bildirim göndereceğiz.
        </p>
        {error ? (
          <p role="alert" className="mt-6 text-sm text-[#b42318]">
            {error}
          </p>
        ) : null}
        {request ? (
          <dl className="mt-7 grid w-full grid-cols-2 gap-5 rounded-lg border border-[#e5e7eb] bg-white p-5 text-left text-sm">
            <Info label="Mentor" value={request.mentorName} />
            <Info label="Talep konusu" value={request.supportArea} />
            <Info
              label="Gönderilme tarihi"
              value={dateLabel(request.createdAt)}
            />
            <Info label="Beklenen yanıt süresi" value="~24 saat" />
            <Info label="Talep durumu" value={statusLabels[request.status]} />
          </dl>
        ) : (
          <p className="mt-7 text-sm text-[#777]">
            Talep bilgileri yükleniyor…
          </p>
        )}
        <div className="mt-6 grid w-full gap-2">
          <PrimaryButton
            href={
              id
                ? `/mentor-request/status?request=${id}`
                : "/mentor-request/status"
            }
            className="w-full"
          >
            Talep Detaylarını Gör
          </PrimaryButton>
          <SecondaryButton disabled className="w-full">
            Alternatif Mentorları İncele
          </SecondaryButton>
          <SecondaryButton
            href="/dashboard"
            className="w-full border-0 bg-transparent"
          >
            Ana Sayfaya Dön
          </SecondaryButton>
        </div>
        <button
          type="button"
          onClick={() => void reload()}
          className="mt-6 text-xs text-[#aaa]"
        >
          Fikrinizi değiştirdiniz mi?{" "}
          <span className="text-[#555]">Talebi geri çek</span>
        </button>
      </div>
    </AppShell>
  );
}

export function RequestStatusView() {
  const params = useSearchParams();
  const router = useRouter();
  const explicitRequestId = params.get("request");
  const requestedState = params.get("state");
  const [requests, setRequests] = useState<RequestView[]>([]);
  const [requestsError, setRequestsError] = useState("");
  useEffect(() => {
    void requestJson<RequestView[]>("/api/mentor-requests")
      .then(setRequests)
      .catch((cause: unknown) =>
        setRequestsError(
          cause instanceof Error ? cause.message : "Talepler yüklenemedi.",
        ),
      );
  }, []);
  const id =
    explicitRequestId ??
    requests.find((item) => item.status === requestedState)?.id ??
    requests[0]?.id ??
    null;
  const { request, error, reload } = useRequest(id);
  const [reply, setReply] = useState("");
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  useEffect(() => {
    if (request?.status === "ACCEPTED")
      void requestJson<Slot[]>(
        `/api/mentor-requests/${request.id}/availability`,
      )
        .then(setSlots)
        .catch(() => setSlots([]));
    if (request?.status === "DECLINED")
      void requestJson<Alternative[]>(
        `/api/mentor-requests/${request.id}/alternatives`,
      )
        .then(setAlternatives)
        .catch(() => setAlternatives([]));
  }, [request]);
  const act = (url: string, init: RequestInit) =>
    startTransition(async () => {
      try {
        await requestJson(url, init);
        await reload();
        setReply("");
        setActionError("");
      } catch (cause) {
        setActionError(
          cause instanceof Error ? cause.message : "İşlem tamamlanamadı.",
        );
      }
    });
  return (
    <AppShell title="Talep Detayı" backHref="/dashboard">
      <div className="mx-auto max-w-[736px] px-4 py-6 sm:px-8">
        <div className="flex gap-2 overflow-x-auto">
          {Object.entries(statusLabels)
            .slice(0, 4)
            .map(([key, label]) => (
              <button
                type="button"
                key={key}
                onClick={() =>
                  router.push(`/mentor-request/status?state=${key}`)
                }
                className={`shrink-0 rounded-full border px-3 py-2 text-xs ${request?.status === key ? "border-[#555] bg-[#555] font-medium text-white" : "border-[#e5e7eb] bg-white text-[#555]"}`}
              >
                {label}
              </button>
            ))}
        </div>
        {requestsError || error ? (
          <p role="alert" className="mt-4 text-sm text-[#b42318]">
            {requestsError || error}
          </p>
        ) : null}
        {!request && !error && !requestsError ? (
          <p className="mt-4 text-sm text-[#777]">
            {requests.length
              ? "Bu durumda bir talep bulunmuyor."
              : "Talep yükleniyor…"}
          </p>
        ) : null}
        {request ? (
          <>
            <section className="mt-4 rounded-lg border border-[#e5e7eb] bg-white p-4">
              <div className="flex items-center gap-3">
                <Avatar
                  initials={request.mentorName
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                />
                <div className="flex-1">
                  <h2 className="text-sm font-semibold">
                    {request.mentorName}
                  </h2>
                  <p className="mt-1 text-xs text-[#777]">
                    {request.supportArea} · Gönderildi:{" "}
                    {dateLabel(request.createdAt)}
                  </p>
                </div>
                <Badge
                  tone={
                    request.status === "ACCEPTED"
                      ? "green"
                      : request.status === "DECLINED"
                        ? "gray"
                        : "amber"
                  }
                >
                  {statusLabels[request.status]}
                </Badge>
              </div>
            </section>
            <section className="mt-3 rounded-lg border border-[#e5e7eb] bg-white p-4">
              <div>
                {request.status === "PENDING" ? (
                  <div>
                    <h3 className="text-lg font-semibold">Yanıt bekleniyor</h3>
                    <p className="mt-2 text-sm text-[#777]">
                      Beklenen yanıt süresi: ~24 saat
                    </p>
                    <p className="mt-1 text-xs text-[#aaa]">
                      Gönderim: 9 Ağustos 2024 · 14:32
                    </p>
                  </div>
                ) : null}
                {request.status === "MORE_INFO_REQUESTED" ? (
                  <div>
                    <Badge tone="amber">Ek bilgi istendi</Badge>
                    <p className="mt-4 text-sm font-semibold">
                      Mentorun sorusu:
                    </p>
                    <blockquote className="mt-2 rounded-md bg-[#f9fafb] p-4 text-sm italic leading-6 text-[#555]">
                      “
                      {request.messages
                        .filter(
                          (message) =>
                            message.messageType === "MENTOR_QUESTION",
                        )
                        .at(-1)?.body ?? request.mentorMessage}
                      ”
                    </blockquote>
                    <textarea
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      placeholder="Yanıtınızı yazın…"
                      className="mt-4 min-h-28 w-full rounded-md border border-[#e5e7eb] p-3 text-sm"
                    />
                    <div className="mt-3 flex justify-end gap-2">
                      <SecondaryButton disabled>Dosya Ekle</SecondaryButton>
                      <PrimaryButton
                        disabled={!reply.trim() || isPending}
                        onClick={() =>
                          act(`/api/mentor-requests/${request.id}/messages`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ message: reply }),
                          })
                        }
                      >
                        Yanıtı Gönder
                      </PrimaryButton>
                    </div>
                  </div>
                ) : null}
                {request.status === "ACCEPTED" ? (
                  <AcceptedRequestCalendar
                    message={request.mentorMessage}
                    slots={slots}
                    request={request}
                  />
                ) : null}
                {request.status === "DECLINED" ? (
                  <div>
                    <h3 className="text-lg font-semibold">Uygun değil</h3>
                    <p className="mt-3 text-sm text-[#777]">
                      Neden uygun değil:
                    </p>
                    <p className="mt-1 text-sm">{request.rejectionReason}</p>
                    <div className="mt-5 flex items-center gap-3 rounded-lg border border-[#e5e7eb] p-4">
                      <Avatar initials={alternatives[0]?.initials ?? "?"} />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold">
                          {alternatives[0]?.fullName ?? "Alternatif mentor"}
                        </h4>
                        <p className="mt-1 text-xs text-[#777]">
                          {alternatives[0]
                            ? `${alternatives[0].professionalTitle} · ${alternatives[0].company}`
                            : "Öneri yükleniyor"}
                        </p>
                      </div>
                      <PrimaryButton
                        href={`/mentor-request?step=4&request=${encodeURIComponent(request.id)}&exclude=${encodeURIComponent(request.mentorName)}`}
                      >
                        Alternatif Mentora Talep Gönder
                      </PrimaryButton>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
            {request.status === "PENDING" ? (
              <div className="mt-5 flex flex-wrap gap-2">
                <SecondaryButton
                  disabled={isPending}
                  onClick={() =>
                    act(`/api/mentor-requests/${request.id}/withdrawal`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({}),
                    })
                  }
                >
                  Talebi Geri Çek
                </SecondaryButton>
                <SecondaryButton href="/mentors/compare">
                  Alternatif Mentorları Görüntüle
                </SecondaryButton>
              </div>
            ) : null}
            {actionError ? (
              <p role="alert" className="mt-3 text-sm text-[#b42318]">
                {actionError}
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </AppShell>
  );
}

function AcceptedRequestCalendar({
  message,
  slots,
  request,
}: {
  message: string | null;
  slots: Slot[];
  request?: RequestView;
}) {
  const router = useRouter();
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookedSuccess, setBookedSuccess] = useState(false);

  const selectedSlot = slots.find((s) => s.id === selectedSlotId);

  const handleConfirmSlot = async () => {
    if (!selectedSlot) return;
    setBooking(true);
    try {
      const res = await fetch(`/api/mentor-requests/${request?.id}/meeting`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: selectedSlot.id,
        }),
      });

      if (!res.ok) {
        throw new Error("Toplantı kaydı oluşturulamadı.");
      }

      setBookedSuccess(true);
      setTimeout(() => router.push("/calendar"), 1200);
    } catch {
      alert("Toplantı planlanırken bir hata oluştu.");
    } finally {
      setBooking(false);
    }
  };

  return (
    <div>
      <div className="rounded-md bg-[#f5f5f5] p-3 text-[#444]">
        <p className="text-xs font-semibold">Mentorun mesajı:</p>
        <p className="mt-1 text-sm leading-5">&quot;{message}&quot;</p>
      </div>

      {bookedSuccess && (
        <div className="mt-4 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
          ✅ Toplantınız başarıyla takvime kaydedildi! Ana sayfaya
          yönlendiriliyorsunuz...
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {Object.entries(
          Object.groupBy(slots, (slot) =>
            new Date(slot.startsAt).toLocaleDateString("tr-TR", {
              weekday: "short",
              day: "numeric",
            }),
          ),
        ).map(([day, groupedSlots]) => (
          <div key={day}>
            <h3 className="mb-2 text-center text-xs font-medium text-[#6a7282]">
              {day}
            </h3>
            <div className="space-y-2">
              {(groupedSlots ?? []).map((slot) => {
                const isSelected = selectedSlotId === slot.id;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedSlotId(slot.id)}
                    className={`h-9 w-full rounded-md border text-xs font-medium transition ${
                      isSelected
                        ? "border-[#555] bg-[#555] text-white font-bold"
                        : "border-[#e5e7eb] bg-white text-[#364153] hover:bg-zinc-50"
                    }`}
                  >
                    {new Date(slot.startsAt).toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex justify-end gap-3">
        <SecondaryButton disabled>Başka Saat Öner</SecondaryButton>
        <PrimaryButton
          disabled={!selectedSlotId || booking || bookedSuccess}
          onClick={handleConfirmSlot}
        >
          {booking ? "Kaydediliyor..." : "Saat Seç & Toplantıyı Kaydet"}
        </PrimaryButton>
      </div>
    </div>
  );
}

export function MentorComparisonView({
  mentors,
  mentorLoadError,
}: {
  mentors: MentorProfile[];
  mentorLoadError?: string;
}) {
  const comparisonRows = [
    ["İhtiyaç uyumu", ...mentors.map((mentor) => mentor.fitLabel)],
    ["İlgili uzmanlık", ...mentors.map((mentor) => mentor.experienceLevel)],
    ["Startup seviyesi", ...mentors.map((mentor) => mentor.startupStages)],
    ["Sektör deneyimi", ...mentors.map((mentor) => mentor.sectorExperience)],
    ["Mentorluk tarzı", ...mentors.map((mentor) => mentor.mentoringStyle)],
    ["Görüşme biçimi", ...mentors.map((mentor) => mentor.meetingMode)],
    ["Mesajlaşma", ...mentors.map((mentor) => mentor.communicationPreference)],
    ["Müsaitlik", ...mentors.map((mentor) => mentor.availabilityLabel)],
    ["Yanıt süresi", ...mentors.map((mentor) => mentor.responseTimeLabel)],
  ];

  return (
    <AppShell title="Mentor Karşılaştırması" backHref="/mentor-request">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8">
        {mentorLoadError ? (
          <div
            role="alert"
            className="rounded-lg border border-[#fecaca] bg-[#fef2f2] p-5 text-sm text-[#991b1b]"
          >
            Mentor karşılaştırma verileri backend&apos;den yüklenemedi.{" "}
            {mentorLoadError}
          </div>
        ) : null}
        {!mentorLoadError && mentors.length === 0 ? (
          <div className="rounded-lg border border-[#e5e7eb] bg-white p-6 text-center text-sm text-[#777]">
            Karşılaştırılacak mentor bulunamadı.
          </div>
        ) : null}
        {mentors.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-[#e5e7eb] bg-white">
            <table className="min-w-[800px] w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#fafafa]">
                  <th className="w-1/4 p-4 text-left" />
                  {mentors.map((mentor, index) => (
                    <th
                      key={mentor.id}
                      className="w-1/4 p-4 text-left font-medium"
                    >
                      <span className="flex items-center gap-3">
                        <Avatar initials={mentor.initials} size="sm" />
                        {mentor.fullName}
                      </span>
                      {index === 0 ? (
                        <span className="mt-3 block text-xs">En uygun</span>
                      ) : null}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, index) => (
                  <tr
                    key={row[0]}
                    className={index % 2 ? "bg-[#fafafa]" : "bg-white"}
                  >
                    {row.map((cell, cellIndex) => (
                      <td
                        key={`${row[0]}-${cellIndex}`}
                        className={`p-4 ${cellIndex === 0 ? "text-[#777]" : "text-[#444]"}`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td />
                  {mentors.map((mentor) => (
                    <td key={mentor.id} className="p-4">
                      <SecondaryButton
                        disabled
                        className="mb-2 w-full border-0"
                      >
                        Profili Görüntüle
                      </SecondaryButton>
                      <PrimaryButton
                        href={`/mentor-request?step=4&mentor=${mentor.id}`}
                        className="w-full"
                      >
                        Bu Mentoru Seç
                      </PrimaryButton>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

export function ScheduleMeetingView() {
  const [selected, setSelected] = useState<string | null>(null);
  const days = [
    ["Pzt 12", "09:00", "10:30", "14:00", "15:30"],
    ["Sal 13", "10:00", "11:30"],
    ["Çar 14", "09:00", "14:00", "16:00"],
    ["Per 15", "11:00", "15:00"],
    ["Cum 16", "10:00"],
  ];
  return (
    <AppShell
      active="calendar"
      title="Toplantı Planla"
      backHref="/mentor-request/status?state=accepted"
    >
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8">
        <section className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white p-4">
          <Avatar initials="DK" size="sm" />
          <span className="text-sm">Dr. Kemal Arslan</span>
          <span>·</span>
          <span className="text-sm">Kullanıcı testi</span>
          <span>·</span>
          <Badge>Online</Badge>
        </section>
        <div className="mt-5 flex flex-wrap gap-2">
          {["Bu hafta", "Gelecek hafta", "Sabah", "Öğleden sonra"].map(
            (label, index) => (
              <button
                key={label}
                type="button"
                className={`rounded-full border px-4 py-2 text-xs ${index === 0 ? "border-[#555] bg-[#555] text-white" : "border-[#e5e7eb] bg-white"}`}
              >
                {label}
              </button>
            ),
          )}
        </div>
        <h2 className="mt-5 text-xs font-semibold text-[#777]">
          Ortak müsait zamanlar — Ağustos 2024
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {days.map(([day, ...slots]) => (
            <div key={day}>
              <h3 className="mb-2 text-center text-xs text-[#777]">{day}</h3>
              <div className="space-y-2">
                {slots.map((slot) => {
                  const value = `${day} ${slot}`;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelected(value)}
                      className={`h-9 w-full rounded-md border text-xs ${selected === value ? "border-[#555] bg-[#555] text-white" : "border-[#e5e7eb] bg-white"}`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {selected ? (
          <section className="mt-6 rounded-lg border border-[#e5e7eb] bg-white p-5">
            <h2 className="text-sm font-semibold">Toplantı Özeti</h2>
            <p className="mt-3 text-sm">Tarih: {selected}</p>
            <p className="mt-1 text-sm">Süre: 60 dakika</p>
            <p className="mt-1 text-sm">Biçim: Online</p>
            <p className="mt-3 text-xs text-[#888]">
              Toplantı linki onaydan sonra oluşturulacaktır.
            </p>
            <PrimaryButton href="/meetings/research" className="mt-4">
              Toplantıyı Planla
            </PrimaryButton>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

export function MeetingDetailView() {
  return (
    <AppShell
      active="meetings"
      title="Toplantı Detayı"
      backHref="/dashboard"
      actions={<PrimaryButton>▣ Toplantıya Katıl</PrimaryButton>}
    >
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8">
        <section className="rounded-lg border border-[#e5e7eb] bg-white p-4">
          <div className="flex items-center gap-3">
            <Avatar initials="DK" />
            <div className="flex-1">
              <h2 className="text-sm font-semibold">Dr. Kemal Arslan</h2>
              <p className="mt-1 text-xs text-[#777]">
                Ürün & Araştırma Direktörü · Trendyol
              </p>
            </div>
            <Badge>Online</Badge>
          </div>
          <dl className="mt-4 grid gap-4 border-t border-[#eee] pt-4 text-sm sm:grid-cols-3">
            <Info label="Tarih & Saat" value="Pzt, 12 Ağustos · 14:00" />
            <Info label="Süre" value="60 dakika" />
            <Info label="Toplantı Linki" value="Linki Aç" />
          </dl>
        </section>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <Card title="Toplantının Amacı">
              <p>Kullanıcı testi yöntemi ve segmentasyon belirleme</p>
              <p className="mt-2 text-xs text-[#aaa]">
                Beklenen çıktı: Uygulanabilir kullanıcı testi planı
              </p>
            </Card>
            <Card title="Katılacak Ekip Üyeleri">
              <Person initials="AK" name="Ayşe Kaya (CEO)" />
              <Person initials="BŞ" name="Burak Şahin (CTO)" />
            </Card>
            <Card title="Paylaşılan Dosyalar">
              <p>▱ Pitch Deck v3.pdf</p>
              <p className="mt-2 text-[#999]">△ Ürün demosu eksik</p>
              <button className="mt-3 text-xs" type="button">
                Dosya ekle →
              </button>
            </Card>
          </div>
          <div className="space-y-4">
            <Card title="Hazırlık Durumu">
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 rounded-full bg-[#eee]">
                  <div className="h-full w-2/5 rounded-full bg-[#777]" />
                </div>
                <span>2/5</span>
              </div>
              <SecondaryButton
                href="/meetings/research/prepare"
                className="mt-3 border-0 px-0"
              >
                Hazırlığa devam et →
              </SecondaryButton>
            </Card>
            <Card title="Önceki Toplantı Özeti">
              <p className="italic text-[#888]">
                İlk toplantı — özet henüz yok
              </p>
            </Card>
            <Card title="Açık Aksiyonlar">
              <ul className="space-y-2">
                <li>• Kullanıcı segmentini tanımla</li>
                <li>• Test soruları hazırla</li>
                <li>• Demo videosunu hazırla</li>
              </ul>
            </Card>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <SecondaryButton disabled>Yeniden Planla</SecondaryButton>
          <SecondaryButton>Mentora Not Gönder</SecondaryButton>
          <SecondaryButton>Toplantıyı İptal Et</SecondaryButton>
        </div>
      </div>
    </AppShell>
  );
}

export function MentorshipDetailView() {
  const [tab, setTab] = useState("Genel Bakış");
  return (
    <AppShell
      active="mentorships"
      title="Mentorluk Süreci"
      backHref="/dashboard"
      actions={<PrimaryButton disabled>+ Toplantı Planla</PrimaryButton>}
    >
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8">
        <section className="flex flex-col gap-4 rounded-lg border border-[#e5e7eb] bg-white p-4 sm:flex-row sm:items-center">
          <Avatar initials="DK" />
          <div className="flex-1">
            <h2 className="text-base font-semibold">
              Kullanıcı Araştırması &amp; Test
            </h2>
            <p className="mt-1 text-sm text-[#777]">
              Dr. Kemal Arslan · Trendyol
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#aaa]">
              <Badge>Devam Ediyor</Badge>
              <span>Başlangıç: 5 Ağustos 2024</span>
              <span>· Sonraki: 12 Ağustos 14:00</span>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm font-medium">Mentorluk Hedefi</p>
            <p className="mt-1 text-xs text-[#777]">
              Uygulanabilir kullanıcı testi planı oluşturmak
            </p>
          </div>
        </section>
        <div className="mt-4 flex gap-1 overflow-x-auto border-b border-[#e5e7eb]">
          {["Genel Bakış", "Toplantılar", "Aksiyonlar", "Dosyalar"].map(
            (label) => (
              <button
                key={label}
                type="button"
                onClick={() => setTab(label)}
                className={`shrink-0 border-b-2 px-4 py-3 text-sm ${tab === label ? "border-[#555] text-[#444]" : "border-transparent text-[#777]"}`}
              >
                {label}
              </button>
            ),
          )}
        </div>
        {tab === "Genel Bakış" ? (
          <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_288px]">
            <div className="space-y-4">
              <Card title="Süreç Durumu">
                <div className="flex items-center gap-3">
                  <div className="h-2 flex-1 rounded-full bg-[#eee]">
                    <div className="h-full w-[35%] rounded-full bg-[#777]" />
                  </div>
                  <strong>%35</strong>
                </div>
                <p className="mt-3 text-xs text-[#aaa]">
                  2/3 toplantı tamamlandı · 5 aksiyon açık
                </p>
              </Card>
              <Card title="Son Görüşme Özeti">
                <p className="leading-6">
                  Kullanıcı segmentleri ve test senaryoları üzerine çalışıldı.
                  Primer kullanıcı grubu olarak “Hekim asistanları” belirlendi.
                  Bir sonraki adımda 5 kişilik pilot grup ile görüşme yapılacak.
                </p>
                <p className="mt-3 text-xs text-[#aaa]">5 Ağustos 2024</p>
              </Card>
              <Card title="Bir Sonraki Adım">
                <p>
                  Pilot kullanıcı görüşmeleri için soru seti hazırla ve 12
                  Ağustos toplantısına getir.
                </p>
              </Card>
            </div>
            <div className="space-y-4">
              <Card title="Açık Risk">
                <p>
                  Demo video hazırlığı gecikiyor. Bir sonraki toplantıdan önce
                  tamamlanmalı.
                </p>
              </Card>
              <Card title="Mentor İletişimi">
                <p className="text-xs text-[#888]">Son mesaj: 7 Ağustos</p>
                <textarea
                  placeholder="Mentora kısa not gönder..."
                  className="mt-3 min-h-20 w-full rounded-md border border-[#e5e7eb] p-3 text-sm"
                />
                <SecondaryButton className="mt-2">Gönder</SecondaryButton>
              </Card>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-[#e5e7eb] bg-white p-8 text-center text-sm text-[#777]">
            {tab} görünümü backend bağlantısı için hazır.
          </div>
        )}
      </div>
    </AppShell>
  );
}

export function MeetingPreparationView() {
  const labels = [
    "Pitch deck'i güncelle",
    "Ürün demosunu ekle",
    "Görüşülecek üç ana soruyu yaz",
    "Önceki aksiyonları tamamla",
    "İlgili verileri yükle",
  ];
  const [checked, setChecked] = useState(() => new Set([labels[0]]));
  function toggle(label: string) {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }
  return (
    <AppShell
      active="actions"
      title="Toplantıya hazırlanın"
      backHref="/meetings/research"
    >
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8">
        <section className="rounded-lg border border-[#e5e7eb] bg-white p-4">
          <h2 className="text-sm font-semibold">
            △ Toplantıya 10 saatten az kaldı
          </h2>
          <p className="mt-2 text-xs text-[#777]">
            {labels.length - checked.size} görev tamamlanmadı. Toplantı
            öncesinde hazırlığınızı tamamlamanız önerilir.
          </p>
        </section>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <Card title="Toplantının Amacı">
              <p className="font-medium">
                Kullanıcı testi yöntemi ve segmentasyon
              </p>
              <p className="mt-2 leading-5 text-[#777]">
                MVP&apos;yi ilk kullanıcılarla test etmeye hazırlanıyoruz. Test
                yöntemini ve doğru kullanıcı grubunu belirlemekte zorlanıyoruz.
              </p>
              <p className="mt-2 text-xs text-[#aaa]">
                Beklenen çıktı: Uygulanabilir bir kullanıcı testi planı
              </p>
            </Card>
            <Card title="Hazırlık Listesi">
              <div className="space-y-2">
                {labels.map((label) => (
                  <label
                    key={label}
                    className="flex cursor-pointer items-center gap-3"
                  >
                    <input
                      type="checkbox"
                      checked={checked.has(label)}
                      onChange={() => toggle(label)}
                      className="size-4 accent-[#555]"
                    />
                    <span
                      className={
                        checked.has(label) ? "text-[#aaa] line-through" : ""
                      }
                    >
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </Card>
          </div>
          <div className="space-y-4">
            <Card title="Gerekli Dosyalar">
              <p>
                ▱ Pitch Deck v3.pdf <Badge tone="green">Yüklendi</Badge>
              </p>
              <p className="mt-2">
                △ Ürün demosu <Badge>Eksik</Badge>
              </p>
              <p className="mt-2">
                △ Araştırma verisi <Badge>Eksik</Badge>
              </p>
              <SecondaryButton className="mt-4 w-full border-dashed">
                Dosya Yükle
              </SecondaryButton>
            </Card>
            <Card title="Mentora Not">
              <textarea
                placeholder="Mentora iletmek istediğiniz kısa bir not ekleyebilirsiniz..."
                className="min-h-24 w-full resize-none rounded-md border border-[#e5e7eb] p-3 text-sm"
              />
            </Card>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <PrimaryButton href="/meetings/research">
            Toplantı Detayına Git ›
          </PrimaryButton>
        </div>
      </div>
    </AppShell>
  );
}

export function MeetingFeedbackView() {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const questions = [
    "Görüşme ihtiyacınıza ne kadar yardımcı oldu?",
    "Mentorun yaklaşımı ve yönlendirmesi nasıldı?",
    "Bu mentoru başka bir girişimciye önerir misiniz?",
  ];

  return (
    <AppShell
      active="meetings"
      title="Toplantıyı Değerlendir"
      backHref="/meetings/research"
    >
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8">
        <section className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white p-4">
          <Avatar initials="DK" size="sm" />
          <div className="flex-1">
            <h2 className="text-sm font-semibold">Dr. Kemal Arslan</h2>
            <p className="mt-1 text-xs text-[#777]">
              Kullanıcı testi · 12 Ağustos 2024
            </p>
          </div>
          <Badge>Tamamlandı</Badge>
        </section>

        <section className="mt-4 rounded-lg border border-[#e5e7eb] bg-white p-5">
          <h1 className="text-lg font-semibold">Görüşme nasıldı?</h1>
          <p className="mt-1 text-sm text-[#777]">
            Geri bildiriminiz mentorluk deneyimini geliştirmemize yardımcı olur.
          </p>
          <div className="mt-6 space-y-6">
            {questions.map((question) => (
              <fieldset key={question}>
                <legend className="text-sm font-medium">{question}</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      aria-label={`${question}: ${rating}`}
                      aria-pressed={ratings[question] === rating}
                      onClick={() =>
                        setRatings((current) => ({
                          ...current,
                          [question]: rating,
                        }))
                      }
                      className={`flex size-10 items-center justify-center rounded-md border text-sm ${ratings[question] === rating ? "border-[#555] bg-[#555] text-white" : "border-[#e5e7eb] bg-white text-[#555]"}`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          <label className="mt-6 block text-sm font-medium">
            Bu mentorla devam etmek ister misiniz?
            <select className="mt-2 w-full rounded-md border border-[#e5e7eb] p-3 text-sm">
              <option>Henüz karar vermedim</option>
              <option>Evet, devam etmek isterim</option>
              <option>Hayır, başka bir mentor arıyorum</option>
            </select>
          </label>
          <label className="mt-5 block text-sm font-medium">
            Eklemek istediğiniz bir not var mı?
            <textarea
              placeholder="Deneyiminizi kısaca paylaşın..."
              className="mt-2 min-h-28 w-full resize-none rounded-md border border-[#e5e7eb] p-3 text-sm"
            />
          </label>
          <div className="mt-6 flex justify-end gap-2">
            <SecondaryButton href="/meetings/research">
              Daha Sonra
            </SecondaryButton>
            <PrimaryButton href="/mentorships/research">
              Değerlendirmeyi Gönder
            </PrimaryButton>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-[#aaa]">{label}</dt>
      <dd className="mt-1 text-sm text-[#444]">{value}</dd>
    </div>
  );
}
function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-[#e5e7eb] bg-white p-4 text-sm">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.03em] text-[#777]">
        {title}
      </h2>
      {children}
    </section>
  );
}
function Person({ initials, name }: { initials: string; name: string }) {
  return (
    <div className="mt-2 flex items-center gap-2">
      <Avatar initials={initials} size="sm" />
      <span>{name}</span>
    </div>
  );
}
