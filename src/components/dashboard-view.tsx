"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  AppShell,
  Avatar,
  Badge,
  PrimaryButton,
  SecondaryButton,
} from "@/components/app-shell";
import { useDemoSession } from "@/components/providers/session-provider";

type MeetingItem = {
  id: string;
  scheduledAt: string;
  durationMinutes: number;
  agenda?: string;
  meetLink?: string;
  status: string;
};

type RequestItem = {
  id: string;
  mentorName: string;
  supportArea: string;
  status: string;
  createdAt: string;
};

const requestStatusLabels: Record<string, string> = {
  PENDING: "Yanıt bekleniyor",
  MORE_INFO_REQUESTED: "Ek bilgi istendi",
  ACCEPTED: "Kabul edildi",
  DECLINED: "Uygun değil",
  WITHDRAWN: "Geri çekildi",
};

function formatMeetingDate(dateString: string) {
  const d = new Date(dateString);
  return new Intl.DateTimeFormat("tr-TR", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function DashboardView() {
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const session = useDemoSession();

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [meetRes, requestRes] = await Promise.all([
          fetch("/api/meetings"),
          fetch("/api/mentor-requests"),
        ]);

        if (meetRes.ok) {
          const meetData = await meetRes.json();
          if (active && Array.isArray(meetData)) setMeetings(meetData);
        }
        if (requestRes.ok) {
          const requestData = await requestRes.json();
          if (active && Array.isArray(requestData)) setRequests(requestData);
        }
      } catch {
        // Fall back gracefully
      }
    }

    void loadData();
    return () => {
      active = false;
    };
  }, []);

  const nextMeeting = meetings.length > 0 ? meetings[0] : null;

  return (
    <AppShell active="home">
      <div className="mx-auto w-full max-w-[1208px] space-y-6 px-4 pb-6 pt-8 sm:px-8 sm:pt-14">
        <section className="flex min-h-44 flex-col justify-between gap-8 rounded-[24px] bg-[#45454d] p-6 text-white sm:h-[181px] sm:flex-row sm:items-start">
          <div>
            <h1 className="text-2xl font-semibold">
              Hoş geldin, {session?.fullName.split(" ")[0] ?? "Mentee"}
            </h1>
            <p className="mt-1 text-sm font-semibold">
              {session?.organizationName ?? "Girişim"} · Teknokent Başlangıç
              Programı 2026
            </p>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/90">
              Mentorluk sürecinizi buradan takip edin. Yaklaşan toplantılarınızı
              görüntüleyin, hazırlıklarınızı tamamlayın ve yeni mentorluk
              talepleri oluşturun.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <SecondaryButton
              href="/mentor-request"
              className="text-[#45454d] shadow-sm hover:bg-[#f5f5f5]"
            >
              <span className="mr-2 text-lg">+</span> Mentorluk Talebi Oluştur
            </SecondaryButton>
            <Link
              href="/profile"
              className="text-center text-xs font-medium text-white underline underline-offset-2"
            >
              Girişim profilini güncelle
            </Link>
          </div>
        </section>

        {/* Live Upcoming Meeting Card */}
        <section className="flex flex-col gap-4 rounded-lg border border-[#e5e7eb] bg-white p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <span className="relative flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#f3f4f6]">
              <Image src="/app-icons/video.svg" alt="" width={16} height={16} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-[#171717]">
                {nextMeeting
                  ? "Yaklaşan Toplantı"
                  : "Yaklaşan Toplantı — 10 saat sonra"}
              </h2>
              <p className="mt-1 text-xs text-[#6a7282]">
                {nextMeeting?.agenda
                  ? nextMeeting.agenda
                  : "Dr. Kemal Arslan · Kullanıcı Araştırması & Test Metodolojisi"}
              </p>
              <p className="mt-1 text-xs text-[#8a8a8a]">
                {nextMeeting
                  ? `${formatMeetingDate(nextMeeting.scheduledAt)} · (${nextMeeting.durationMinutes} dk)`
                  : "Pzt, 12 Ağustos 2026 · 14:00 · Online"}
              </p>
              {nextMeeting?.meetLink && (
                <a
                  href={nextMeeting.meetLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-xs font-medium text-blue-600 underline"
                >
                  Toplantı Linki →
                </a>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <SecondaryButton href="/meetings/research/prepare">
              Hazırlan
            </SecondaryButton>
            <PrimaryButton href="/meetings/research">
              Toplantı Detayları
            </PrimaryButton>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_328px]">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#99a1af]">
                Mentorluk Taleplerim
              </h2>
              <span className="text-xs text-[#6a7282] underline underline-offset-2">
                Tümünü gör
              </span>
            </div>
            <div className="space-y-3">
              {requests.length ? (
                requests.slice(0, 3).map((request) => (
                  <Link
                    key={request.id}
                    href={`/mentor-request/status?request=${request.id}`}
                    className="flex items-start gap-4 rounded-lg border border-[#e5e7eb] bg-white p-4 sm:items-center"
                  >
                    <Avatar
                      initials={request.mentorName
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-[#171717]">
                        {request.supportArea}
                      </h3>
                      <p className="mt-0.5 text-xs text-[#6a7282]">
                        {request.mentorName}
                      </p>
                      <div className="mt-2">
                        <Badge>
                          {requestStatusLabels[request.status] ??
                            request.status}
                        </Badge>
                      </div>
                    </div>
                    <span className="text-xs text-[#aaa]">
                      {formatMeetingDate(request.createdAt)}
                    </span>
                  </Link>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-[#d1d5db] bg-white p-6 text-sm text-[#777]">
                  Bu hesap için henüz mentorluk talebi yok.
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <section id="notifications">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#99a1af]">
                Bildirimler
              </h2>
              <div className="rounded-lg bg-white px-3">
                {requests.slice(0, 3).map((request) => (
                  <div
                    key={request.id}
                    className="flex gap-2 border-b border-[#e5e7eb] py-3 last:border-0"
                  >
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#999]" />
                    <div>
                      <p className="text-xs text-[#555]">
                        {request.mentorName}:{" "}
                        {requestStatusLabels[request.status] ?? request.status}
                      </p>
                      <p className="mt-1 text-xs text-[#aaa]">
                        {request.supportArea}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#99a1af]">
                Mentor Talepleri
              </h2>
              <div className="space-y-2">
                {requests.slice(0, 2).map((request) => (
                  <Link
                    key={request.id}
                    href={`/mentor-request/status?request=${request.id}`}
                    className="flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white p-3"
                  >
                    <Avatar
                      initials={request.mentorName
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                      size="sm"
                    />
                    <span className="flex-1 text-xs">{request.mentorName}</span>
                    <Badge>
                      {requestStatusLabels[request.status] ?? request.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-[#e0e7ff] bg-white p-3">
              <h2 className="text-xs font-semibold">Profil Tamamlama</h2>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e5e7eb]">
                <div className="h-full w-[72%] rounded-full bg-[#777]" />
              </div>
              <p className="mt-2 text-[11px] text-[#555]">
                %72 tamamlandı — 2 alan eksik
              </p>
              <button type="button" className="mt-2 text-[11px] font-medium">
                Profili Tamamla →
              </button>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
