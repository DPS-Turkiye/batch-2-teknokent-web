"use client";

import { ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import {
  EmptyNote,
  QueryNotice,
  StatusChip,
} from "@/components/admin/admin-ui";
import { useCoordinatorHome } from "@/hooks/use-coordinator-overview";
import type {
  CoordinatorAgendaItem,
  CoordinatorNextMeeting,
  CoordinatorOverview,
} from "@/interfaces/coordinator-overview";
import {
  agendaWhen,
  AgendaWindow,
  hasOpenActions,
  meetingSlotLabel,
} from "@/lib/coordinator-home";
import { formatDateTime } from "@/lib/utils";

export function CoordinatorHomeView() {
  const t = useTranslations("coordinatorHome");
  const home = useCoordinatorHome();
  const data = home.query.data;

  return (
    <div className="space-y-8">
      <QueryNotice isLoading={home.query.isLoading} error={home.query.error} />
      {data ? (
        <>
          <MetricCards metrics={data.metrics} />
          <section aria-labelledby="coordinator-week" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2
                id="coordinator-week"
                className="text-[16px] font-semibold text-[#1d3a5f]"
              >
                {t("week")}
              </h2>
              <div className="flex gap-1 rounded-full bg-[#f4f5f7] p-1">
                <WindowButton
                  active={home.agendaWindow === AgendaWindow.Today}
                  onClick={() => home.setAgendaWindow(AgendaWindow.Today)}
                  label={t("today")}
                  count={home.todayCount}
                />
                <WindowButton
                  active={home.agendaWindow === AgendaWindow.Week}
                  onClick={() => home.setAgendaWindow(AgendaWindow.Week)}
                  label={t("thisWeek")}
                  count={home.weekCount}
                />
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <NextMeetingCard meeting={data.nextMeeting} />
              <AgendaList items={home.visibleAgenda} />
            </div>
          </section>
          <ActionsSection
            data={data}
            programId={home.programId}
            onProgramChange={home.setProgramId}
          />
        </>
      ) : null}
    </div>
  );
}

function MetricCards({ metrics }: { metrics: CoordinatorOverview["metrics"] }) {
  const t = useTranslations("coordinatorHome.metrics");
  const cards = [
    {
      label: t("active"),
      value: metrics.activeMentorships,
      note: t("activeNote", {
        teams: metrics.mentoredTeams,
        mentors: metrics.activeMentors,
      }),
      border: "border-[#26a4ff]",
    },
    {
      label: t("stale"),
      value: metrics.staleMentorships,
      note: t("staleNote"),
      border: "border-[#f59e0b]",
    },
    {
      label: t("overdue"),
      value: metrics.overdueActions,
      note: t("overdueNote"),
      border: "border-[#ef4444]",
    },
    {
      label: t("bottlenecks"),
      value: metrics.openBottlenecks,
      note: t("bottlenecksNote"),
      border: "border-[#e9ecef]",
    },
    {
      label: t("slowMentors"),
      value: metrics.slowMentors,
      note: t("slowMentorsNote"),
      border: "border-[#e9ecef]",
    },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-2xl border bg-white px-5 py-4 ${card.border}`}
        >
          <p className="text-[12.5px] text-[#676e78]">{card.label}</p>
          <p className="mt-2 text-[28px] font-semibold text-[#22262b]">
            {card.value}
          </p>
          <p className="mt-1 text-[12px] text-[#858c96]">{card.note}</p>
        </div>
      ))}
    </div>
  );
}

function WindowButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-[12.5px] ${
        active
          ? "bg-white font-medium text-[#1d3a5f] shadow-[0_1px_2px_rgba(33,38,43,0.08)]"
          : "text-[#858c96]"
      }`}
    >
      {label} <span className="text-[#aeb4bc]">{count}</span>
    </button>
  );
}

