"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";

import { AssignTaskButton } from "@/components/mentor-dashboard/assign-task-button";
import { AppShell } from "@/components/hoc/app-shell";
import { MeetingProposalCards } from "@/components/meeting-proposal-cards";
import { MyProgramsPanel } from "@/components/dashboard/my-programs-panel";
import { useMentorDashboard } from "@/hooks/use-mentor-dashboard";
import { useMentorNextMeeting } from "@/hooks/use-mentor-next-meeting";
import { useMentorshipFiles } from "@/hooks/use-mentorship-files";
import { ActionItemStatus, type ActionItem } from "@/interfaces/action-item";
import type { MeetingItem } from "@/interfaces/meeting";
import { meetingDayLabel, meetingWhenLabel } from "@/lib/mentor-dashboard";
import {
  MentorDecisionMode,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import { formatMeetingShort, formatSlotDateTime } from "@/lib/format";
import { requestExpectedOutcome } from "@/lib/meeting-context";
import { parsePreferredSlotsFromMessage } from "@/lib/mentor-availability-days";
import { initials as toInitials } from "@/lib/utils";
import { AppArea } from "@/types/app-area";
import { mentorMeetingEvaluationHref } from "@/lib/mentor-evaluation";
import { mentorRequestStartupHref } from "@/lib/mentorship-workspace";

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
  tone?: "blue" | "amber" | "gray" | "green" | "orange";
}) {
  const tones = {
    blue: "border-[#f5faff] bg-[#f2f8fc] text-[#26a4ff]",
    amber: "border-[#f2ddbe] bg-[#fef6ec] text-[#a65a15]",
    gray: "border-[#e4e7ea] bg-[#f3f4f6] text-[#676e78]",
    green: "border-[#cbebda] bg-[#eefaf3] text-[#0f7a4d]",
    orange: "border-[#f97316] bg-[#fef9f2] text-[#f97316]",
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
  chip: string | null;
  action: string;
  href: string;
}) {
  return (
    <div className="flex min-h-[67px] items-center justify-between gap-4 px-4 py-[14px] not-last:border-b not-last:border-[#e4e7ea]">
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
        {chip ? <Chip tone="orange">{chip}</Chip> : null}
        <PillButton primary href={href}>
          {action}
        </PillButton>
      </div>
    </div>
  );
}

