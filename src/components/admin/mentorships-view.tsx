"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ReactNode } from "react";

import { AdminIcon, EmptyNote, QueryNotice } from "@/components/admin/admin-ui";
import {
  InterventionDrawer,
  NotifyInterventionDialog,
} from "@/components/admin/intervention-follow";
import { ProgramTypeChip } from "@/components/coordinator/program-type-chip";
import {
  useAdminMentorships,
  useMentorshipInterventions,
  useMentorshipMatching,
} from "@/hooks/use-admin-mentorships";
import { useOptionLabel } from "@/hooks/use-option-label";
import type { AdminOverview, AdminProgram } from "@/interfaces/admin-overview";
import { programCoordinatorLabel } from "@/lib/admin-coordinators";
import {
  ALL_PROGRAMS,
  coordinatorHref,
  INTERVENTION_FILTERS,
  interventionSignals,
  MATCHING_FILTERS,
  MATCHING_SORTS,
  missingCoordinatorAccess,
  overviewSummary,
  pairLabel,
  programHealth,
} from "@/lib/admin-mentorships";
import {
  isProgramTypeFilter,
  PROGRAM_TYPE_FILTERS,
  type ProgramTypeFilter,
} from "@/lib/program-types";
import { initials } from "@/lib/utils";
import {
  InterventionFilter,
  InterventionKind,
  MatchingFilter,
  MentorshipTab,
} from "@/types/admin-mentorships";

