"use client";

import { ChevronDown } from "lucide-react";
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
  AGENDA_KIND_LABELS,
  agendaWhen,
  AgendaWindow,
  hasOpenActions,
  meetingSlotLabel,
} from "@/lib/coordinator-home";
import { formatDateTime } from "@/lib/utils";

export function CoordinatorHomeView() {
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
                Bugün / Bu Hafta
              </h2>
              <div className="flex gap-1 rounded-full bg-[#f4f5f7] p-1">
                <WindowButton
                  active={home.agendaWindow === AgendaWindow.Today}
                  onClick={() => home.setAgendaWindow(AgendaWindow.Today)}
                  label="Bugün"
                  count={home.todayCount}
                />
                <WindowButton
                  active={home.agendaWindow === AgendaWindow.Week}
                  onClick={() => home.setAgendaWindow(AgendaWindow.Week)}
                  label="Bu hafta"
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
  const cards = [
    {
      label: "Aktif mentorluk",
      value: metrics.activeMentorships,
      note: `${metrics.mentoredTeams} takım · ${metrics.activeMentors} mentor`,
      border: "border-[#26a4ff]",
    },
    {
      label: "Uzun süredir görüşme yok",
      value: metrics.staleMentorships,
      note: "görüşme eşiği aşıldı",
      border: "border-[#f59e0b]",
    },
    {
      label: "Geciken aksiyonlar",
      value: metrics.overdueActions,
      note: "son tarihi geçmiş",
      border: "border-[#ef4444]",
    },
    {
      label: "Yeni / tekrarlayan darboğaz",
      value: metrics.openBottlenecks,
      note: "takım kaynaklı",
      border: "border-[#e9ecef]",
    },
    {
      label: "Katılım / iletişim problemi",
      value: metrics.slowMentors,
      note: "mentor kaynaklı",
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
  return (
    <article className="rounded-[28px] border border-[#e9ecef] bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-[#f4f5f7] px-3 py-1 text-[12px] text-[#676e78]">
          Sıradaki görüşme
        </span>
        {meeting ? (
          <StatusChip tone="amber">{meetingSlotLabel(meeting)}</StatusChip>
        ) : null}
      </div>
      {meeting ? (
        <>
          <h3 className="mt-6 text-[18px] font-medium text-[#1d3a5f]">
            {meeting.title}
          </h3>
          <p className="mt-1 text-[12.5px] text-[#858c96]">
            {meeting.meetLink ? "Online · Google Meet" : "Görüşme"} ·{" "}
            {meeting.sequence}. görüşme
          </p>
          <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <Party
              name={meeting.mentorName}
              detail={`Mentor${meeting.mentorTitle ? ` · ${meeting.mentorTitle}` : ""}`}
            />
            <span aria-hidden className="text-[#aeb4bc]">
              ↔
            </span>
            <Party
              name={meeting.organizationName}
              detail={`Takım${meeting.founderName ? ` · ${meeting.founderName}` : ""}`}
            />
          </div>
          {meeting.meetLink ? (
            <a
              href={meeting.meetLink}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex rounded-full bg-[#22262b] px-4 py-2 text-[13px] font-medium text-white"
            >
              Görüşmeye katıl
            </a>
          ) : null}
        </>
      ) : (
        <p className="mt-6 text-sm text-[#858c96]">
          Planlanmış bir görüşme yok.
        </p>
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
  if (items.length === 0) {
    return (
      <div className="rounded-[28px] border border-[#e9ecef] bg-white">
        <EmptyNote>Bu aralıkta planlanmış bir şey yok.</EmptyNote>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-[#eef0f2] rounded-[28px] border border-[#e9ecef] bg-white px-4">
      {items.map((item) => {
        const when = agendaWhen(item);
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
            <StatusChip tone="neutral">
              {AGENDA_KIND_LABELS[item.kind]}
            </StatusChip>
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
  const { pendingMentors, awaitingTeams, missingNotes } = data.actions;
  return (
    <section aria-labelledby="coordinator-actions" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="coordinator-actions"
          className="text-[16px] font-semibold text-[#1d3a5f]"
        >
          Aksiyonlar
        </h2>
        <label className="flex items-center gap-2 rounded-full border border-[#e9ecef] px-4 py-2 text-[13px] text-[#858c96]">
          Program:
          <select
            value={programId ?? ""}
            onChange={(event) => onProgramChange(event.target.value || null)}
            className="bg-transparent font-medium text-[#1d3a5f] outline-none"
          >
            <option value="">Tüm programlar</option>
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
              title="Yanıt bekleyen mentor"
              summary={`${pendingMentors.length} mentor · program daveti veya katılım isteği bekliyor`}
              chip="Bekliyor"
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
              title="Eşleşme bekleyen takım"
              summary={`${awaitingTeams.length} takım · mentor ataması yapılmadı · en eskisi ${awaitingTeams[0].waitingDays} gün önce`}
              chip="Bekliyor"
            >
              {awaitingTeams.map((team) => (
                <ActionItemLine
                  key={`${team.programId}-${team.organizationId}`}
                  name={team.name}
                  detail={team.programName}
                  days={team.waitingDays}
                />
              ))}
            </ActionRow>
          ) : null}
          {missingNotes.length > 0 ? (
            <ActionRow
              title="Eksik görüşme çıktısı"
              summary={`${missingNotes.length} görüşme · son 14 günde not girilmedi`}
              chip="Dikkat"
            >
              {missingNotes.map((note) => (
                <ActionItemLine
                  key={note.meetingId}
                  name={`${note.mentorName} ↔ ${note.organizationName}`}
                  detail={formatDateTime(note.scheduledAt)}
                />
              ))}
            </ActionRow>
          ) : null}
        </div>
      ) : (
        <EmptyNote>Şu an bekleyen bir aksiyon yok.</EmptyNote>
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
}: {
  name: string;
  detail: string;
  days?: number;
}) {
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
          {days === 0 ? "bugün" : `${days} gündür bekliyor`}
        </StatusChip>
      ) : null}
    </li>
  );
}
