"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import {
  EmptyNote,
  FilterPills,
  QueryNotice,
  SearchField,
  StatusChip,
} from "@/components/admin/admin-ui";
import { ProgramGlyph } from "@/components/coordinator/program-glyph";
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
  const t = useTranslations("coordinatorPrograms");
  const { query, filter, setFilter, search, setSearch, options, visible } =
    useCoordinatorProgramList();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterPills value={filter} onChange={setFilter} options={options} />
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="min-w-0 flex-1 sm:w-[300px]">
            <SearchField
              value={search}
              onChange={setSearch}
              placeholder={t("search")}
            />
          </div>
          <Link
            href="/coordinator/programs/new"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#22262b] px-4 py-2.5 text-[13px] font-medium text-white"
          >
            <Plus aria-hidden className="size-4" /> {t("launch")}
          </Link>
        </div>
      </div>
      <QueryNotice isLoading={query.isLoading} error={query.error} />
      {query.isSuccess && visible.length === 0 ? (
        <EmptyNote>
          {search || query.data.length > 0 ? t("noMatch") : t("none")}
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
  const t = useTranslations("coordinatorPrograms");
  const locale = useLocale();
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
          <StatusChip tone="amber">{t("upcoming")}</StatusChip>
        ) : (
          <StatusChip tone="green">{t("active")}</StatusChip>
        )}
        <div className="ml-auto flex items-center gap-3">
          {actions > 0 ? (
            <StatusChip tone="amber">
              {t("actionsWaiting", { count: actions })}
            </StatusChip>
          ) : null}
          <Link
            href={`/coordinator/programs/${program.id}`}
            className="rounded-full bg-[#22262b] px-4 py-2 text-[13px] font-medium text-white"
          >
            {t("open")}
          </Link>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          dot="#e0522a"
          label={t("teams")}
          value={program.teamCount}
          note={t("teamsMentored", {
            count: program.teamCount - program.awaitingMatchCount,
          })}
        />
        <Stat
          dot="#1583d6"
          label={t("mentors")}
          value={program.mentorCount}
          note={
            program.pendingMentorCount > 0
              ? t("pendingMentors", { count: program.pendingMentorCount })
              : program.mentorCount === 0
                ? t("poolEmpty")
                : t("noPendingInvites")
          }
        />
        <Stat
          label={t("activeMentorships")}
          value={program.activeMentorshipCount}
          note={
            upcoming
              ? t("notStarted")
              : program.riskyMentorshipCount > 0
                ? t("risky", { count: program.riskyMentorshipCount })
                : t("noRisky")
          }
        />
        {upcoming && program.startDate ? (
          <Stat
            label={t("untilStart")}
            value={t("days", { count: daysUntil(program.startDate) })}
            note={formatLongDate(program.startDate, locale)}
          />
        ) : (
          <Stat
            dot="#e0522a"
            label={t("awaitingMatch")}
            value={program.awaitingMatchCount}
            note={
              program.oldestAwaitingMatchDays != null
                ? t("oldestDays", { days: program.oldestAwaitingMatchDays })
                : t("noWaitingTeams")
            }
          />
        )}
      </div>
      {program.phases.length > 0 ? <PhaseBar program={program} /> : null}
    </article>
  );
}

function PhaseBar({ program }: { program: CoordinatorProgram }) {
  const t = useTranslations("coordinatorPrograms");
  return (
    <div className="mt-5 flex items-start gap-3">
      <span className="pt-0.5 text-[12px] text-[#858c96]">{t("phase")}</span>
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
          {t("week", {
            current: program.currentWeek,
            total: program.totalWeeks,
          })}
        </span>
      ) : null}
    </div>
  );
}

function CompletedProgramRow({ program }: { program: CoordinatorProgram }) {
  const t = useTranslations("coordinatorPrograms");
  const locale = useLocale();
  const range = formatMonthRange(program.startDate, program.endDate, locale);
  const details = [
    range,
    t("teamCount", { count: program.teamCount }),
    t("mentorCount", { count: program.mentorCount }),
  ].filter(Boolean);
  return (
    <article className="flex flex-wrap items-center gap-3 rounded-[28px] border border-[#e9ecef] bg-white p-5 sm:p-6">
      <ProgramGlyph muted />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[18px] font-semibold text-[#22262b]">
            {program.name}
          </h2>
          <StatusChip tone="neutral">{t("completed")}</StatusChip>
        </div>
        <p className="mt-1 text-[13px] text-[#858c96]">{details.join(" · ")}</p>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Link
          href={`/coordinator/programs/${program.id}/report`}
          className="rounded-full border border-[#e9ecef] px-4 py-2 text-[13px] font-medium text-[#22262b]"
        >
          {t("report")}
        </Link>
        <Link
          href={`/coordinator/programs/${program.id}`}
          className="rounded-full border border-[#e9ecef] px-4 py-2 text-[13px] font-medium text-[#22262b]"
        >
          {t("open")}
        </Link>
      </div>
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