function NextMeetingCard({
  meeting,
}: {
  meeting: CoordinatorNextMeeting | null;
}) {
  const t = useTranslations("coordinatorHome");
  const locale = useLocale();
  return (
    <article className="rounded-[28px] border border-[#e9ecef] bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-[#f4f5f7] px-3 py-1 text-[12px] text-[#676e78]">
          {t("nextMeeting")}
        </span>
        {meeting ? (
          <StatusChip tone="amber">
            {meetingSlotLabel(meeting, locale)}
          </StatusChip>
        ) : null}
      </div>
      {meeting ? (
        <>
          <h3 className="mt-6 text-[18px] font-medium text-[#1d3a5f]">
            {meeting.title}
          </h3>
          <p className="mt-1 text-[12.5px] text-[#858c96]">
            {meeting.meetLink ? t("onlineMeet") : t("meeting")} ·{" "}
            {t("sequence", { n: meeting.sequence })}
          </p>
          <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <Party
              name={meeting.mentorName}
              detail={
                meeting.mentorTitle
                  ? t("mentorWithTitle", { title: meeting.mentorTitle })
                  : t("mentor")
              }
            />
            <span aria-hidden className="text-[#aeb4bc]">
              ↔
            </span>
            <Party
              name={meeting.organizationName}
              detail={
                meeting.founderName
                  ? t("teamWithFounder", { founder: meeting.founderName })
                  : t("team")
              }
            />
          </div>
          {meeting.meetLink ? (
            <a
              href={meeting.meetLink}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex rounded-full bg-[#22262b] px-4 py-2 text-[13px] font-medium text-white"
            >
              {t("join")}
            </a>
          ) : null}
        </>
      ) : (
        <p className="mt-6 text-sm text-[#858c96]">{t("noMeeting")}</p>
      )}
    </article>
  );
}

function Party({ name, detail }: { name: string; detail: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[13px] font-medium text-[#1d3a5f]">{name}</p>
      <p className="truncate text-[12px] text-[#858c96]">{detail}</p>
    </div>
  );
}

function AgendaList({ items }: { items: CoordinatorAgendaItem[] }) {
  const t = useTranslations("coordinatorHome");
  const locale = useLocale();
  if (items.length === 0) {
    return (
      <div className="rounded-[28px] border border-[#e9ecef] bg-white">
        <EmptyNote>{t("emptyAgenda")}</EmptyNote>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-[#eef0f2] rounded-[28px] border border-[#e9ecef] bg-white px-4">
      {items.map((item) => {
        const when = agendaWhen(item, { t, locale });
        return (
          <li
            key={`${item.kind}-${item.at}-${item.title}`}
            className="grid grid-cols-[72px_1fr_auto] items-center gap-3 py-3"
          >
            <span className="text-[12px] leading-tight">
              <span className="block font-medium text-[#22262b]">
                {when.day}
              </span>
              <span className="text-[#858c96]">{when.time}</span>
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13.5px] text-[#1d3a5f]">
                {item.title}
              </span>
              {item.subtitle ? (
                <span className="block truncate text-[12px] text-[#858c96]">
                  {item.subtitle}
                </span>
              ) : null}
            </span>
            <StatusChip tone="neutral">{t(`kinds.${item.kind}`)}</StatusChip>
          </li>
        );
      })}
    </ul>
  );
}

function ActionsSection({
  data,
  programId,
  onProgramChange,
}: {
  data: CoordinatorOverview;
  programId: string | null;
  onProgramChange: (programId: string | null) => void;
}) {
  const t = useTranslations("coordinatorHome");
  const locale = useLocale();
  const { pendingMentors, awaitingTeams, missingNotes } = data.actions;
  return (
    <section aria-labelledby="coordinator-actions" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="coordinator-actions"
          className="text-[16px] font-semibold text-[#1d3a5f]"
        >
          {t("actions")}
        </h2>
        <label className="flex items-center gap-2 rounded-full border border-[#e9ecef] px-4 py-2 text-[13px] text-[#858c96]">
          {t("program")}
          <select
            value={programId ?? ""}
            onChange={(event) => onProgramChange(event.target.value || null)}
            className="bg-transparent font-medium text-[#1d3a5f] outline-none"
          >
            <option value="">{t("allPrograms")}</option>
            {data.programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {hasOpenActions(data.actions) ? (
        <div className="divide-y divide-[#eef0f2] rounded-[28px] border border-[#e9ecef] bg-white px-2">
          {pendingMentors.length > 0 ? (
            <ActionRow
              title={t("pendingMentors")}
              summary={t("pendingMentorsSummary", {
                count: pendingMentors.length,
              })}
              chip={t("waiting")}
            >
              {pendingMentors.map((mentor) => (
                <ActionItemLine
                  key={`${mentor.programId}-${mentor.mentorId}`}
                  name={mentor.mentorName}
                  detail={mentor.programName}
                  days={mentor.waitingDays}
                />
              ))}
            </ActionRow>
          ) : null}
          {awaitingTeams.length > 0 ? (
            <ActionRow
              title={t("awaitingTeams")}
              summary={t("awaitingTeamsSummary", {
                count: awaitingTeams.length,
                days: awaitingTeams[0]?.waitingDays ?? 0,
              })}
              chip={t("waiting")}
            >
              {awaitingTeams.map((team) => (
                <ActionItemLine
                  key={`${team.programId}-${team.organizationId}`}
                  name={team.name}
                  detail={team.programName}
                  days={team.waitingDays}
                  href={`/coordinator/programs/${encodeURIComponent(team.programId)}/matching?team=${encodeURIComponent(team.organizationId)}`}
                  action={t("match")}
                />
              ))}
            </ActionRow>
          ) : null}
          {missingNotes.length > 0 ? (
            <ActionRow
              title={t("missingNotes")}
              summary={t("missingNotesSummary", { count: missingNotes.length })}
              chip={t("attention")}
            >
              {missingNotes.map((note) => (
                <ActionItemLine
                  key={note.meetingId}
                  name={`${note.mentorName} ↔ ${note.organizationName}`}
                  detail={formatDateTime(note.scheduledAt, locale)}
                />
              ))}
            </ActionRow>
          ) : null}
        </div>
      ) : (
        <EmptyNote>{t("noActions")}</EmptyNote>
      )}
    </section>
  );
}

function ActionRow({
  title,
  summary,
  chip,
  children,
}: {
  title: string;
  summary: string;
  chip: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-1">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-medium text-[#1d3a5f]">
            {title}
          </span>
          <span className="block text-[12.5px] text-[#858c96]">{summary}</span>
        </span>
        <StatusChip tone="amber">{chip}</StatusChip>
        <ChevronDown
          aria-hidden
          className={`size-4 text-[#858c96] transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? <ul className="mb-2 ml-3 mr-3 space-y-1">{children}</ul> : null}
    </div>
  );
}

function ActionItemLine({
  name,
  detail,
  days,
  href,
  action,
}: {
  name: string;
  detail: string;
  days?: number;
  href?: string;
  action?: string;
}) {
  const t = useTranslations("coordinatorHome");
  return (
    <li className="flex items-center gap-3 rounded-xl border-b border-[#f0f2f4] px-3 py-2.5 last:border-0">
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] text-[#22262b]">
          {name}
        </span>
        <span className="block truncate text-[12px] text-[#858c96]">
          {detail}
        </span>
      </span>
      {days != null ? (
        <StatusChip tone={days >= 4 ? "red" : days >= 2 ? "amber" : "neutral"}>
          {days === 0 ? t("waitingToday") : t("waitingDays", { days })}
        </StatusChip>
      ) : null}
      {href && action ? (
        <Link
          href={href}
          className="rounded-full bg-[#22262b] px-3 py-1.5 text-[12px] font-medium text-white"
        >
          {action}
        </Link>
      ) : null}
    </li>
  );
}