export function MentorshipsView({ tab }: { tab: MentorshipTab }) {
  const t = useTranslations("adminMentorships");
  const { query, data, screen, type, selectType, scope, setScope } =
    useAdminMentorships();
  if (!data || !screen) {
    return <QueryNotice isLoading={query.isLoading} error={query.error} />;
  }
  const { programs, live } = screen;
  const tabs = [
    {
      id: MentorshipTab.Overview,
      href: "/admin/mentorships",
      label: t("tabs.overview"),
    },
    {
      id: MentorshipTab.Interventions,
      href: "/admin/mentorships/interventions",
      label: t("tabs.interventions"),
      count: screen.interventionCount,
      alert: true,
    },
    {
      id: MentorshipTab.Matching,
      href: "/admin/mentorships/matching",
      label: t("tabs.matching"),
      count: screen.waitingCount,
      alert: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-end gap-2.5">
        {/* TEST UI: placeholder until the design team's screen; replace when it arrives. */}
        <TypeSelect value={type} onChange={selectType} />
        <ScopeSelect
          value={scope}
          programs={screen.typedNames}
          onChange={setScope}
        />
      </div>
      <div className="flex border-b border-[#e9ecef]">
        {tabs.map((item) => {
          const active = item.id === tab;
          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex flex-1 flex-col items-center gap-3 px-4"
            >
              <span className="flex items-center gap-1.5">
                {item.alert && item.count > 0 ? (
                  <span
                    aria-hidden
                    className="size-[7px] rounded-full bg-[#d9464b]"
                  />
                ) : null}
                <span
                  className={`text-[14.5px] leading-[1.3] ${
                    active ? "font-semibold text-[#22262b]" : "text-[#676e78]"
                  }`}
                >
                  {item.label}
                </span>
                {item.count != null ? (
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11.5px] leading-[1.3] font-medium ${
                      active
                        ? "bg-[#22262b] text-white"
                        : item.alert && item.count > 0
                          ? "bg-[#fdeeee] text-[#d9464b]"
                          : "bg-[#f5f6f8] text-[#676e78]"
                    }`}
                  >
                    {item.count}
                  </span>
                ) : null}
              </span>
              <span
                className={`h-[2.5px] w-full rounded-sm ${active ? "bg-[#22262b]" : ""}`}
              />
            </Link>
          );
        })}
      </div>
      {tab === MentorshipTab.Overview ? (
        <Overview data={data} programs={programs} />
      ) : null}
      {tab === MentorshipTab.Interventions ? (
        <Interventions data={data} programs={live} />
      ) : null}
      {tab === MentorshipTab.Matching ? (
        <Matching data={data} programs={live} />
      ) : null}
    </div>
  );
}

function Overview({
  data,
  programs,
}: {
  data: AdminOverview;
  programs: AdminProgram[];
}) {
  const t = useTranslations("adminMentorships");
  const summary = overviewSummary(data, programs, t);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          title={t("stats.active")}
          value={String(summary.activeCount)}
          detail={t("stats.programs", { count: summary.activeProgramCount })}
        />
        <Stat
          title={t("stats.intervention")}
          value={String(summary.criticalCount)}
          detail={t("stats.inPrograms", {
            count: summary.criticalProgramCount,
          })}
          dot="#d9464b"
          href="/admin/mentorships/interventions"
        />
        <Stat
          title={t("stats.followUp")}
          value={String(summary.bottleneckCount)}
          detail={t("stats.openBottleneck")}
          dot="#ffab3d"
          href={`/admin/mentorships/interventions?filter=${InterventionFilter.Bottleneck}`}
        />
        <Stat
          title={t("stats.averageGap")}
          value={
            summary.averageGap == null
              ? "—"
              : t("stats.days", { count: summary.averageGap })
          }
          detail={
            summary.averageGap == null
              ? t("stats.noMeetings")
              : t("stats.target14")
          }
        />
      </div>
      <section className="overflow-hidden rounded-[28px] border border-[#e9ecef] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-3">
          <h2 className="text-[15px] font-semibold text-[#22262b]">
            {t("healthByProgram")}
          </h2>
          <p className="flex items-center gap-3 text-[12px] text-[#858c96]">
            <Legend color="#a4e901" label={t("healthy")} />
            <Legend color="#ffab3d" label={t("followUp")} />
            <Legend color="#d9464b" label={t("risky")} />
          </p>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            <div
              className={`${overviewCols} border-b border-[#f0f2f4] px-5 py-3 text-[12px] font-medium text-[#858c96]`}
            >
              <span>{t("overviewColumns.program")}</span>
              <span>{t("overviewColumns.coordinator")}</span>
              <span>{t("overviewColumns.active")}</span>
              <span>{t("overviewColumns.distribution")}</span>
              <span>{t("overviewColumns.risky")}</span>
              <span />
            </div>
            {programs.length === 0 ? (
              <EmptyNote>{t("noProgramsInScope")}</EmptyNote>
            ) : (
              programs.map((program) => (
                <ProgramHealthRow
                  key={program.id}
                  program={program}
                  data={data}
                />
              ))
            )}
          </div>
        </div>
        <p className="flex flex-wrap items-center justify-end gap-4 px-5 py-3 text-[12px] text-[#858c96]">
          <Legend color="#a4e901" label={t("healthy")} />
          <Legend color="#ffab3d" label={t("followUpNeeded")} />
          <Legend color="#d9464b" label={t("riskyLong")} />
        </p>
      </section>
    </div>
  );
}

function ProgramHealthRow({
  program,
  data,
}: {
  program: AdminProgram;
  data: AdminOverview;
}) {
  const t = useTranslations("adminMentorships");
  const health = programHealth(program, data);
  return (
    <div
      className={`${overviewCols} border-b border-[#f0f2f4] px-5 py-3.5 last:border-0`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate text-[14px] font-medium text-[#22262b]">
          {program.name}
        </span>
        <ProgramTypeChip type={program.type} />
      </span>
      <CoordinatorName program={program} data={data} />
      <span className="text-[14px] font-medium text-[#22262b]">
        {health.completed || health.active === 0 ? "—" : health.active}
      </span>
      <span>
        {health.completed ? (
          <span className="text-[13px] text-[#858c96]">{t("completed")}</span>
        ) : (
          <HealthBar
            green={health.green}
            amber={health.amber}
            red={health.red}
          />
        )}
      </span>
      <span>
        {health.completed ? (
          <span className="text-[13px] text-[#aeb4bc]">—</span>
        ) : (
          <RiskCount count={health.red} />
        )}
      </span>
      <span className="flex justify-end">
        <Link
          href={`/admin/mentorships/interventions?program=${encodeURIComponent(program.name)}`}
          className="text-[13px] font-medium text-[#22262b]"
        >
          {t("seeMentorships")}
        </Link>
      </span>
    </div>
  );
}

function Interventions({
  data,
  programs,
}: {
  data: AdminOverview;
  programs: AdminProgram[];
}) {
  const t = useTranslations("adminMentorships");
  const view = useMentorshipInterventions(data, programs);
  const { filter, visible, notifyRow, detail } = view;

  return (
    <div className="space-y-4">
      <FilterBar
        filters={INTERVENTION_FILTERS.map((id) => ({
          id,
          label: t(`interventionFilters.${id}`),
          count: view.counts[id],
          dot: id === InterventionFilter.Critical,
        }))}
        filter={filter}
        onFilter={view.selectFilter}
        search={view.search}
        onSearch={view.setSearch}
        searchPlaceholder={t("searchInterventions")}
        program={view.program}
        programs={programs.map((item) => item.name)}
        onProgram={view.setProgram}
      />
      <TableShell minWidth={980}>
        <div
          className={`${interventionCols} border-b border-[#f0f2f4] px-5 py-3 text-[12px] font-medium text-[#858c96]`}
        >
          <span>{t("interventionColumns.mentorship")}</span>
          <span>{t("interventionColumns.status")}</span>
          <span>{t("interventionColumns.program")}</span>
          <span>{t("interventionColumns.issue")}</span>
          <span>{t("interventionColumns.duration")}</span>
          <span>{t("interventionColumns.coordinator")}</span>
          <span />
        </div>
        {visible.length === 0 ? (
          <EmptyNote>
            {filter === InterventionFilter.Unanswered
              ? t("noUnopened")
              : filter === InterventionFilter.Assigned
                ? t("noTracked")
                : t("noInterventions")}
          </EmptyNote>
        ) : (
          visible.map(({ row, tracked }) => {
            const critical = row.kind === InterventionKind.Critical;
            return (
              <div
                key={row.id}
                className={`${interventionCols} border-b border-[#f0f2f4] px-5 py-3.5 last:border-0`}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Pair mentor={row.mentorName} team={row.teamName} />
                  <span className="truncate text-[13.5px] font-medium text-[#22262b]">
                    {pairLabel(row)}
                  </span>
                </span>
                {tracked ? (
                  <StatusPill tone="track">{t("tracked")}</StatusPill>
                ) : (
                  <StatusPill tone={critical ? "red" : "amber"}>
                    {critical ? t("critical") : t("bottleneck")}
                  </StatusPill>
                )}
                <span className="truncate text-[13px] text-[#676e78]">
                  {row.programName}
                </span>
                <span className="truncate text-[13px] text-[#676e78]">
                  {row.issue}
                </span>
                <span
                  className={`text-[13px] font-medium ${
                    critical ? "text-[#d9464b]" : "text-[#b7791f]"
                  }`}
                >
                  {row.days == null
                    ? "—"
                    : t("stats.days", { count: row.days })}
                </span>
                <span className="truncate text-[13px] text-[#22262b]">
                  {row.coordinatorName}
                </span>
                <span className="flex items-center justify-end gap-2">
                  {tracked ? (
                    <button
                      type="button"
                      onClick={() => view.openDetail(tracked.id)}
                      className="inline-flex h-9 items-center justify-center rounded-full border border-[#e9ecef] bg-white px-3.5 text-[12.5px] font-medium text-[#22262b]"
                    >
                      {t("detail")}
                    </button>
                  ) : row.mentorshipId ? (
                    <button
                      type="button"
                      onClick={() => view.openNotify(row.mentorshipId)}
                      className={`inline-flex h-9 items-center justify-center rounded-full px-3.5 text-[12.5px] font-medium ${
                        critical
                          ? "bg-[#22262b] text-white"
                          : "border border-[#e9ecef] bg-white text-[#22262b]"
                      }`}
                    >
                      {t("notifyCoordinator")}
                    </button>
                  ) : (
                    <Link
                      href={coordinatorHref(row.coordinatorId)}
                      className="inline-flex h-9 items-center justify-center rounded-full border border-[#e9ecef] bg-white px-3.5 text-[12.5px] font-medium text-[#22262b]"
                    >
                      {t("goToCoordinator")}
                    </Link>
                  )}
                </span>
              </div>
            );
          })
        )}
      </TableShell>
      <QueryNotice isLoading={false} error={view.followError} />
      <p className="rounded-2xl bg-[#f7f8fa] px-4 py-3 text-[12.5px] leading-[1.5] text-[#676e78]">
        {t("interventionsNote")}
      </p>
      {notifyRow?.mentorshipId ? (
        <NotifyInterventionDialog
          coordinatorName={notifyRow.coordinatorName}
          pair={pairLabel(notifyRow)}
          programName={notifyRow.programName}
          signals={interventionSignals(notifyRow, t)}
          mentorshipId={notifyRow.mentorshipId}
          onClose={view.closeNotify}
          onOpened={view.notified}
        />
      ) : null}
      {detail?.tracked ? (
        <InterventionDrawer
          intervention={detail.tracked}
          mentorName={detail.row.mentorName}
          teamName={detail.row.teamName}
          programName={detail.row.programName}
          signals={interventionSignals(detail.row, t)}
          onClose={view.closeDetail}
          onResolved={view.resolved}
        />
      ) : null}
    </div>
  );
}

function Matching({
  data,
  programs,
}: {
  data: AdminOverview;
  programs: AdminProgram[];
}) {
  const t = useTranslations("adminMentorships");
  const optionLabel = useOptionLabel();
  const view = useMentorshipMatching(data, programs);
  const { filter, rows, averageWait, visible } = view;
  const waiting = rows[MatchingFilter.Waiting];
  const matched = rows[MatchingFilter.ThisWeek];
  const declined = rows[MatchingFilter.Declined];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          title={t("stats.waitingTeams")}
          value={String(waiting.length)}
          detail={t("stats.inPrograms", { count: view.waitingProgramCount })}
          dot="#d9464b"
        />
        <Stat
          title={t("stats.averageWait")}
          value={
            averageWait == null ? "—" : t("stats.days", { count: averageWait })
          }
          detail={
            averageWait == null ? t("stats.noRequestDate") : t("stats.target3")
          }
        />
        <Stat
          title={t("stats.matchedThisWeek")}
          value={String(matched.length)}
          detail={t("stats.startedLast7")}
        />
        <Stat
          title={t("stats.declined")}
          value={String(declined.length)}
          detail={
            declined.length ? t("stats.declined") : t("stats.declinedNone")
          }
        />
      </div>
      <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center">
        <FilterPills
          filters={MATCHING_FILTERS.map((id) => ({
            id,
            label: t(`matchingFilters.${id}`),
            count: rows[id].length,
          }))}
          filter={filter}
          onFilter={view.selectFilter}
        />
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2.5">
          <SearchBox
            value={view.search}
            onChange={view.setSearch}
            placeholder={t("searchTeams")}
          />
          <ProgramSelect
            value={view.program}
            programs={programs.map((item) => item.name)}
            onChange={view.setProgram}
          />
          <label className="flex h-[42px] items-center gap-2 rounded-full border border-[#e9ecef] bg-white px-4 text-[13px]">
            <span className="text-[#858c96]">{t("sortBy")}</span>
            <select
              aria-label={t("sortLabel")}
              value={view.sort}
              onChange={(event) => view.selectSort(event.target.value)}
              className="appearance-none bg-transparent font-medium text-[#22262b] outline-none"
            >
              {MATCHING_SORTS.map((sort) => (
                <option key={sort} value={sort}>
                  {t(`sorts.${sort}`)}
                </option>
              ))}
            </select>
            <AdminIcon
              src="/admin/chevron-down-sm.svg"
              width={16}
              height={16}
            />
          </label>
        </div>
      </div>
      <TableShell minWidth={980}>
        <div
          className={`${matchingCols} border-b border-[#f0f2f4] px-5 py-3 text-[12px] font-medium text-[#858c96]`}
        >
          <span>{t("matchingColumns.team")}</span>
          <span>{t("matchingColumns.program")}</span>
          <span>{t("matchingColumns.need")}</span>
          <span>{t("matchingColumns.wait")}</span>
          <span>{t("matchingColumns.suggestion")}</span>
          <span>{t("matchingColumns.coordinator")}</span>
          <span />
        </div>
        {visible.length === 0 ? (
          <EmptyNote>{t("noRecords")}</EmptyNote>
        ) : (
          visible.map((item) => (
            <div
              key={item.id}
              className={`${matchingCols} border-b border-[#f0f2f4] px-5 py-3.5 last:border-0`}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-[12px] bg-[#fff1ec] text-[11px] font-semibold text-[#e0522a]">
                  {initials(item.teamName)}
                </span>
                <span className="truncate text-[13.5px] font-medium text-[#22262b]">
                  {item.teamName}
                </span>
              </span>
              <span className="truncate text-[13px] text-[#676e78]">
                {item.programName}
              </span>
              <span>
                {item.need ? (
                  <span className="inline-flex rounded-full bg-[#fff1ec] px-2.5 py-1 text-[11.5px] font-medium text-[#e0522a]">
                    {optionLabel("supportArea", item.need)}
                  </span>
                ) : (
                  <span className="text-[13px] text-[#aeb4bc]">—</span>
                )}
              </span>
              <span className="text-[13px] font-medium text-[#22262b]">
                {item.waitDays == null
                  ? "—"
                  : t("stats.days", { count: item.waitDays })}
              </span>
              <span className="text-[13px] text-[#aeb4bc]">—</span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] text-[#22262b]">
                  {item.coordinatorName}
                </span>
                {item.missingAccess ? (
                  <span className="block text-[12px] text-[#b7791f]">
                    {t("noAccess")}
                  </span>
                ) : null}
              </span>
              <span className="flex justify-end">
                {filter === MatchingFilter.Waiting ? (
                  <Link
                    href={coordinatorHref(item.coordinatorId)}
                    className="inline-flex h-9 items-center justify-center rounded-full border border-[#e9ecef] bg-white px-3.5 text-[12.5px] font-medium text-[#22262b]"
                  >
                    {t("goToCoordinator")}
                  </Link>
                ) : (
                  <span className="text-[13px] text-[#858c96]">
                    {filter === MatchingFilter.ThisWeek
                      ? t("matched")
                      : t("declinedLabel")}
                  </span>
                )}
              </span>
            </div>
          ))
        )}
      </TableShell>
    </div>
  );
}

function TypeSelect({
  value,
  onChange,
}: {
  value: ProgramTypeFilter;
  onChange: (value: ProgramTypeFilter) => void;
}) {
  const tType = useTranslations("programTypes");
  return (
    <label className="flex h-[42px] items-center gap-2 rounded-full border border-[#e9ecef] bg-white px-4 text-[13px]">
      <span className="text-[#858c96]">{tType("label")}</span>
      <select
        aria-label={tType("label")}
        value={value}
        onChange={(event) => {
          if (isProgramTypeFilter(event.target.value)) {
            onChange(event.target.value);
          }
        }}
        className="appearance-none bg-transparent font-medium text-[#22262b] outline-none"
      >
        {PROGRAM_TYPE_FILTERS.map((option) => (
          <option key={option} value={option}>
            {tType(option)}
          </option>
        ))}
      </select>
      <AdminIcon src="/admin/chevron-down-sm.svg" width={16} height={16} />
    </label>
  );
}

function ScopeSelect({
  value,
  programs,
  onChange,
}: {
  value: string;
  programs: string[];
  onChange: (value: string) => void;
}) {
  const t = useTranslations("adminMentorships");
  return (
    <label className="flex h-[42px] items-center gap-2 rounded-full border border-[#e9ecef] bg-white px-4 text-[13px]">
      <span className="text-[#858c96]">{t("scope")}</span>
      <select
        aria-label={t("scope")}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="appearance-none bg-transparent font-medium text-[#22262b] outline-none"
      >
        <option value={ALL_PROGRAMS}>{t("allScope")}</option>
        {programs.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      <AdminIcon src="/admin/chevron-down-sm.svg" width={16} height={16} />
    </label>
  );
}

function FilterBar({
  filters,
  filter,
  onFilter,
  search,
  onSearch,
  searchPlaceholder,
  program,
  programs,
  onProgram,
}: {
  filters: FilterOption[];
  filter: string;
  onFilter: (value: string) => void;
  search: string;
  onSearch: (value: string) => void;
  searchPlaceholder: string;
  program: string;
  programs: string[];
  onProgram: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center">
      <FilterPills filters={filters} filter={filter} onFilter={onFilter} />
      <div className="flex flex-1 flex-wrap items-center justify-end gap-2.5">
        <SearchBox
          value={search}
          onChange={onSearch}
          placeholder={searchPlaceholder}
        />
        <ProgramSelect
          value={program}
          programs={programs}
          onChange={onProgram}
        />
      </div>
    </div>
  );
}

type FilterOption = { id: string; label: string; count: number; dot?: boolean };

function FilterPills({
  filters,
  filter,
  onFilter,
}: {
  filters: FilterOption[];
  filter: string;
  onFilter: (value: string) => void;
}) {
  return (
    <div className="flex w-max max-w-full gap-1 overflow-x-auto rounded-full bg-[#f5f6f8] p-1">
      {filters.map(({ id, label, count, dot }) => {
        const selected = id === filter;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onFilter(id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-[7px] text-[13px] leading-[1.3] ${
              selected
                ? "bg-white font-medium text-[#22262b] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                : "text-[#676e78]"
            }`}
          >
            {dot ? (
              <span
                aria-hidden
                className="size-[7px] rounded-full bg-[#d9464b]"
              />
            ) : null}
            {label}
            <span className="text-[12px] font-medium text-[#858c96]">
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex h-[42px] w-[260px] items-center gap-2 rounded-full border border-[#e9ecef] bg-white px-4">
      <AdminIcon src="/admin/search.svg" width={18} height={18} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-[13px] text-[#22262b] outline-none placeholder:text-[#aeb4bc]"
      />
    </label>
  );
}

function ProgramSelect({
  value,
  programs,
  onChange,
}: {
  value: string;
  programs: string[];
  onChange: (value: string) => void;
}) {
  const t = useTranslations("adminMentorships");
  return (
    <label className="flex h-[42px] items-center gap-2 rounded-full border border-[#e9ecef] bg-white px-4 text-[13px]">
      <span className="text-[#858c96]">{t("program")}</span>
      <select
        aria-label={t("programLabel")}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="max-w-[160px] appearance-none bg-transparent font-medium text-[#22262b] outline-none"
      >
        <option value={ALL_PROGRAMS}>{t("allPrograms")}</option>
        {programs.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      <AdminIcon src="/admin/chevron-down-sm.svg" width={16} height={16} />
    </label>
  );
}

function Stat({
  title,
  value,
  detail,
  dot,
  href,
}: {
  title: string;
  value: string;
  detail: string;
  dot?: string;
  href?: string;
}) {
  const body = (
    <>
      <span className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[13px] text-[#676e78]">
          {dot ? (
            <span
              aria-hidden
              className="size-[7px] rounded-full"
              style={{ background: dot }}
            />
          ) : null}
          {title}
        </span>
        {href ? (
          <AdminIcon src="/admin/chevron-right.svg" width={16} height={16} />
        ) : null}
      </span>
      <span className="mt-3 block text-[32px] leading-none font-semibold text-[#22262b]">
        {value}
      </span>
      <span className="mt-2 block text-[12.5px] text-[#858c96]">{detail}</span>
    </>
  );
  const className =
    "block rounded-[24px] border border-[#e9ecef] bg-white px-5 py-4";
  if (!href) return <article className={className}>{body}</article>;
  return (
    <Link href={href} className={className}>
      {body}
    </Link>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className="size-[7px] rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

function HealthBar({
  green,
  amber,
  red,
}: {
  green: number;
  amber: number;
  red: number;
}) {
  const parts = [
    { key: "green", count: green, color: "#a4e901" },
    { key: "amber", count: amber, color: "#ffab3d" },
    { key: "red", count: red, color: "#d9464b" },
  ].filter((part) => part.count > 0);
  const total = green + amber + red;
  if (total === 0) {
    return <span className="text-[12.5px] text-[#aeb4bc]">—</span>;
  }
  const usable = 180 - (parts.length - 1) * 3;
  return (
    <span className="flex h-2 w-[180px] gap-[3px]" aria-hidden>
      {parts.map((part) => (
        <span
          key={part.key}
          className="h-2 rounded-full"
          style={{
            width: (usable * part.count) / total,
            background: part.color,
          }}
        />
      ))}
    </span>
  );
}

function RiskCount({ count }: { count: number }) {
  if (count === 0) {
    return (
      <span className="inline-flex rounded-full bg-[#f5f6f8] px-2.5 py-1 text-[12px] font-medium text-[#676e78]">
        0
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-[#fdeeee] px-2.5 py-1 text-[12px] font-medium text-[#d9464b]">
      {count}
    </span>
  );
}

function CoordinatorName({
  program,
  data,
}: {
  program: AdminProgram;
  data: AdminOverview;
}) {
  const tCommon = useTranslations("adminCommon");
  const t = useTranslations("adminMentorships");
  const missing = missingCoordinatorAccess(data, program);
  const label = programCoordinatorLabel(program, tCommon("unassigned"));
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#fbe2d0] text-[10px] font-semibold text-[#ffab3d]">
        {initials(label)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] text-[#22262b]">
          {label}
        </span>
        {missing ? (
          <span className="block text-[12px] text-[#b7791f]">
            {t("noAccess")}
          </span>
        ) : null}
      </span>
    </span>
  );
}

function Pair({ mentor, team }: { mentor: string; team: string }) {
  return (
    <span className="flex shrink-0 items-center">
      <span className="grid size-8 place-items-center rounded-full bg-[#eaf6ff] text-[10px] font-semibold text-[#1583d6] ring-2 ring-white">
        {initials(mentor)}
      </span>
      <span className="-ml-2 grid size-8 place-items-center rounded-full bg-[#fff1ec] text-[10px] font-semibold text-[#e0522a] ring-2 ring-white">
        {initials(team)}
      </span>
    </span>
  );
}

function StatusPill({
  tone,
  children,
}: {
  tone: "red" | "amber" | "track";
  children: string;
}) {
  const style =
    tone === "red"
      ? "bg-[#fdeeee] text-[#d9464b]"
      : tone === "track"
        ? "bg-[#eef3fb] text-[#315f91]"
        : "bg-[#fff6e5] text-[#b7791f]";
  const dot =
    tone === "red"
      ? "/admin/dot-critical.svg"
      : tone === "track"
        ? "/admin/dot-info.svg"
        : "/admin/dot-warn.svg";
  return (
    <span
      className={`inline-flex w-max items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium ${style}`}
    >
      <AdminIcon src={dot} width={6} height={6} />
      {children}
    </span>
  );
}

function TableShell({
  children,
  minWidth,
}: {
  children: ReactNode;
  minWidth: number;
}) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-[#e9ecef] bg-white">
      <div className="overflow-x-auto">
        <div style={{ minWidth }}>{children}</div>
      </div>
    </div>
  );
}

const overviewCols =
  "grid w-full grid-cols-[minmax(0,1.3fr)_minmax(0,1.1fr)_72px_200px_72px_150px] items-center";
const interventionCols =
  "grid w-full grid-cols-[minmax(0,1.5fr)_110px_minmax(0,1fr)_minmax(0,1.4fr)_72px_minmax(0,1fr)_168px] items-center";
const matchingCols =
  "grid w-full grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_88px_64px_minmax(0,1fr)_190px] items-center";
