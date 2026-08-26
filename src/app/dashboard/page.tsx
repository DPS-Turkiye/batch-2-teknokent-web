"use client";

import Link from "next/link";
import { Plus, Video } from "lucide-react";

import { AppShell } from "@/components/hoc/app-shell";
import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import { Badge } from "@/components/common/badge";
import { Avatar } from "@/components/common/avatar";
import { useDashboardNotifications } from "@/hooks/use-dashboard-notifications";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { initials } from "@/lib/utils";
import { AppArea } from "@/types/app-area";

const requestStatusLabels = {
  [MentorshipRequestStatus.Accepted]: "Kabul edildi",
  [MentorshipRequestStatus.Declined]: "Uygun değil",
  [MentorshipRequestStatus.MoreInfoRequested]: "Ek bilgi istendi",
  [MentorshipRequestStatus.Pending]: "Yanıt bekleniyor",
  [MentorshipRequestStatus.Withdrawn]: "Geri çekildi",
} satisfies Record<MentorshipRequestStatus, string>;

function formatMeetingDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function DashboardPage() {
  const { notifications } = useDashboardNotifications();
  const {
    displayName,
    isFallback,
    isLoading,
    nextMeeting,
    organizationName,
    requests,
  } = useDashboardData();

  return (
    <AppShell active={AppArea.Home}>
      <div className="mx-auto w-full max-w-[1208px] space-y-6 px-4 pb-6 pt-8 sm:px-8 sm:pt-14">
        <section className="flex min-h-44 flex-col justify-between gap-8 rounded-[24px] bg-[#45454d] p-6 text-white sm:h-[181px] sm:flex-row sm:items-start">
          <div>
            <h1 className="text-2xl font-semibold">
              Hoş geldin, {displayName}
            </h1>
            <p className="mt-1 text-sm font-semibold">
              {organizationName} · Teknokent Başlangıç Programı 2026
            </p>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/90">
              Mentorluk sürecinizi buradan takip edin. Yaklaşan toplantılarınızı
              görüntüleyin, hazırlıklarınızı tamamlayın ve yeni mentorluk
              talepleri oluşturun.
            </p>
          </div>
          <SecondaryButton
            href="/mentor-request"
            className="shrink-0 text-[#45454d] shadow-sm hover:bg-[#f5f5f5]"
          >
            <Plus className="mr-2 size-4" strokeWidth={2} aria-hidden />
            Mentorluk Talebi Oluştur
          </SecondaryButton>
        </section>

        {isFallback ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            Canlı veriler yüklenemedi; demo verileri gösteriliyor.
          </p>
        ) : null}

        <section className="flex flex-col gap-4 rounded-lg border border-[#e5e7eb] bg-white p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <span className="relative flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#f3f4f6] text-[#6a7282]">
              <Video className="size-4" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-[#171717]">
                {isLoading
                  ? "Yaklaşan toplantı yükleniyor"
                  : "Yaklaşan Toplantı"}
              </h2>
              <p className="mt-1 text-xs text-[#6a7282]">
                {nextMeeting?.agenda ?? "Planlanmış toplantı bulunmuyor"}
              </p>
              <p className="mt-1 text-xs text-[#8a8a8a]">
                {nextMeeting
                  ? `${formatMeetingDate(nextMeeting.scheduledAt)} · ${nextMeeting.meetLink ? "Online" : "Görüşme biçimi belirtilmedi"}`
                  : "Yeni bir toplantı planlandığında burada görünecek."}
              </p>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-[#6a7282]">
                <span>△ 2 dosya yüklenmeli</span>
                <span>△ 3 aksiyon tamamlanmadı</span>
              </div>
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
                Aktif Mentorluklar
              </h2>
              <Link
                href="/mentorships"
                className="text-xs text-[#6a7282] underline underline-offset-2"
              >
                Tümünü gör
              </Link>
            </div>
            <div className="space-y-3">
              {requests.slice(0, 2).map((request) => (
                <article
                  key={request.id}
                  className="flex items-start gap-4 rounded-lg border border-[#e5e7eb] bg-white p-4 sm:items-center"
                >
                  <Avatar initials={initials(request.mentorName) || "MN"} />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-[#171717]">
                      {request.supportArea}
                    </h3>
                    <p className="mt-0.5 text-xs text-[#6a7282]">
                      {request.mentorName}
                    </p>
                    <div className="mt-2">
                      <Badge>{requestStatusLabels[request.status]}</Badge>
                    </div>
                  </div>
                  <p className="text-left text-xs text-[#aaa] sm:text-right">
                    {new Intl.DateTimeFormat("tr-TR", {
                      dateStyle: "medium",
                    }).format(new Date(request.createdAt))}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <aside className="space-y-6">
            <section id="notifications">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#99a1af]">
                Bildirimler
              </h2>
              <div className="rounded-lg bg-white px-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.title}
                    className="flex gap-2 border-b border-[#e5e7eb] py-3 last:border-0"
                  >
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#999]" />
                    <div>
                      <p className="text-xs text-[#555]">
                        {notification.title}
                      </p>
                      <p className="mt-1 text-xs text-[#aaa]">
                        {notification.time}
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
                {requests.slice(0, 3).map((request) => (
                  <Link
                    key={request.id}
                    href={`/mentor-request/status?id=${encodeURIComponent(request.id)}`}
                    className="flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white p-3"
                  >
                    <Avatar
                      initials={initials(request.mentorName) || "MN"}
                      size="sm"
                    />
                    <span className="flex-1 text-xs">{request.mentorName}</span>
                    <Badge>{requestStatusLabels[request.status]}</Badge>
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
              <Link
                href="/profile"
                className="mt-2 inline-block text-[11px] font-medium text-[#4f39f6] hover:underline"
              >
                Profili Tamamla →
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
