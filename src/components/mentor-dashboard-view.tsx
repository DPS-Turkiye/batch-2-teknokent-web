"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import { useMentorDashboard } from "@/hooks/use-mentor-dashboard";
import { ActionItemStatus, type ActionItem } from "@/interfaces/action-item";
import { isOverdueActionItem } from "@/lib/mentor-dashboard";
import {
  MentorDecisionMode,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import { formatMeetingShort, formatSlotDateTime } from "@/lib/format";
import { initials as toInitials } from "@/lib/utils";
import { AppArea } from "@/types/app-area";

const ACTION_ITEM_LABELS: Record<ActionItemStatus, string> = {
  [ActionItemStatus.Open]: "Açık",
  [ActionItemStatus.InProgress]: "Devam ediyor",
  [ActionItemStatus.Completed]: "Tamamlandı",
  [ActionItemStatus.Cancelled]: "İptal edildi",
};

const ACTION_ITEM_TONES: Record<
  ActionItemStatus,
  "blue" | "amber" | "gray" | "green"
> = {
  [ActionItemStatus.Open]: "amber",
  [ActionItemStatus.InProgress]: "blue",
  [ActionItemStatus.Completed]: "green",
  [ActionItemStatus.Cancelled]: "gray",
};

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
  startup,
  detail,
  chip,
  action,
  href,
}: {
  icon: "star" | "paper";
  startup: string;
  detail: string;
  chip: string;
  action: string;
  href: string;
}) {
  return (
    <div className="flex min-h-[67px] items-center justify-between gap-4 rounded-[20px] border border-[#e4e7ea] bg-white px-4 py-[14px]">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#f2f8fc]">
          <FigmaIcon name={icon} size={16} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-medium leading-5">
            {startup}
          </p>
          <p className="truncate text-xs leading-[17px] text-[#676e78]">
            {detail}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-[10px]">
        <Chip tone="amber">{chip}</Chip>
        <PillButton primary href={href}>
          {action}
        </PillButton>
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
  person?: string;
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
            {[startup, person].filter(Boolean).join(" · ")}
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
  href,
  actionItems,
  expanded,
  onToggle,
}: {
  name: string;
  initials: string;
  person: string;
  topic: string;
  progress: number | null;
  meta: string;
  href: string;
  actionItems: ActionItem[];
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
              {progress === null ? "—" : `%${progress}`}
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
      {progress === null ? null : (
        <div className="mt-[14px] h-1.5 overflow-hidden rounded-full bg-[#eceef0]">
          <div
            className="h-full rounded-full bg-[#26a4ff]"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      <div className="mt-[14px] flex flex-wrap items-center justify-between gap-2 text-xs leading-[17px] text-[#676e78]">
        <span>{meta}</span>
        <Link href={href} className="font-medium text-[#26a4ff]">
          Mentorluğa git →
        </Link>
      </div>
      {expanded ? (
        <div className="mt-[14px] border-t border-[#eceef0] pt-[14px]">
          <div className="mb-[10px] flex items-center justify-between text-[12.5px] leading-[18px]">
            <h4 className="font-semibold text-[#4a5059]">Atanan işler</h4>
            <Link href={href} className="font-medium text-[#26a4ff]">
              Yeni iş ata
            </Link>
          </div>
          {actionItems.length === 0 ? (
            <p className="text-[12px] text-[#858c96]">
              Bu mentorlukta atanmış iş yok.
            </p>
          ) : (
            <div className="space-y-2">
              {actionItems.map((item) => (
                <DetailRow
                  key={item.id}
                  title={item.title}
                  detail={
                    item.dueDate
                      ? `Teslim ${formatSlotDateTime(item.dueDate)}`
                      : (item.ownerName ?? "Atanan iş")
                  }
                  status={ACTION_ITEM_LABELS[item.status]}
                  tone={ACTION_ITEM_TONES[item.status]}
                />
              ))}
            </div>
          )}
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
  role?: string;
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
              {[person, role].filter(Boolean).join(" · ")}
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
  href,
}: {
  title: string;
  startup: string;
  meeting: string;
  time: string;
  action: string;
  href: string;
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
      <Link
        href={href}
        className="mt-[10px] flex min-h-[34px] w-full items-center justify-center rounded-full bg-[#26a4ff] px-[14px] text-[12.5px] font-medium text-white"
      >
        {action}
      </Link>
    </article>
  );
}

function RequestDrawer({
  request,
  onClose,
  onDecide,
  isPending,
}: {
  request: MentorshipRequest;
  onClose: () => void;
  onDecide: (mode: MentorDecisionMode) => void;
  isPending: boolean;
}) {
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
  const snapshot = request.recommendationSnapshot;
  const startup =
    request.organizationName ?? request.requesterName ?? "Startup";
  const context = [snapshot?.startupStage, snapshot?.startupSector].filter(
    Boolean,
  );
  const focusAreas = [
    request.supportArea,
    ...(snapshot?.startupTechnologies ?? []),
  ].filter(Boolean);
  const sections = [
    ["STARTUP", snapshot?.startupSummary],
    ["MENTORLUK İHTİYACI", request.summary],
  ].filter(([, copy]) => Boolean(copy));
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
                {toInitials(startup) || "MN"}
              </span>
              <div>
                <h3 className="text-[17px] font-semibold leading-[26px]">
                  {startup}
                </h3>
                {request.requesterName ? (
                  <p className="text-[12.5px] leading-[19px] text-[#676e78]">
                    {request.requesterName}
                  </p>
                ) : null}
              </div>
            </div>
            <Chip>Yeni</Chip>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-[#f5faff] bg-[#f2f8fc] px-3 py-[10px] text-xs leading-[18px]">
            <span className="text-[#4a5059]">{context.join(" · ")}</span>
            <span className="text-[#676e78]">
              Talep: {formatSlotDateTime(request.createdAt)}
            </span>
          </div>
          {sections.map(([label, copy]) => (
            <div key={label}>
              <h4 className="text-[11px] font-semibold leading-[17px] text-[#858c96]">
                {label}
              </h4>
              <p className="mt-1.5 text-[13px] leading-5 text-[#4a5059]">
                {copy}
              </p>
            </div>
          ))}
          {focusAreas.length ? (
            <div>
              <h4 className="text-[11px] font-semibold leading-[17px] text-[#858c96]">
                ODAK ALANI
              </h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {focusAreas.map((area) => (
                  <Chip key={area}>{area}</Chip>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <footer className="flex gap-[10px] px-7 pb-5 pt-4">
          <PillButton onClick={() => onDecide(MentorDecisionMode.Decline)}>
            Reddet
          </PillButton>
          <PillButton soft href="/mentor-dashboard/messages">
            Mesaj gönder
          </PillButton>
          <button
            type="button"
            disabled={isPending}
            onClick={() => onDecide(MentorDecisionMode.Accept)}
            className="min-h-[39px] flex-1 rounded-full bg-[#26a4ff] px-4 text-[12.5px] font-medium text-white disabled:bg-[#c9cdd2]"
          >
            Mentorluğu kabul et
          </button>
        </footer>
      </section>
    </div>
  );
}

function ListNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-[20px] border border-[#e4e7ea] bg-white px-[18px] py-5 text-center text-xs leading-[18px] text-[#858c96]">
      {children}
    </p>
  );
}

export function MentorDashboardView() {
  const {
    firstName,
    pending,
    accepted,
    mentorships,
    openActionItems,
    awaitingReview,
    isLoadingActionItems,
    upcomingMeetings,
    requestsQuery,
    meetingsQuery,
    decision,
  } = useMentorDashboard();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const selectedRequest = decision.selectedRequest;
  const detailedState = Boolean(expandedId) || Boolean(selectedRequest);

  async function handleDecide(mode: MentorDecisionMode) {
    if (await decision.submitDecision(mode)) decision.closeDecision();
  }

  return (
    <AppShell active={AppArea.MentorDashboard} mentorHome>
      <div className="mx-auto w-full max-w-[1228px] px-4 pb-[72px] pt-3 sm:px-6 xl:px-0">
        <header
          className={`flex items-center justify-between gap-6 ${detailedState ? "min-h-16" : "min-h-[41px]"}`}
        >
          <div>
            <h1 className="text-[28px] font-semibold leading-[41px] text-[#22262b]">
              Günaydın, {firstName}
            </h1>
            {detailedState ? (
              <p className="mt-1 text-[13px] leading-[19px] text-[#676e78]">
                {accepted.length} aktif mentorluk · {pending.length} yeni talep
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
              <SectionHeading
                action={
                  <Link href="/mentorships">
                    Tümü ({openActionItems.length})
                  </Link>
                }
              >
                Bugün aksiyon bekleyen
              </SectionHeading>
              <div className="space-y-[10px]">
                {isLoadingActionItems ? (
                  <ListNote>Yükleniyor...</ListNote>
                ) : openActionItems.length === 0 ? (
                  <ListNote>Bekleyen bir iş yok.</ListNote>
                ) : (
                  openActionItems.slice(0, 4).map((item) => {
                    const overdue = isOverdueActionItem(item);
                    return (
                      <ActionRow
                        key={item.id}
                        icon={overdue ? "paper" : "star"}
                        startup={item.organizationName ?? "Mentorluk"}
                        detail={item.title}
                        chip={
                          overdue ? "Gecikti" : ACTION_ITEM_LABELS[item.status]
                        }
                        action="Aç"
                        href="/mentorships"
                      />
                    );
                  })
                )}
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
                {meetingsQuery.isLoading ? (
                  <ListNote>Yükleniyor...</ListNote>
                ) : upcomingMeetings.length === 0 ? (
                  <ListNote>Yaklaşan görüşme bulunmuyor.</ListNote>
                ) : (
                  upcomingMeetings.map((meeting) => (
                    <MeetingCard
                      key={meeting.id}
                      startup={meeting.organizationName ?? "Mentorluk"}
                      title={meeting.agenda ?? "Mentorluk görüşmesi"}
                      when={`${formatMeetingShort(meeting.scheduledAt)}${
                        meeting.durationMinutes
                          ? ` · ${meeting.durationMinutes} dk`
                          : ""
                      }`}
                      chip="Planlandı"
                      join={Boolean(meeting.meetLink)}
                    />
                  ))
                )}
              </div>
            </section>
            <section>
              <SectionHeading
                action={<Link href="/mentorships">Tüm mentorluklar →</Link>}
              >
                Startup çalışmaları
              </SectionHeading>
              <div className="space-y-[10px]">
                {requestsQuery.isLoading ? (
                  <ListNote>Yükleniyor...</ListNote>
                ) : mentorships.length === 0 ? (
                  <ListNote>Aktif mentorluk yok.</ListNote>
                ) : (
                  mentorships.map(
                    ({
                      request,
                      actionItems,
                      openCount,
                      overdueCount,
                      progress,
                    }) => {
                      const startup =
                        request.organizationName ??
                        request.requesterName ??
                        "Startup";
                      return (
                        <StartupCard
                          key={request.id}
                          name={startup}
                          initials={toInitials(startup) || "MN"}
                          person={request.requesterName ?? ""}
                          topic={request.supportArea}
                          progress={progress}
                          actionItems={actionItems}
                          href={`/mentor-dashboard/mentorship/${encodeURIComponent(request.id)}`}
                          meta={`${openCount} açık iş${
                            overdueCount ? ` · ${overdueCount} geciken` : ""
                          }`}
                          expanded={expandedId === request.id}
                          onToggle={() =>
                            setExpandedId((current) =>
                              current === request.id ? null : request.id,
                            )
                          }
                        />
                      );
                    },
                  )
                )}
              </div>
            </section>
          </div>
          <aside className="min-w-0 space-y-6">
            <section>
              <SectionHeading
                action={
                  <button type="button">Tümü ({pending.length}) →</button>
                }
              >
                Mentorluk talepleri
              </SectionHeading>
              <div className="space-y-[10px]">
                {requestsQuery.isLoading ? (
                  <ListNote>Yükleniyor...</ListNote>
                ) : pending.length === 0 ? (
                  <ListNote>Bekleyen mentorluk talebi yok.</ListNote>
                ) : (
                  pending.map((request) => {
                    const startup =
                      request.organizationName ??
                      request.requesterName ??
                      "Startup";
                    return (
                      <RequestCard
                        key={request.id}
                        name={startup}
                        initials={toInitials(startup) || "MN"}
                        person={request.requesterName ?? ""}
                        areas={request.supportArea}
                        message={request.summary ?? ""}
                        time={formatSlotDateTime(request.createdAt)}
                        fresh
                        onReview={() => decision.selectRequest(request)}
                      />
                    );
                  })
                )}
              </div>
            </section>
            <section>
              <SectionHeading>Değerlendirme bekleyen görüşmeler</SectionHeading>
              <div className="space-y-[10px]">
                {meetingsQuery.isLoading ? (
                  <ListNote>Yükleniyor...</ListNote>
                ) : awaitingReview.length === 0 ? (
                  <ListNote>Değerlendirme bekleyen görüşme yok.</ListNote>
                ) : (
                  awaitingReview
                    .slice(0, 4)
                    .map((meeting) => (
                      <ReminderCard
                        key={meeting.id}
                        title={
                          meeting.outcomes?.trim()
                            ? "Not eklenmedi"
                            : "Değerlendirme bekliyor"
                        }
                        startup={meeting.organizationName ?? "Mentorluk"}
                        meeting={meeting.agenda ?? "Mentorluk görüşmesi"}
                        time={formatSlotDateTime(meeting.scheduledAt)}
                        action={
                          meeting.outcomes?.trim()
                            ? "Görüşme notu ekle"
                            : "Değerlendirmeyi tamamla"
                        }
                        href="/mentor-dashboard/calendar"
                      />
                    ))
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
      {selectedRequest ? (
        <RequestDrawer
          request={selectedRequest}
          onClose={decision.closeDecision}
          onDecide={handleDecide}
          isPending={decision.isPending}
        />
      ) : null}
    </AppShell>
  );
}
