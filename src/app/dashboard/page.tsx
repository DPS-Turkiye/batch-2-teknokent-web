"use client";

import Link from "next/link";
import { Plus, Video } from "lucide-react";

import { AppShell } from "@/components/hoc/app-shell";
import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import { Badge } from "@/components/common/badge";
import { Avatar } from "@/components/common/avatar";
import { useDashboardNotifications } from "@/hooks/use-dashboard-notifications";
import { AppArea } from "@/types/app-area";

export default function DashboardPage() {
  const { notifications } = useDashboardNotifications();

  return (
    <AppShell active={AppArea.Home}>
      <div className="mx-auto w-full max-w-[1208px] space-y-6 px-4 pb-6 pt-8 sm:px-8 sm:pt-14">
        <section className="flex min-h-44 flex-col justify-between gap-8 rounded-[24px] bg-[#45454d] p-6 text-white sm:h-[181px] sm:flex-row sm:items-start">
          <div>
            <h1 className="text-2xl font-semibold">Hoş geldin, Ayşe</h1>
            <p className="mt-1 text-sm font-semibold">
              NovaMed AI · Teknokent Başlangıç Programı 2024
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

        <section className="flex flex-col gap-4 rounded-lg border border-[#e5e7eb] bg-white p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <span className="relative flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#f3f4f6] text-[#6a7282]">
              <Video className="size-4" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-[#171717]">
                Yaklaşan Toplantı — 10 saat sonra
              </h2>
              <p className="mt-1 text-xs text-[#6a7282]">
                Dr. Kemal Arslan · Kullanıcı Araştırması &amp; Test Metodolojisi
              </p>
              <p className="mt-1 text-xs text-[#8a8a8a]">
                Pzt, 12 Ağustos 2024 · 14:00 · Online
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
              <span className="text-xs text-[#6a7282] underline underline-offset-2">
                Tümünü gör
              </span>
            </div>
            <div className="space-y-3">
              <article className="flex items-start gap-4 rounded-lg border border-[#e5e7eb] bg-white p-4 sm:items-center">
                <Avatar initials="DK" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-[#171717]">
                    Kullanıcı Araştırması &amp; Test
                  </h3>
                  <p className="mt-0.5 text-xs text-[#6a7282]">
                    Dr. Kemal Arslan
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-[#6a7282]">
                    <Badge>Devam Ediyor</Badge>
                    <span>•</span>
                    <span>2 açık aksiyon</span>
                  </div>
                </div>
                <div className="text-left text-xs sm:text-right">
                  <p className="text-[#aaa]">Son: 5 Ağustos</p>
                  <p className="mt-1 text-[#555]">3. toplantıyı planla</p>
                </div>
              </article>
              <article className="flex items-start gap-4 rounded-lg border border-[#e5e7eb] bg-white p-4 sm:items-center">
                <Avatar initials="SÖ" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-[#171717]">
                    İş Modeli Validasyonu
                  </h3>
                  <p className="mt-0.5 text-xs text-[#6a7282]">Selin Öztürk</p>
                  <div className="mt-2">
                    <Badge>Yanıt Bekleniyor</Badge>
                  </div>
                </div>
                <div className="text-left text-xs sm:text-right">
                  <p className="text-[#aaa]">Son: 1 Ağustos</p>
                  <p className="mt-1 text-[#555]">Mentor onayı bekleniyor</p>
                </div>
              </article>
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
                <Link
                  href="/mentor-request/status"
                  className="flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white p-3"
                >
                  <Avatar initials="AY" size="sm" />
                  <span className="flex-1 text-xs">Ahmet Yılmaz</span>
                  <Badge>Yanıt bekleniyor</Badge>
                </Link>
                <Link
                  href="/mentor-request/status?state=accepted"
                  className="flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white p-3"
                >
                  <Avatar initials="CD" size="sm" />
                  <span className="flex-1 text-xs">Can Demir</span>
                  <Badge> Kabul edildi</Badge>
                </Link>
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