/** The next meeting, its Meet link and the transcript choice. */
function NextMeetingBanner({
  nextMeeting,
  startup,
  when,
}: {
  nextMeeting: MeetingItem;
  startup: string;
  when: string;
}) {
  const t = useTranslations("mentorHome.banner");
  const meeting = useMentorNextMeeting(nextMeeting);
  return (
    <section
      aria-label={t("label")}
      className="relative isolate overflow-hidden rounded-[20px] bg-[#26a4ff] px-4 py-[42px] sm:px-[47px]"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[1228px] w-[266px] -translate-x-1/2 -translate-y-1/2 -rotate-90 bg-[url('/mentor-dashboard/revised/next-meeting-bg.svg')] bg-cover"
      />
      <div className="rounded-[20px] border border-white/50 bg-black/10 px-[18px] py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex items-center gap-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-full border border-[#f2f2f2] bg-white text-[12px] font-semibold text-[#26a4ff]">
                {toInitials(startup) || "MN"}
              </span>
              <p className="truncate text-[13.5px] font-medium leading-5 text-white">
                {startup}
              </p>
            </div>
            <p className="max-w-[474px] text-sm leading-5 text-white">
              {t("hint")}
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <span className="flex items-center gap-1.5 text-[12.5px] leading-[18px] text-white">
              <FigmaIcon name="clock" size={14} /> {when}
            </span>
            {meeting.joinHref ? (
              <a
                href={meeting.joinHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[34px] items-center rounded-full bg-[#26a4ff] px-[14px] text-[12.5px]! font-medium! leading-[18px]! text-white"
              >
                {t("join")}
              </a>
            ) : null}
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-3">
          <input
            value={meeting.link}
            onChange={(event) => meeting.setLink(event.target.value)}
            onBlur={() => void meeting.saveLink()}
            disabled={meeting.isSaving}
            aria-label={t("linkLabel")}
            placeholder="http//"
            className="w-full rounded-xl bg-white p-[10px] text-sm! leading-5! text-[#22262b] placeholder:text-[#aeb4bc]"
          />
          <label className="flex items-center gap-2 text-sm leading-5 text-white">
            <input
              type="checkbox"
              checked={meeting.transcribeRequested}
              onChange={() => void meeting.toggleTranscript()}
              disabled={meeting.isSaving}
              className="size-[18px] rounded border border-[#d4d8dd] accent-[#26a4ff]"
            />
            {t("transcript")}
          </label>
        </div>
      </div>
    </section>
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
  const t = useTranslations("mentorHome.upcoming");
  return (
    <article className="flex min-w-0 flex-col gap-6 rounded-[20px] border border-[#e4e7ea] bg-white px-[18px] py-4">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium leading-[19px] text-[#676e78]">
            {[startup, person].filter(Boolean).join(" · ")}
          </p>
          <h3 className="mt-[3px] truncate text-[15px] font-semibold leading-[22px]">
            {title}
          </h3>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-[3px]">
          <Chip tone={join ? "blue" : "gray"}>{chip}</Chip>
          <span className="text-[12.5px] leading-[18px] text-[#676e78]">
            {when}
          </span>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <PillButton href="/mentor-dashboard/messages">
          {t("message")}
        </PillButton>
        <PillButton href="/mentor-dashboard/calendar" soft>
          {join ? t("join") : t("detail")}
        </PillButton>
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
  id,
  name,
  initials,
  person,
  topic,
  progress,
  ratio,
  href,
  actionItems,
  expanded,
  onToggle,
}: {
  id: string;
  name: string;
  initials: string;
  person: string;
  topic: string;
  progress: number | null;
  ratio: { done: number; total: number } | null;
  href: string;
  actionItems: ActionItem[];
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const t = useTranslations("mentorHome");
  const locale = useLocale();
  const { files, isLoading, hasFailed } = useMentorshipFiles(
    id,
    Boolean(expanded),
  );
  return (
    <article className="flex flex-col gap-[14px] overflow-hidden rounded-[20px] border border-[#e4e7ea] bg-white px-[18px] py-4">
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
          {expanded ? (
            <span className="text-[11px] leading-4 text-[#858c96]">
              {t("startups.progress")}
            </span>
          ) : null}
          <FigmaIcon
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
          />
        </span>
      </button>
      {progress === null ? null : (
        <div className="h-1.5 overflow-hidden rounded-full bg-[#eceef0]">
          <div
            className="h-full rounded-full bg-[#26a4ff]"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs leading-[17px] text-[#676e78]">
        <span>
          {ratio ? `${ratio.done}/${ratio.total}` : t("startups.noWork")}
        </span>
        <Link
          href={href}
          className="text-[12.5px]! font-medium! leading-[18px]! text-[#26a4ff]"
        >
          {t("startups.open")}
        </Link>
      </div>
      {expanded ? (
        <div className="flex flex-col gap-[14px] border-t border-[#eceef0] pt-[14px]">
          <div className="flex items-center justify-between text-[12.5px] leading-[18px]">
            <h4 className="font-semibold text-[#4a5059]">
              {t("startups.tasks")}
            </h4>
            <AssignTaskButton requestId={id} startupName={name} />
          </div>
          {actionItems.length === 0 ? (
            <p className="text-[12px] text-[#858c96]">
              {t("startups.noTasks")}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {actionItems.map((item) => (
                <DetailRow
                  key={item.id}
                  title={item.title}
                  detail={
                    item.dueDate
                      ? t("startups.due", {
                          date: formatSlotDateTime(item.dueDate, locale),
                        })
                      : (item.ownerName ?? t("startups.taskFallback"))
                  }
                  status={t(`actionStatus.${item.status}`)}
                  tone={ACTION_ITEM_TONES[item.status]}
                />
              ))}
            </div>
          )}
          <div className="flex items-center justify-between text-[12.5px] leading-[18px]">
            <h4 className="font-semibold text-[#4a5059]">
              {t("startups.files")}
            </h4>
            <Link href={href} className="font-medium text-[#26a4ff]">
              {t("startups.requestFile")}
            </Link>
          </div>
          {isLoading ? (
            <p className="text-[12px] text-[#858c96]">{t("loading")}</p>
          ) : hasFailed ? (
            <p className="text-[12px] text-[#a65a15]">
              {t("startups.filesFailed")}
            </p>
          ) : files.length === 0 ? (
            <p className="text-[12px] text-[#858c96]">
              {t("startups.noFiles")}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {files.map((file) => (
                <DetailRow
                  key={file.id}
                  title={file.title}
                  detail={file.detail}
                  status={file.status}
                  tone={file.uploaded ? "green" : "amber"}
                />
              ))}
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <PillButton href="/mentor-dashboard/messages">
              {t("startups.sendMessage")}
            </PillButton>
            <PillButton href="/mentor-dashboard/calendar" primary>
              {t("startups.planMeeting")}
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
  time,
  fresh,
  onReview,
}: {
  name: string;
  initials: string;
  person: string;
  role?: string;
  areas: string;
  time: string;
  fresh?: boolean;
  onReview: () => void;
}) {
  const t = useTranslations("mentorHome.requests");
  return (
    <article className="rounded-[20px] border border-[#e4e7ea] bg-white p-4">
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
          {fresh ? t("new") : t("reviewed")}
        </Chip>
      </div>
      <p className="mt-[10px] text-xs leading-[17px] text-[#676e78]">{areas}</p>
      <div className="mt-[10px] flex items-center justify-between gap-3">
        <time className="text-[11.5px] leading-[17px] text-[#858c96]">
          {time}
        </time>
        <PillButton soft onClick={onReview}>
          {t("review")}
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
  const t = useTranslations("mentorHome");
  const locale = useLocale();
  const { files } = useMentorshipFiles(request.id, true);
  const snapshot = request.recommendationSnapshot;
  const startup =
    request.organizationName ?? request.requesterName ?? t("fallback.startup");
  const context = [snapshot?.startupStage, snapshot?.startupSector].filter(
    Boolean,
  );
  const preferredSlotLabels = parsePreferredSlotsFromMessage(
    request.requesterMessage,
    locale,
  ).map((slot) => slot.label);
  const focusAreas = [
    request.supportArea,
    ...(snapshot?.startupTechnologies ?? []),
  ].filter(Boolean);
  // requesterMessage carries the machine-written "Tercih edilen saatler:" and
  // "preferredSlots:" lines, which read as the mentee's own words when shown raw.
  const sections = [
    [t("drawer.startup"), snapshot?.startupSummary],
    [t("drawer.need"), request.summary],
    [t("drawer.whyMe"), requestExpectedOutcome(request)],
    [t("drawer.preferredSlots"), preferredSlotLabels.join(" · ")],
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
            {t("drawer.title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("drawer.close")}
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
            <Chip>{t("drawer.new")}</Chip>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-[#f5faff] bg-[#f2f8fc] px-3 py-[10px] text-xs leading-[18px]">
            <span className="text-[#4a5059]">{context.join(" · ")}</span>
            <span className="text-[#676e78]">
              {t("drawer.requestedAt", {
                date: formatSlotDateTime(request.createdAt, locale),
              })}
            </span>
          </div>
          {sections.map(([label, copy]) => (
            <div key={label}>
              <h4 className="text-[11px] font-semibold leading-[17px] text-[#858c96]">
                {label}
              </h4>
              <p className="mt-1.5 rounded-[20px] border border-[#e4e7ea] p-2 text-[13px] leading-5 text-[#4a5059]">
                {copy}
              </p>
            </div>
          ))}
          {focusAreas.length ? (
            <div>
              <h4 className="text-[11px] font-semibold leading-[17px] text-[#858c96]">
                {t("drawer.focus")}
              </h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {focusAreas.map((area) => (
                  <Chip key={area}>{area}</Chip>
                ))}
              </div>
            </div>
          ) : null}
          {files.length ? (
            <div>
              <h4 className="text-[11px] font-semibold leading-[17px] text-[#858c96]">
                {t("drawer.files")}
              </h4>
              <div className="mt-2 flex flex-col gap-2">
                {files.map((file) => (
                  <DetailRow
                    key={file.id}
                    title={file.title}
                    detail={file.detail}
                    status={file.status}
                    tone={file.uploaded ? "green" : "amber"}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-3 px-7 pb-5 pt-4">
          <div className="flex gap-3">
            <PillButton onClick={() => onDecide(MentorDecisionMode.Decline)}>
              {t("drawer.decline")}
            </PillButton>
            <PillButton soft href="/mentor-dashboard/messages">
              {t("drawer.sendMessage")}
            </PillButton>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={() => onDecide(MentorDecisionMode.Accept)}
            className="min-h-[39px] min-w-[234px] rounded-full bg-[#26a4ff] px-4 text-[12.5px]! font-medium! leading-[19px]! text-white disabled:bg-[#c9cdd2]"
          >
            {t("drawer.accept")}
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
    greeting,
    pending,
    accepted,
    mentorships,
    nextMeeting,
    todayActions,
    awaitingReview,
    isLoadingActionItems,
    isLoadingTop,
    upcomingMeetings,
    requestsQuery,
    meetingsQuery,
    decision,
  } = useMentorDashboard();
  const t = useTranslations("mentorHome");
  const locale = useLocale();
  const texts = { t, locale };
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
              {t("greetingWithName", { greeting, name: firstName })}
            </h1>
            {detailedState ? (
              <p className="mt-1 text-[13px] leading-[19px] text-[#676e78]">
                {t("summary", {
                  active: accepted.length,
                  pending: pending.length,
                })}
              </p>
            ) : null}
          </div>
          <PillButton href="/mentor-profile">
            <span className="flex items-center gap-2">
              <FigmaIcon name="calendar" size={16} /> {t("manageAvailability")}
            </span>
          </PillButton>
        </header>
        {nextMeeting ? (
          <div className="mt-7">
            <NextMeetingBanner
              key={nextMeeting.id}
              nextMeeting={nextMeeting}
              startup={nextMeeting.organizationName ?? t("fallback.mentorship")}
              when={meetingWhenLabel(nextMeeting, texts)}
            />
          </div>
        ) : null}
        <div className="mt-7 empty:hidden">
          <MeetingProposalCards />
        </div>
        {isLoadingTop ? null : (
          <>
            <div className="mt-7 grid gap-3 md:grid-cols-3">
              <QuickAction
                icon="calendar-fill"
                title={t("quick.planMeeting")}
                detail={t("quick.planMeetingHint")}
                selected
                href="/mentor-dashboard/calendar"
              />
              <QuickAction
                icon="message"
                title={t("quick.sendMessage")}
                detail={t("quick.sendMessageHint")}
                href="/mentor-dashboard/messages"
              />
              <QuickAction
                icon="paper"
                title={t("quick.requestFile")}
                detail={t("quick.requestFileHint")}
                href="/mentorships"
              />
            </div>
            <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,804px)_400px]">
              <div className="min-w-0 space-y-6">
                <section>
                  <SectionHeading
                    action={
                      <Link href="/mentorships">
                        {t("today.all", { count: todayActions.length })}
                      </Link>
                    }
                  >
                    {t("today.title")}
                  </SectionHeading>
                  {isLoadingActionItems ? (
                    <ListNote>{t("loading")}</ListNote>
                  ) : todayActions.length === 0 ? (
                    <ListNote>{t("today.empty")}</ListNote>
                  ) : (
                    <div className="overflow-hidden rounded-[20px] border border-[#e4e7ea] bg-white">
                      {todayActions.slice(0, 4).map((row) => (
                        <ActionRow
                          key={row.id}
                          icon={row.icon}
                          startup={row.startup}
                          detail={row.detail}
                          chip={row.chip}
                          action={row.action}
                          href={row.href}
                        />
                      ))}
                    </div>
                  )}
                </section>
                <section>
                  <SectionHeading
                    action={
                      <Link href="/mentor-dashboard/calendar">
                        {t("upcoming.all")}
                      </Link>
                    }
                  >
                    {t("upcoming.title")}
                  </SectionHeading>
                  {meetingsQuery.isLoading ? (
                    <ListNote>{t("loading")}</ListNote>
                  ) : upcomingMeetings.length === 0 ? (
                    <ListNote>{t("upcoming.empty")}</ListNote>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2">
                      {upcomingMeetings.slice(0, 2).map((meeting) => (
                        <MeetingCard
                          key={meeting.id}
                          startup={
                            meeting.organizationName ?? t("fallback.mentorship")
                          }
                          title={meeting.agenda ?? t("fallback.meeting")}
                          when={[
                            formatMeetingShort(meeting.scheduledAt, locale),
                            meeting.durationMinutes
                              ? t("minutes", { count: meeting.durationMinutes })
                              : null,
                            t("online"),
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                          chip={meetingDayLabel(meeting.scheduledAt, locale)}
                          join={Boolean(meeting.meetLink)}
                        />
                      ))}
                    </div>
                  )}
                </section>
                <section>
                  <SectionHeading
                    action={
                      <Link href="/mentorships">{t("startups.all")}</Link>
                    }
                  >
                    {t("startups.title")}
                  </SectionHeading>
                  <div className="flex flex-col gap-[10px]">
                    {requestsQuery.isLoading ? (
                      <ListNote>{t("loading")}</ListNote>
                    ) : mentorships.length === 0 ? (
                      <ListNote>{t("startups.empty")}</ListNote>
                    ) : (
                      mentorships.map(
                        ({ request, actionItems, progress, ratio }) => {
                          const startup =
                            request.organizationName ??
                            request.requesterName ??
                            t("fallback.startup");
                          return (
                            <StartupCard
                              key={request.id}
                              id={request.id}
                              name={startup}
                              initials={toInitials(startup) || "MN"}
                              person={request.requesterName ?? ""}
                              topic={request.supportArea}
                              progress={progress}
                              ratio={ratio}
                              actionItems={actionItems}
                              href={mentorRequestStartupHref(request.id)}
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
                <MyProgramsPanel variant="mentor" />
                <section>
                  <SectionHeading
                    action={
                      <button type="button">
                        {t("requests.all", { count: pending.length })}
                      </button>
                    }
                  >
                    {t("requests.title")}
                  </SectionHeading>
                  <div className="space-y-[10px]">
                    {requestsQuery.isLoading ? (
                      <ListNote>{t("loading")}</ListNote>
                    ) : pending.length === 0 ? (
                      <ListNote>{t("requests.empty")}</ListNote>
                    ) : (
                      pending.map((request) => {
                        const startup =
                          request.organizationName ??
                          request.requesterName ??
                          t("fallback.startup");
                        return (
                          <RequestCard
                            key={request.id}
                            name={startup}
                            initials={toInitials(startup) || "MN"}
                            person={request.requesterName ?? ""}
                            areas={request.supportArea}
                            time={formatSlotDateTime(request.createdAt, locale)}
                            fresh
                            onReview={() => decision.selectRequest(request)}
                          />
                        );
                      })
                    )}
                  </div>
                </section>
                <section>
                  <SectionHeading>{t("reviews.title")}</SectionHeading>
                  <div className="space-y-[10px]">
                    {meetingsQuery.isLoading ? (
                      <ListNote>{t("loading")}</ListNote>
                    ) : awaitingReview.length === 0 ? (
                      <ListNote>{t("reviews.empty")}</ListNote>
                    ) : (
                      awaitingReview
                        .slice(0, 4)
                        .map((meeting) => (
                          <ReminderCard
                            key={meeting.id}
                            title={
                              meeting.outcomes?.trim()
                                ? t("reviews.noNote")
                                : t("reviews.awaiting")
                            }
                            startup={
                              meeting.organizationName ??
                              t("fallback.mentorship")
                            }
                            meeting={meeting.agenda ?? t("fallback.meeting")}
                            time={formatSlotDateTime(
                              meeting.scheduledAt,
                              locale,
                            )}
                            action={
                              meeting.outcomes?.trim()
                                ? t("reviews.addNote")
                                : t("reviews.complete")
                            }
                            href={
                              meeting.outcomes?.trim()
                                ? "/mentor-dashboard/calendar"
                                : mentorMeetingEvaluationHref(meeting.id)
                            }
                          />
                        ))
                    )}
                  </div>
                </section>
              </aside>
            </div>
          </>
        )}
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
