"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileUp,
  Plus,
  Sparkles,
} from "lucide-react";

import { ActiveProgramPicker } from "@/components/dashboard/active-program-picker";
import { AppShell } from "@/components/hoc/app-shell";
import { SecondaryButton } from "@/components/common/secondary-button";
import { Badge } from "@/components/common/badge";
import { Avatar } from "@/components/common/avatar";
import { UpcomingMeetingsList } from "@/components/upcoming-meetings-list";
import { useDashboardNotifications } from "@/hooks/use-dashboard-notifications";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { DASHBOARD_REQUEST_STATUS_LABELS } from "@/lib/const";
import { formatSlotDateTime } from "@/lib/format";
import { initials } from "@/lib/utils";
import { AppArea } from "@/types/app-area";

export default function DashboardPage() {
  const { notifications } = useDashboardNotifications();
  const {
    activeRequests,
    displayName,
    isFallback,
    isLoading,
    nextMeeting,
    organizationName,
    pendingRequests,
    upcomingMeetings,
  } = useDashboardData();

  return (
    <AppShell active={AppArea.Home}>
      <div className="mx-auto w-full max-w-[1240px] space-y-8 px-4 pb-14 pt-8 sm:px-8 sm:pt-10">
        <div>
          <p className="text-sm font-medium text-[#e86f22]">
            Günaydın, {displayName}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-[30px]">
            Bugünkü mentorluk akışın
          </h1>
          <p className="mt-2 text-sm text-[#676e78]">
            {organizationName} için sıradaki adımları ve aktif süreçleri buradan
            yönet.
          </p>
        </div>

        {isFallback ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            Live data could not be loaded; showing demo data.
          </p>
        ) : null}

        <section className="overflow-hidden rounded-3xl bg-[#e86f22] text-white shadow-[0_16px_40px_rgba(232,111,34,.18)]">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
                <span className="size-2 animate-pulse rounded-full bg-white" />
                {isLoading ? "Toplantı yükleniyor" : "SIRADAKİ TOPLANTI"}
              </div>
              <h2 className="mt-3 text-2xl font-semibold">
                {nextMeeting?.agenda ?? "Yeni toplantını planla"}
              </h2>
              <p className="mt-2 text-sm text-white/85">
                {nextMeeting
                  ? `${formatSlotDateTime(nextMeeting.scheduledAt)} · ${nextMeeting.durationMinutes} dk`
                  : "Planlanmış toplantı bulunmuyor."}
              </p>
              {nextMeeting?.meetLink ? (
                <a
                  href={nextMeeting.meetLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm font-semibold text-white underline underline-offset-2"
                >
                  Google Meet
                </a>
              ) : nextMeeting ? (
                <p className="mt-2 text-sm text-white/85">
                  Görüşme biçimi belirtilmedi
                </p>
              ) : null}
              <div className="mt-5 flex flex-wrap gap-4 text-xs text-white/85">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4" />
                  Gündemi gözden geçir
                </span>
                <span className="flex items-center gap-1.5">
                  <FileUp className="size-4" />2 dosya yüklenmeli
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <SecondaryButton
                href="/meetings/research/prepare"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                Hazırlan
              </SecondaryButton>
              {nextMeeting?.meetLink ? (
                <a
                  href={nextMeeting.meetLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-[#c85816]"
                >
                  Toplantıya git <ArrowRight className="size-4" />
                </a>
              ) : (
                <Link
                  href="/meetings/research"
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-[#c85816]"
                >
                  Toplantıya git <ArrowRight className="size-4" />
                </Link>
              )}
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Hızlı işlemler</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Mentor bul", "Yeni bir uzmanla eşleş", "/mentor-request", Plus],
              [
                "Toplantıya hazırlan",
                "Gündem ve notlarını düzenle",
                "/meetings/research/prepare",
                Sparkles,
              ],
              [
                "Mentorluk taleplerim",
                "Taleplerinin durumunu izle",
                "/mentorships",
                FileUp,
              ],
            ].map(([label, description, href, Icon]) => (
              <Link
                key={label as string}
                href={href as string}
                className="group rounded-2xl border border-[#e4e7ea] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#f2b78f] hover:shadow-md"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-[#fdebdd] text-[#e86f22]">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-sm font-semibold">
                  {label as string}
                </h3>
                <p className="mt-1 text-xs leading-5 text-[#676e78]">
                  {description as string}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Aktif mentorluklar</h2>
              <Link
                href="/mentorships"
                className="text-xs font-semibold text-[#e86f22]"
              >
                Tümünü gör →
              </Link>
            </div>
            <div className="space-y-3">
              {activeRequests.length ? (
                activeRequests.slice(0, 3).map((request) => (
                  <Link
                    key={request.id}
                    href={`/mentor-request/status?id=${encodeURIComponent(request.id)}`}
                    className="flex items-center gap-4 rounded-2xl border border-[#e4e7ea] bg-white p-4 transition hover:border-[#f2b78f]"
                  >
                    <Avatar
                      initials={initials(request.mentorName) || "MN"}
                      tone="orange"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold">
                        {request.mentorName}
                      </h3>
                      <p className="mt-1 truncate text-xs text-[#676e78]">
                        {request.supportArea}
                      </p>
                    </div>
                    <Badge>
                      {DASHBOARD_REQUEST_STATUS_LABELS[request.status]}
                    </Badge>
                    <ArrowRight className="size-4 text-[#a4aab2]" />
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[#d6dade] bg-white p-8 text-center text-sm text-[#676e78]">
                  Henüz aktif bir mentorluk bulunmuyor.
                </div>
              )}
            </div>
            <div className="mb-4 mt-7 flex items-center justify-between">
              <h2 className="text-base font-semibold">Yaklaşanlar</h2>
              <Link
                href="/calendar"
                className="text-xs font-semibold text-[#e86f22]"
              >
                Takvim →
              </Link>
            </div>
            <UpcomingMeetingsList
              meetings={
                upcomingMeetings.length
                  ? upcomingMeetings
                  : nextMeeting
                    ? [nextMeeting]
                    : []
              }
              emptyLabel="Yaklaşan etkinlik bulunmuyor."
              counterpartOf={(meeting) => meeting.mentorName}
            />
          </section>
          <aside className="space-y-5">
            <ActiveProgramPicker />
            <section className="rounded-2xl border border-[#e4e7ea] bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Bugünkü görevler</h2>
                <span className="rounded-full bg-[#fdebdd] px-2 py-1 text-[10px] font-semibold text-[#c85816]">
                  3 görev
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  "Toplantı gündemini tamamla",
                  "Ürün sunumunu yükle",
                  "Mentor sorusunu yanıtla",
                ].map((task, index) => (
                  <div key={task} className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 grid size-5 place-items-center rounded-full border ${index === 0 ? "border-[#e86f22] bg-[#fdebdd] text-[#e86f22]" : "border-[#d6dade]"}`}
                    >
                      {index === 0 ? <CheckCircle2 className="size-3" /> : null}
                    </span>
                    <div>
                      <p className="text-xs font-medium">{task}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[#858c96]">
                        <Clock3 className="size-3" />
                        Bugün
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-[#e4e7ea] bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">
                  Bekleyen mentorluk talepleri
                </h2>
                <span className="rounded-full bg-[#fdebdd] px-2 py-1 text-[10px] font-semibold text-[#c85816]">
                  {pendingRequests.length}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {pendingRequests.slice(0, 2).map((request) => (
                  <Link
                    key={request.id}
                    href={
                      "/mentor-request/status?id=" +
                      encodeURIComponent(request.id)
                    }
                    className="flex items-center gap-3 rounded-xl border border-[#eef0f2] p-3 hover:border-[#f2b78f]"
                  >
                    <Avatar
                      initials={initials(request.mentorName) || "MN"}
                      size="sm"
                      tone="orange"
                    />
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-xs">
                        {request.mentorName}
                      </strong>
                      <small className="mt-0.5 block truncate text-[10px] text-[#858c96]">
                        {DASHBOARD_REQUEST_STATUS_LABELS[request.status]}
                      </small>
                    </span>
                    <ArrowRight className="size-4 text-[#a4aab2]" />
                  </Link>
                ))}
                {!pendingRequests.length ? (
                  <p className="py-3 text-center text-xs text-[#858c96]">
                    Bekleyen talep yok.
                  </p>
                ) : null}
              </div>
            </section>
            <section
              id="notifications"
              className="rounded-2xl border border-[#e4e7ea] bg-white p-5"
            >
              <h2 className="text-sm font-semibold">Bildirimler</h2>
              <div className="mt-3 divide-y divide-[#eef0f2]">
                {notifications.slice(0, 3).map((notification) => (
                  <div key={notification.title} className="flex gap-3 py-3">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#e86f22]" />
                    <div>
                      <p className="text-xs leading-5">{notification.title}</p>
                      <p className="mt-0.5 text-[10px] text-[#858c96]">
                        {notification.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
