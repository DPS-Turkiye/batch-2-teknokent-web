"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Search,
  Target,
  Upload,
  Video,
} from "lucide-react";
import { Avatar } from "@/components/common/avatar";
import { AppShell } from "@/components/hoc/app-shell";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { DASHBOARD_REQUEST_STATUS_LABELS } from "@/lib/const";
import { formatSlotDateTime } from "@/lib/format";
import { calendarDay, initials } from "@/lib/utils";
import { AppArea } from "@/types/app-area";

const actions = [
  ["Mentor bul", "Yeni ihtiyaç tanımla", "/mentor-request", "quick-mentor.png"],
  ["Toplantı planla", "Görüşme oluştur", "/calendar", "quick-calendar.png"],
  ["Dosya yükle", "Belge paylaş", "/mentorships", "quick-upload.png"],
  ["Mesaj gönder", "Mentorla konuş", "/messages", "quick-message.png"],
  ["Görevlerim", "Tümünü gör", "/mentorships", "quick-tasks.png"],
] as const;

const dateLabel = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("tr-TR", {
        day: "numeric",
        month: "long",
      }).format(calendarDay(value))
    : "Tarih yok";

export default function DashboardPage() {
  const data = useDashboardData();
  const expectedCount =
    data.pendingRequests.length + data.openActionItems.length;
  return (
    <AppShell active={AppArea.Home} menteeHome>
      <main className="mx-auto w-full max-w-[1180px] space-y-8 px-4 pb-16 pt-2 sm:px-8">
        {data.isFallback && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            Veriler yüklenemedi. Daha sonra yeniden dene.
          </p>
        )}
        <section className="relative min-h-[257px] overflow-hidden rounded-[32px] bg-[#fbf2ed] px-6 py-8 sm:px-9 sm:py-9">
          <Image
            src="/mentee-dashboard/revised/hero-background.png"
            alt=""
            fill
            priority
            className="object-cover object-center"
          />
          <div className="relative z-10 flex min-h-[185px] flex-col items-start justify-between">
            <div>
              <h1 className="text-[26px] font-semibold leading-[1.25] text-[#1e1f22]">
                Mentorluk Yolculuğuna Hazır Mısın?
              </h1>
              <p className="mt-1.5 text-[13px] text-[#3f3f3fd9]">
                İhtiyacını tanımla ve mentorunla eşleş!
              </p>
            </div>
            <Link
              href="/mentor-request"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#e86f22] px-4 text-[13.5px] font-semibold text-white shadow-sm hover:bg-[#d9631c]"
            >
              Doğru mentor ile buluş <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        <section>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold text-[#2b303a]">
              Hızlı İşlemler
            </h2>
            <div className="flex h-9 w-full items-center gap-2 rounded-xl border border-[#e4e7ea] bg-white px-3 sm:w-[280px]">
              <Search className="size-4 text-[#8d97a3]" />
              <span className="text-sm text-[#8d97a3]">
                Ne yapmak istiyorsun?
              </span>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {actions.map(([title, subtitle, href, asset], index) => (
              <Link
                key={title}
                href={href}
                className={`flex min-h-[89px] items-center gap-3 rounded-[20px] border p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${index === 0 ? "border-[#0067b1] bg-[#fff4ec]" : "border-[#e4e7ea] bg-white"}`}
              >
                <Image
                  src={`/mentee-dashboard/revised/${asset}`}
                  alt=""
                  width={56}
                  height={56}
                  className="size-14 shrink-0 object-contain"
                />
                <span>
                  <strong className="block text-[13.5px] font-semibold leading-5">
                    {title}
                  </strong>
                  <small className="block text-xs leading-[18px] text-[#838c99]">
                    {subtitle}
                  </small>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
          <div className="space-y-8">
            <section>
              <Title title="Senden Beklenenler" count={expectedCount} />
              <Panel
                empty={
                  !expectedCount &&
                  !data.isLoading &&
                  !data.isLoadingActionItems
                }
                emptyText="Şu anda bekleyen bir görevin yok."
              >
                {data.pendingRequests.slice(0, 2).map((request) => (
                  <Row
                    key={request.id}
                    href={`/mentor-request/status?id=${encodeURIComponent(request.id)}`}
                    icon={<Target />}
                    title="Mentor talebini takip et"
                    subtitle={`${request.mentorName} · ${request.supportArea}`}
                    badge={DASHBOARD_REQUEST_STATUS_LABELS[request.status]}
                  />
                ))}
                {data.openActionItems.slice(0, 4).map((item) => (
                  <Row
                    key={item.id}
                    href="/mentorships"
                    icon={<Upload />}
                    title={item.title}
                    subtitle={
                      item.organizationName ||
                      item.ownerName ||
                      "Mentorluk görevi"
                    }
                    badge={dateLabel(item.dueDate)}
                  />
                ))}
              </Panel>
            </section>
            <section>
              <Title
                title="Yaklaşanlar"
                href="/calendar"
                linkText="Takvimi aç"
              />
              <Panel
                empty={!data.upcomingMeetings.length && !data.isLoading}
                emptyText="Yaklaşan görüşme bulunmuyor."
              >
                {data.upcomingMeetings.slice(0, 3).map((meeting) => (
                  <div
                    key={meeting.id}
                    className="flex items-center gap-3 border-b border-[#eef0f3] px-4 py-3.5 last:border-0"
                  >
                    <IconBox>
                      <CalendarDays />
                    </IconBox>
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-sm font-medium">
                        {meeting.agenda || "Mentorluk görüşmesi"}
                      </strong>
                      <small className="text-xs text-[#566477]">
                        {formatSlotDateTime(meeting.scheduledAt)} ·{" "}
                        {meeting.mentorName}
                      </small>
                    </span>
                    {meeting.meetLink && (
                      <a
                        href={meeting.meetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#e5701d] px-3 text-xs font-semibold text-white"
                      >
                        <Video className="size-3.5" /> Katıl
                      </a>
                    )}
                  </div>
                ))}
              </Panel>
            </section>
          </div>
          <aside className="space-y-8">
            <section>
              <Title
                title="Aktif Mentorluklar"
                href="/mentorships"
                linkText="Tümünü gör"
              />
              <Panel
                empty={!data.activeRequests.length && !data.isLoading}
                emptyText="Henüz aktif mentorluk yok."
              >
                {data.activeRequests.slice(0, 3).map((request) => (
                  <Link
                    key={request.id}
                    href={`/mentor-request/status?id=${encodeURIComponent(request.id)}`}
                    className="flex items-center gap-3 border-b border-[#eef0f3] p-4 last:border-0 hover:bg-[#fcfcfd]"
                  >
                    <Avatar
                      initials={initials(request.mentorName) || "MN"}
                      tone="orange"
                    />
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-sm font-medium">
                        {request.mentorName}
                      </strong>
                      <small className="block truncate text-xs text-[#566477]">
                        {request.supportArea}
                      </small>
                    </span>
                    <ArrowRight className="size-4 text-[#7a828d]" />
                  </Link>
                ))}
              </Panel>
            </section>
            <section>
              <Title
                title="Bekleyen Mentorluk Talepleri"
                count={data.pendingRequests.length}
              />
              <Panel
                empty={!data.pendingRequests.length && !data.isLoading}
                emptyText="Bekleyen talep yok."
              >
                {data.pendingRequests.slice(0, 3).map((request) => (
                  <Row
                    key={request.id}
                    href={`/mentor-request/status?id=${encodeURIComponent(request.id)}`}
                    icon={<ClipboardList />}
                    title={request.mentorName}
                    subtitle={DASHBOARD_REQUEST_STATUS_LABELS[request.status]}
                  />
                ))}
              </Panel>
            </section>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}

function Title({
  title,
  count,
  href,
  linkText,
}: {
  title: string;
  count?: number;
  href?: string;
  linkText?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <h2 className="text-base font-semibold text-[#2b303a]">{title}</h2>
        {count !== undefined && (
          <span className="rounded-full bg-[#fdf3ec] px-2.5 py-1 text-xs text-[#c95c18]">
            {count}
          </span>
        )}
      </div>
      {href && (
        <Link href={href} className="text-xs font-medium text-[#0067b1]">
          {linkText}
        </Link>
      )}
    </div>
  );
}
function Panel({
  children,
  empty,
  emptyText,
}: {
  children: React.ReactNode;
  empty: boolean;
  emptyText: string;
}) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-[#e4e7ea] bg-white">
      {children}
      {empty && (
        <p className="p-7 text-center text-sm text-[#838c99]">{emptyText}</p>
      )}
    </div>
  );
}
function IconBox({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[#fff7f1] text-[#e5701d] [&_svg]:size-[18px]">
      {children}
    </span>
  );
}
function Row({
  href,
  icon,
  title,
  subtitle,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 border-b border-[#eef0f3] px-4 py-3.5 last:border-0 hover:bg-[#fcfcfd]"
    >
      <IconBox>{icon}</IconBox>
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-sm font-medium text-[#2b303a]">
          {title}
        </strong>
        <small className="mt-0.5 block truncate text-xs text-[#566477]">
          {subtitle}
        </small>
      </span>
      {badge && (
        <span className="hidden rounded-full bg-[#fdf3ec] px-2.5 py-1 text-xs text-[#c95c18] sm:block">
          {badge}
        </span>
      )}
      <ArrowRight className="size-4 text-[#4f515d]" />
    </Link>
  );
}
