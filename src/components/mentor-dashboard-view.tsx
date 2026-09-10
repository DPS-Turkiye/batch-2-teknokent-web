"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import { AppArea } from "@/types/app-area";

const asset = (name: string) => `/mentor-dashboard/revised/${name}.svg`;

function FigmaIcon({ name, size = 16 }: { name: string; size?: number }) {
  return <Image src={asset(name)} alt="" width={size} height={size} />;
}

function PillButton({
  children,
  href,
  primary = false,
  soft = false,
  onClick,
}: {
  children: ReactNode;
  href?: string;
  primary?: boolean;
  soft?: boolean;
  onClick?: () => void;
}) {
  const className = `inline-flex min-h-[34px] items-center justify-center rounded-full px-[14px] text-[12.5px] font-medium transition ${primary ? "bg-[#26a4ff] text-white hover:bg-[#1598ef]" : soft ? "border border-[#f5faff] bg-[#f2f8fc] text-[#26a4ff] hover:bg-[#e8f4fc]" : "border border-[#d4d8dd] bg-white text-[#4a5059] hover:bg-[#f8f9fa]"}`;
  if (href)
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  return (
    <button type="button" className={className} onClick={onClick}>
      {children}
    </button>
  );
}

function Chip({
  children,
  tone = "blue",
}: {
  children: ReactNode;
  tone?: "blue" | "amber" | "gray" | "green";
}) {
  const tones = {
    blue: "border-[#f5faff] bg-[#f2f8fc] text-[#26a4ff]",
    amber: "border-[#f2ddbe] bg-[#fef6ec] text-[#a65a15]",
    gray: "border-[#e4e7ea] bg-[#f3f4f6] text-[#676e78]",
    green: "border-[#cbebda] bg-[#eefaf3] text-[#0f7a4d]",
  };
  return (
    <span
      className={`inline-flex rounded-full border px-[10px] py-1 text-[11.5px] font-medium leading-[17px] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function SectionHeading({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-[10px] flex min-h-[22px] items-center justify-between gap-4">
      <h2 className="text-[15px] font-semibold leading-[22px] text-[#22262b]">
        {children}
      </h2>
      {action ? (
        <div className="text-[12.5px] font-medium text-[#26a4ff]">{action}</div>
      ) : null}
    </div>
  );
}

function QuickAction({
  icon,
  title,
  detail,
  selected = false,
  href,
}: {
  icon: string;
  title: string;
  detail: string;
  selected?: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`flex min-h-[67px] min-w-0 flex-1 items-center gap-3 rounded-[20px] px-4 py-[14px] transition hover:border-[#26a4ff] ${selected ? "bg-[#f2f8fc]" : "border border-[#e4e7ea] bg-white"}`}
    >
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-lg ${selected ? "bg-[#26a4ff]" : "border border-[#f5faff] bg-white"}`}
      >
        <FigmaIcon name={icon} size={18} />
      </span>
      <span className="min-w-0">
        <strong className="block truncate text-[13.5px] font-medium leading-5 text-[#22262b]">
          {title}
        </strong>
        <span className="block truncate text-xs leading-[17px] text-[#676e78]">
          {detail}
        </span>
      </span>
    </Link>
  );
}

function ActionRow({
  icon,
  detail,
  chip,
  action,
}: {
  icon: "star" | "paper";
  detail: string;
  chip: string;
  action: string;
}) {
  return (
    <div className="flex min-h-[67px] items-center justify-between gap-4 rounded-[20px] border border-[#e4e7ea] bg-white px-4 py-[14px]">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#f2f8fc]">
          <FigmaIcon name={icon} size={16} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-medium leading-5">
            Döngü · Gülse
          </p>
          <p className="truncate text-xs leading-[17px] text-[#676e78]">
            {detail}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-[10px]">
        <Chip tone="amber">{chip}</Chip>
        <PillButton primary>{action}</PillButton>
      </div>
    </div>
  );
}

function MeetingCard({
  startup,
  person,
  title,
  when,
  chip,
  join = false,
}: {
  startup: string;
  person: string;
  title: string;
  when: string;
  chip: string;
  join?: boolean;
}) {
  return (
    <article className="rounded-[20px] border border-[#e4e7ea] bg-white px-[18px] py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[12.5px] leading-[19px] text-[#676e78]">
            {startup} · {person}
          </p>
          <h3 className="mt-[3px] text-[15px] font-semibold leading-[22px]">
            {title}
          </h3>
        </div>
        <Chip tone={join ? "blue" : "gray"}>{chip}</Chip>
      </div>
      <div className="mt-[10px] flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-xs leading-[18px] text-[#676e78]">
          <FigmaIcon name="clock" size={14} /> {when}
        </span>
        <div className="flex gap-2">
          <PillButton href="/mentor-dashboard/messages">Mesaj</PillButton>
          <PillButton href="/mentor-dashboard/calendar" primary>
            {join ? "Toplantıya katıl" : "Detay"}
          </PillButton>
        </div>
      </div>
    </article>
  );
}

const tasks = [
  [
    "Güncellenmiş kullanıcı akışı",
    "Dosya · Teslim 11 Eyl · Gülse",
    "Gecikti",
    "amber",
  ],
  [
    "Revize prototip",
    "Dosya · Teslim 14 Eyl · Gülse",
    "İnceleme bekliyor",
    "blue",
  ],
  [
    "Kullanılabilirlik testi bulguları",
    "Ödev · Teslim 20 Eyl · Gülse",
    "Devam ediyor",
    "gray",
  ],
] as const;
const files = [
  ["onboarding-v4.fig", "Gülse yükledi · 8,2 MB · dün", "Yüklendi", "green"],
  ["kullanici-akisi-v2.pdf", "Nihan talep etti · 11 Eyl", "Bekliyor", "amber"],
] as const;

function DetailRow({
  title,
  detail,
  status,
  tone,
}: {
  title: string;
  detail: string;
  status: string;
  tone: "blue" | "amber" | "gray" | "green";
}) {
  return (
    <div className="flex min-h-[58px] items-center justify-between gap-4 rounded-lg border border-[#e4e7ea] bg-white px-3 py-[10px]">
      <div className="flex min-w-0 items-center gap-[10px]">
        <FigmaIcon name="paper" size={16} />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium leading-[19px]">
            {title}
          </p>
          <p className="truncate text-[11.5px] leading-[17px] text-[#676e78]">
            {detail}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Chip tone={tone}>{status}</Chip>
        <FigmaIcon name="chevron-right" size={16} />
      </div>
    </div>
  );
}

function StartupCard({
  name,
  initials,
  person,
  topic,
  progress,
  meta,
  expanded,
  onToggle,
}: {
  name: string;
  initials: string;
  person: string;
  topic: string;
  progress: number;
  meta: string;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-[#e4e7ea] bg-white px-[18px] py-4">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 text-left"
        aria-expanded={expanded}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#e6f1f8] text-xs font-semibold text-[#26a4ff]">
            {initials}
          </span>
          <span className="min-w-0">
            <strong className="block truncate text-[15px] font-semibold leading-[22px]">
              {name}
            </strong>
            <span className="block truncate text-xs leading-[17px] text-[#676e78]">
              {person} · {topic}
            </span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-[10px]">
          <span className="text-right">
            <strong className="block text-[15px] font-semibold leading-[22px]">
              %{progress}
            </strong>
            <span className="block text-[11px] leading-4 text-[#858c96]">
              Mentorluk ilerlemesi
            </span>
          </span>
          <FigmaIcon
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
          />
        </span>
      </button>
      <div className="mt-[14px] h-1.5 overflow-hidden rounded-full bg-[#eceef0]">
        <div
          className="h-full rounded-full bg-[#26a4ff]"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-[14px] flex flex-wrap items-center justify-between gap-2 text-xs leading-[17px] text-[#676e78]">
        <span>{meta}</span>
        <Link href="/mentorships" className="font-medium text-[#26a4ff]">
          Mentorluğa git →
        </Link>
      </div>
      {expanded ? (
        <div className="mt-[14px] border-t border-[#eceef0] pt-[14px]">
          <div className="mb-[10px] flex items-center justify-between text-[12.5px] leading-[18px]">
            <h4 className="font-semibold text-[#4a5059]">Atanan işler</h4>
            <button type="button" className="font-medium text-[#26a4ff]">
              Yeni iş ata
            </button>
          </div>
          <div className="space-y-2">
            {tasks.map(([title, detail, status, tone]) => (
              <DetailRow
                key={title}
                title={title}
                detail={detail}
                status={status}
                tone={tone}
              />
            ))}
          </div>
          <div className="my-[14px] border-t border-[#eceef0]" />
          <div className="mb-[10px] flex items-center justify-between text-[12.5px] leading-[18px]">
            <h4 className="font-semibold text-[#4a5059]">Dosyalar</h4>
            <button type="button" className="font-medium text-[#26a4ff]">
              Dosya iste
            </button>
          </div>
          <div className="space-y-2">
            {files.map(([title, detail, status, tone]) => (
              <DetailRow
                key={title}
                title={title}
                detail={detail}
                status={status}
                tone={tone}
              />
            ))}
          </div>
          <div className="mt-[18px] flex gap-2">
            <PillButton href="/mentor-dashboard/messages">
              Mesaj gönder
            </PillButton>
            <PillButton href="/mentor-dashboard/calendar" primary>
              Toplantı planla
            </PillButton>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function RequestCard({
  name,
  initials,
  person,
  role,
  areas,
  message,
  time,
  fresh,
  onReview,
}: {
  name: string;
  initials: string;
  person: string;
  role: string;
  areas: string;
  message: string;
  time: string;
  fresh?: boolean;
  onReview: () => void;
}) {
  return (
    <article className="rounded-[24px] border border-[#e4e7ea] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-[10px]">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#e6f1f8] text-[11px] font-semibold text-[#26a4ff]">
            {initials}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-[13.5px] font-medium leading-5">
              {name}
            </h3>
            <p className="truncate text-[11.5px] leading-[17px] text-[#676e78]">
              {person} · {role}
            </p>
          </div>
        </div>
        <Chip tone={fresh ? "blue" : "gray"}>
          {fresh ? "Yeni" : "İncelendi"}
        </Chip>
      </div>
      <p className="mt-[10px] text-xs leading-[17px] text-[#676e78]">{areas}</p>
      <p className="mt-[10px] text-xs leading-[17px] text-[#4a5059]">
        “{message}”
      </p>
      <div className="mt-[10px] flex items-center justify-between gap-3">
        <time className="text-[11.5px] leading-[17px] text-[#858c96]">
          {time}
        </time>
        <PillButton soft onClick={onReview}>
          Talebi incele
        </PillButton>
      </div>
    </article>
  );
}

function ReminderCard({
  title,
  startup,
  meeting,
  time,
  action,
}: {
  title: string;
  startup: string;
  meeting: string;
  time: string;
  action: string;
}) {
  return (
    <article className="rounded-[24px] border border-[#f5faff] bg-[#f2f8fc] p-4">
      <div className="flex items-center gap-2">
        <FigmaIcon name="star" size={16} />
        <h3 className="text-[13.5px] font-medium leading-5">{title}</h3>
      </div>
      <p className="mt-[10px] text-[12.5px] leading-[18px] text-[#4a5059]">
        {startup} — {meeting}
      </p>
      <p className="mt-[6px] text-[11.5px] leading-[17px] text-[#676e78]">
        {time}
      </p>
      <button
        type="button"
        className="mt-[10px] min-h-[34px] w-full rounded-full bg-[#26a4ff] px-[14px] text-[12.5px] font-medium text-white"
      >
        {action}
      </button>
    </article>
  );
}

function RequestDrawer({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", close);
    };
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#22262b]/35 px-4 py-[92px]"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-drawer-title"
        className="w-full max-w-[480px] border border-[#e4e7ea] bg-white shadow-[-8px_0_32px_rgba(0,0,0,0.12)]"
      >
        <header className="flex items-center justify-between px-7 pb-[18px] pt-[22px]">
          <h2
            id="request-drawer-title"
            className="text-base font-semibold leading-6"
          >
            Mentorluk talebi
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Talep detayını kapat"
          >
            <FigmaIcon name="close" size={20} />
          </button>
        </header>
        <div className="space-y-5 border-y border-[#eceef0] px-7 py-[22px]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-[10px] bg-[#e6f1f8] text-[13px] font-semibold text-[#26a4ff]">
                KV
              </span>
              <div>
                <h3 className="text-[17px] font-semibold leading-[26px]">
                  Kavun
                </h3>
                <p className="text-[12.5px] leading-[19px] text-[#676e78]">
                  Selin Kaya · Ürün Yöneticisi
                </p>
              </div>
            </div>
            <Chip>Yeni</Chip>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-[#f5faff] bg-[#f2f8fc] px-3 py-[10px] text-xs leading-[18px]">
            <span className="text-[#4a5059]">
              Pre-seed · 4 kişilik ekip · B2C
            </span>
            <span className="text-[#676e78]">Talep: Bugün 10:42</span>
          </div>
          {[
            [
              "STARTUP",
              "Kavun, günlük alışkanlıkları takip eden bir mobil ürün. 6 aydır yayında, 3.400 aktif kullanıcı. Şu an ilk 7 günde ciddi kullanıcı kaybı yaşıyorlar.",
            ],
            [
              "MENTORLUK İHTİYACI",
              "Onboarding akışını ve değer önerisini yeniden kurgulamak; hangi metriklerin takip edileceğine karar vermek.",
            ],
            [
              "NEDEN NİHAN?",
              "“UX stratejisi ve product validation alanındaki deneyiminiz, erken aşama ürünlerde doğru soruyu sormamıza yardımcı olur diye düşündük.”",
            ],
            [
              "BEKLENEN ÇIKTI",
              "6 haftalık süreçte yeniden kurgulanmış onboarding akışı ve test edilmiş bir değer önerisi.",
            ],
          ].map(([label, copy]) => (
            <div key={label}>
              <h4 className="text-[11px] font-semibold leading-[17px] text-[#858c96]">
                {label}
              </h4>
              <p className="mt-1.5 text-[13px] leading-5 text-[#4a5059]">
                {copy}
              </p>
            </div>
          ))}
          <div>
            <h4 className="text-[11px] font-semibold leading-[17px] text-[#858c96]">
              ODAK ALANI
            </h4>
            <div className="mt-2 flex flex-wrap gap-2">
              <Chip>UX Stratejisi</Chip>
              <Chip>Product Validation</Chip>
              <Chip>User Research</Chip>
            </div>
          </div>
          <div>
            <h4 className="text-[11px] font-semibold leading-[17px] text-[#858c96]">
              EKLENEN DOSYALAR
            </h4>
            <div className="mt-2 flex items-center justify-between rounded-lg border border-[#e4e7ea] px-3 py-[10px]">
              <div className="flex items-center gap-[10px]">
                <FigmaIcon name="paper" size={16} />
                <div>
                  <p className="text-[13px] font-medium leading-5">
                    kavun-metrikler.pdf
                  </p>
                  <p className="text-[11.5px] leading-[17px] text-[#676e78]">
                    Selin yükledi · 1,4 MB
                  </p>
                </div>
              </div>
              <FigmaIcon name="download" size={16} />
            </div>
          </div>
        </div>
        <footer className="flex gap-[10px] px-7 pb-5 pt-4">
          <PillButton onClick={onClose}>Reddet</PillButton>
          <PillButton soft href="/mentor-dashboard/messages">
            Mesaj gönder
          </PillButton>
          <button
            type="button"
            className="min-h-[39px] flex-1 rounded-full bg-[#26a4ff] px-4 text-[12.5px] font-medium text-white"
          >
            Mentorluğu kabul et
          </button>
        </footer>
      </section>
    </div>
  );
}

export function MentorDashboardView() {
  const [expanded, setExpanded] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const detailedState = expanded || requestOpen;
  return (
    <AppShell active={AppArea.MentorDashboard} mentorHome>
      <div className="mx-auto w-full max-w-[1228px] px-4 pb-[72px] pt-3 sm:px-6 xl:px-0">
        <header
          className={`flex items-center justify-between gap-6 ${detailedState ? "min-h-16" : "min-h-[41px]"}`}
        >
          <div>
            <h1 className="text-[28px] font-semibold leading-[41px] text-[#22262b]">
              Günaydın, Nihan
            </h1>
            {detailedState ? (
              <p className="mt-1 text-[13px] leading-[19px] text-[#676e78]">
                Bugün 2 iş aksiyonunu bekliyor · 3 aktif mentorluk · 2 yeni
                talep
              </p>
            ) : null}
          </div>
          <PillButton href="/mentor-profile">
            <span className="flex items-center gap-2">
              <FigmaIcon name="calendar" size={16} /> Müsaitliği yönet
            </span>
          </PillButton>
        </header>
        <div className="mt-7 grid gap-3 md:grid-cols-3">
          <QuickAction
            icon="calendar-fill"
            title="Toplantı planla"
            detail="Mentee ile yeni görüşme aç"
            selected
            href="/mentor-dashboard/calendar"
          />
          <QuickAction
            icon="message"
            title="Mesaj gönder"
            detail="Aktif mentiye hızlı mesaj"
            href="/mentor-dashboard/messages"
          />
          <QuickAction
            icon="paper"
            title="Dosya iste"
            detail="Startup’tan doküman talep et"
            href="/mentorships"
          />
        </div>
        <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,804px)_400px]">
          <div className="min-w-0 space-y-6">
            <section>
              <SectionHeading action={<button type="button">Tümü (2)</button>}>
                Bugün aksiyon bekleyen
              </SectionHeading>
              <div className="space-y-[10px]">
                <ActionRow
                  icon="star"
                  detail="UX Flow Review görüşmesi · değerlendirme bekliyor"
                  chip="Değerlendirme"
                  action="Değerlendir"
                />
                <ActionRow
                  icon="paper"
                  detail="“Güncellenmiş kullanıcı akışı” dosyası 2 gün gecikti"
                  chip="Gecikti"
                  action="Hatırlat"
                />
              </div>
            </section>
            <section>
              <SectionHeading
                action={
                  <Link href="/mentor-dashboard/calendar">
                    Tüm toplantılar →
                  </Link>
                }
              >
                Yaklaşan görüşmeler
              </SectionHeading>
              <div className="space-y-[10px]">
                <MeetingCard
                  startup="Döngü"
                  person="Gülse"
                  title="UX Research Review"
                  when="Yarın · 14:00 · 45 dk · Online"
                  chip="Yarın"
                  join
                />
                <MeetingCard
                  startup="Atlas AI"
                  person="Emir"
                  title="Product Discovery"
                  when="12 Eylül · 15:30 · 45 dk · Online"
                  chip="Planlandı"
                />
              </div>
            </section>
            <section>
              <SectionHeading
                action={<Link href="/mentorships">Tüm mentorluklar →</Link>}
              >
                Startup çalışmaları
              </SectionHeading>
              <div className="space-y-[10px]">
                <StartupCard
                  name="Döngü"
                  initials="DÖ"
                  person="Gülse"
                  topic="Product & UX Design"
                  progress={68}
                  meta="3 aktif iş · 2 bekleyen dosya · Sonraki görüşme 14 Eyl · 14:00"
                  expanded={expanded}
                  onToggle={() => setExpanded((value) => !value)}
                />
                <StartupCard
                  name="Atlas AI"
                  initials="AT"
                  person="Emir"
                  topic="Product Discovery"
                  progress={41}
                  meta="2 aktif iş · 1 bekleyen dosya · Sonraki görüşme 12 Eyl · 15:30"
                />
                <StartupCard
                  name="NovaTech"
                  initials="NV"
                  person="Deniz"
                  topic="Design System kurulumu"
                  progress={25}
                  meta="4 aktif iş · 3 bekleyen dosya · Sonraki görüşme 18 Eyl · 11:00"
                />
              </div>
            </section>
          </div>
          <aside className="min-w-0 space-y-6">
            <section>
              <SectionHeading
                action={<button type="button">Tümü (4) →</button>}
              >
                Mentorluk talepleri
              </SectionHeading>
              <div className="space-y-[10px]">
                <RequestCard
                  name="Kavun"
                  initials="KV"
                  person="Selin Kaya"
                  role="Ürün Yöneticisi"
                  areas="UX Stratejisi · Product Validation"
                  message="Erken kullanıcı testlerinden sonra ürün yönümüzü netleştirmek istiyoruz."
                  time="Bugün · 10:42"
                  fresh
                  onReview={() => setRequestOpen(true)}
                />
                <RequestCard
                  name="Terra"
                  initials="TR"
                  person="Mert Aydın"
                  role="Kurucu"
                  areas="Design Systems · UX/UI Review"
                  message="Tasarım sistemimizi kurarken ekipler arasında tutarlılık sorunu yaşıyoruz."
                  time="Dün · 16:20"
                  onReview={() => setRequestOpen(true)}
                />
              </div>
            </section>
            <section>
              <SectionHeading>Değerlendirme bekleyen görüşmeler</SectionHeading>
              <div className="space-y-[10px]">
                <ReminderCard
                  title="Değerlendirme bekliyor"
                  startup="Döngü · Gülse"
                  meeting="UX Flow Review"
                  time="5 Eylül · 14:00 · 45 dk"
                  action="Değerlendirmeyi tamamla"
                />
                <ReminderCard
                  title="Not eklenmedi"
                  startup="Atlas AI · Emir"
                  meeting="Product Discovery"
                  time="3 Eylül · 15:30 · 45 dk"
                  action="Görüşme notu ekle"
                />
              </div>
            </section>
          </aside>
        </div>
      </div>
      {requestOpen ? (
        <RequestDrawer onClose={() => setRequestOpen(false)} />
      ) : null}
    </AppShell>
  );
}
