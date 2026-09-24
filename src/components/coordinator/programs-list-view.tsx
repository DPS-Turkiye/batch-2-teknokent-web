"use client";

import Link from "next/link";
import { FolderKanban } from "lucide-react";

import {
  EmptyNote,
  FilterPills,
  QueryNotice,
  SearchField,
  StatusChip,
} from "@/components/admin/admin-ui";
import { useCoordinatorProgramList } from "@/hooks/use-coordinator-programs";
import {
  type CoordinatorProgram,
  ProgramLifecycle,
} from "@/interfaces/coordinator-program";
import {
  daysUntil,
  formatMonthRange,
  openActionCount,
  PhaseState,
  phaseStates,
} from "@/lib/coordinator-programs";
import { formatLongDate } from "@/lib/utils";

export function ProgramsListView() {
  const { query, filter, setFilter, search, setSearch, options, visible } =
    useCoordinatorProgramList();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterPills value={filter} onChange={setFilter} options={options} />
        <div className="w-full sm:w-[300px]">
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Program ara"
          />
        </div>
      </div>
      <QueryNotice isLoading={query.isLoading} error={query.error} />
      {query.isSuccess && visible.length === 0 ? (
        <EmptyNote>
          {search || query.data.length > 0
            ? "Bu filtreyle eşleşen program yok."
            : "Henüz yönettiğin bir program yok."}
        </EmptyNote>
      ) : null}
      <div className="space-y-4">
        {visible.map((program) =>
          program.lifecycle === ProgramLifecycle.Completed ? (
            <CompletedProgramRow key={program.id} program={program} />
          ) : (
            <ProgramCard key={program.id} program={program} />
          ),
        )}
      </div>
    </div>
  );
}

function ProgramCard({ program }: { program: CoordinatorProgram }) {
  const upcoming = program.lifecycle === ProgramLifecycle.Upcoming;
  const actions = openActionCount(program);
  return (
    <article className="rounded-[28px] border border-[#e9ecef] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <ProgramGlyph />
        <h2 className="text-[18px] font-semibold text-[#22262b]">
          {program.name}
        </h2>
        {upcoming ? (
          <StatusChip tone="amber">Yaklaşan</StatusChip>
        ) : (
          <StatusChip tone="green">Aktif</StatusChip>
        )}
        <div className="ml-auto flex items-center gap-3">
          {actions > 0 ? (
            <StatusChip tone="amber">{actions} aksiyon bekliyor</StatusChip>
          ) : null}
          <Link
            href={`/coordinator/programs/${program.id}`}
            className="rounded-full bg-[#22262b] px-4 py-2 text-[13px] font-medium text-white"
          >
            Programı aç
          </Link>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          dot="#e0522a"
          label="Takım"
          value={program.teamCount}
          note={`${program.teamCount - program.awaitingMatchCount} takım mentorlu`}
        />
        <Stat
          dot="#1583d6"
          label="Mentor"
          value={program.mentorCount}
          note={
            program.pendingMentorCount > 0
              ? `+${program.pendingMentorCount} davet / onay`
              : program.mentorCount === 0
                ? "havuz boş"
                : "bekleyen davet yok"
          }
        />
        <Stat
          label="Aktif mentorluk"
          value={program.activeMentorshipCount}
          note={
            upcoming
              ? "program başlamadı"
              : program.riskyMentorshipCount > 0
                ? `${program.riskyMentorshipCount} riskli`
                : "riskli mentorluk yok"
          }
        />
        {upcoming && program.startDate ? (
          <Stat
            label="Başlangıca"
            value={`${daysUntil(program.startDate)} gün`}
            note={formatLongDate(program.startDate)}
          />
        ) : (
          <Stat
            dot="#e0522a"
            label="Eşleşme bekleyen"
            value={program.awaitingMatchCount}
            note={
              program.oldestAwaitingMatchDays != null
                ? `en eskisi ${program.oldestAwaitingMatchDays} gün`
                : "bekleyen takım yok"
            }
          />
        )}
      </div>
      {program.phases.length > 0 ? <PhaseBar program={program} /> : null}
    </article>
  );
}

function PhaseBar({ program }: { program: CoordinatorProgram }) {
  return (
    <div className="mt-5 flex items-start gap-3">
      <span className="pt-0.5 text-[12px] text-[#858c96]">Faz</span>
      <ol className="grid flex-1 auto-cols-fr grid-flow-col gap-1.5">
        {phaseStates(program).map(({ phase, state }) => (
          <li
            key={phase.id}
            aria-current={state === PhaseState.Current ? "step" : undefined}
          >
            <span
              className={`block h-1.5 rounded-full ${
                state === PhaseState.Current
                  ? "bg-[#22262b]"
                  : state === PhaseState.Done
                    ? "bg-[#aeb4bc]"
                    : "bg-[#eef0f2]"
              }`}
            />
            <span
              className={`mt-1.5 block truncate text-[12px] ${
                state === PhaseState.Current
                  ? "font-medium text-[#22262b]"
                  : "text-[#858c96]"
              }`}
            >
              {phase.name}
            </span>
          </li>
        ))}
      </ol>
      {program.currentWeek != null && program.totalWeeks != null ? (
        <span className="shrink-0 pt-0.5 text-[12px] text-[#676e78]">
          Hafta {program.currentWeek} / {program.totalWeeks}
        </span>
      ) : null}
    </div>
  );
}

function CompletedProgramRow({ program }: { program: CoordinatorProgram }) {
  const range = formatMonthRange(program.startDate, program.endDate);
  const details = [
    range,
    `${program.teamCount} takım`,
    `${program.mentorCount} mentor`,
  ].filter(Boolean);
  return (
    <article className="flex flex-wrap items-center gap-3 rounded-[28px] border border-[#e9ecef] bg-white p-5 sm:p-6">
      <ProgramGlyph muted />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[18px] font-semibold text-[#22262b]">
            {program.name}
          </h2>
          <StatusChip tone="neutral">Tamamlandı</StatusChip>
        </div>
        <p className="mt-1 text-[13px] text-[#858c96]">{details.join(" · ")}</p>
      </div>
      <Link
        href={`/coordinator/programs/${program.id}`}
        className="ml-auto rounded-full border border-[#e9ecef] px-4 py-2 text-[13px] font-medium text-[#22262b]"
      >
        Programı aç
      </Link>
    </article>
  );
}

function Stat({
  label,
  value,
  note,
  dot,
}: {
  label: string;
  value: number | string;
  note: string;
  dot?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e9ecef] px-4 py-3">
      <p className="flex items-center gap-1.5 text-[12.5px] text-[#676e78]">
        {dot ? (
          <span
            aria-hidden
            className="size-1.5 rounded-full"
            style={{ backgroundColor: dot }}
          />
        ) : null}
        {label}
      </p>
      <p className="mt-1 text-[22px] font-semibold text-[#22262b]">{value}</p>
      <p className="text-[12px] text-[#858c96]">{note}</p>
    </div>
  );
}

function ProgramGlyph({ muted = false }: { muted?: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid size-12 place-items-center rounded-2xl ${
        muted ? "bg-[#f4f5f7] text-[#858c96]" : "bg-[#22262b] text-white"
      }`}
    >
      <FolderKanban className="size-5" />
    </span>
  );
}
