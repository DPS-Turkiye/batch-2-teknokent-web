"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";

import {
  daysSince,
  mentorshipInPrograms,
  needsAttention,
  programForOrganization,
  programOfMentorship,
  unmatchedStartups,
} from "@/components/admin/admin-model";
import { AdminIcon, EmptyNote, QueryNotice } from "@/components/admin/admin-ui";
import {
  InterventionDrawer,
  NotifyInterventionDialog,
} from "@/components/admin/intervention-follow";
import { useAdminInterventions } from "@/hooks/use-admin-interventions";
import { useAdminOverview } from "@/hooks/use-admin-overview";
import { useOptionLabel } from "@/hooks/use-option-label";
import { useToast } from "@/stores/toast-store";
import type {
  AdminMentorship,
  AdminOverview,
  AdminProgram,
  AdminRequest,
  AdminStartup,
} from "@/interfaces/admin-overview";
import { ProgramTypeChip } from "@/components/coordinator/program-type-chip";
import { programCoordinatorLabel } from "@/lib/admin-coordinators";
import {
  ALL_PROGRAM_TYPES,
  matchesProgramType,
  PROGRAM_TYPE_FILTERS,
  type ProgramTypeFilter,
} from "@/lib/program-types";
import { initials } from "@/lib/utils";
import type messages from "@/messages/tr.json";
import { ToastTone } from "@/interfaces/toast";

export type MentorshipTab = "overview" | "interventions" | "matching";

type MentorshipsT = ReturnType<typeof useTranslations<"adminMentorships">>;
type InterventionFilter =
  keyof (typeof messages)["adminMentorships"]["interventionFilters"];
type MatchingFilter =
  keyof (typeof messages)["adminMentorships"]["matchingFilters"];

/** The empty value of the scope and program selects: every program. */
const ALL = "";
const INTERVENTION_FILTERS: InterventionFilter[] = [
  "ALL",
  "CRITICAL",
  "BOTTLENECK",
  "UNANSWERED",
  "ASSIGNED",
];

export function MentorshipsView({ tab }: { tab: MentorshipTab }) {
  const t = useTranslations("adminMentorships");
  const query = useAdminOverview();
  const [scope, setScope] = useState(ALL);
  const [type, setType] = useState<ProgramTypeFilter>(ALL_PROGRAM_TYPES);
  if (!query.data) {
    return <QueryNotice isLoading={query.isLoading} error={query.error} />;
  }
  const data = query.data;
  const typed = data.programs.filter((program) =>
    matchesProgramType(program.type, type),
  );
  const programs = programsInScope(typed, scope);
  const live = programs.filter((program) => program.status === "ACTIVE");
  const attention = interventionRows(data, live, t);
  const waiting = waitingTeams(data, live);
  const tabs = [
    {
      id: "overview" as const,
      href: "/admin/mentorships",
      label: t("tabs.overview"),
    },
    {
      id: "interventions" as const,
      href: "/admin/mentorships/interventions",
      label: t("tabs.interventions"),
      count: attention.length,
      alert: true,
    },
    {
      id: "matching" as const,
      href: "/admin/mentorships/matching",
      label: t("tabs.matching"),
      count: waiting.length,
      alert: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-end gap-2.5">
        {/* TEST UI: placeholder until the design team's screen; replace when it arrives. */}
        <TypeSelect
          value={type}
          onChange={(value) => {
            setType(value);
            setScope(ALL);
          }}
        />
        <ScopeSelect
          value={scope}
          programs={typed.map((program) => program.name)}
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
      {tab === "overview" ? <Overview data={data} programs={programs} /> : null}
      {tab === "interventions" ? (
        <Interventions data={data} programs={live} />
      ) : null}
      {tab === "matching" ? <Matching data={data} programs={live} /> : null}
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
  const live = programs.filter((program) => program.status === "ACTIVE");
  const active = activeMentorships(data, live);
  const gaps = active
    .map((item) => item.daysSinceMeeting)
    .filter((value): value is number => value != null);
  const averageGap = gaps.length
    ? Math.round(gaps.reduce((sum, value) => sum + value, 0) / gaps.length)
    : null;
  const rows = interventionRows(data, live, t);
  const critical = rows.filter((row) => row.kind === "critical");
  const watch = rows.filter((row) => row.kind === "bottleneck");
  const criticalPrograms = new Set(critical.map((row) => row.programName));
  const activePrograms = new Set(
    active
      .map((item) => programOfMentorship(data, item)?.name)
      .filter((name): name is string => Boolean(name)),
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          title={t("stats.active")}
          value={String(active.length)}
          detail={t("stats.programs", { count: activePrograms.size })}
        />
        <Stat
          title={t("stats.intervention")}
          value={String(critical.length)}
          detail={t("stats.inPrograms", { count: criticalPrograms.size })}
          dot="#d9464b"
          href="/admin/mentorships/interventions"
        />
        <Stat
          title={t("stats.followUp")}
          value={String(watch.length)}
          detail={t("stats.openBottleneck")}
          dot="#ffab3d"
          href="/admin/mentorships/interventions?filter=BOTTLENECK"
        />
        <Stat
          title={t("stats.averageGap")}
          value={
            averageGap == null ? "—" : t("stats.days", { count: averageGap })
          }
          detail={gaps.length ? t("stats.target14") : t("stats.noMeetings")}
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
  const completed = program.status === "COMPLETED";
  const health = completed
    ? { green: 0, amber: 0, red: 0 }
    : mentorshipHealth(program, data);
  const active = health.green + health.amber + health.red;
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
        {completed || active === 0 ? "—" : active}
      </span>
      <span>
        {completed ? (
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
        {completed ? (
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
  const params = useSearchParams();
  const follow = useAdminInterventions();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<InterventionFilter>(
    INTERVENTION_FILTERS.find((id) => id === params.get("filter")) ?? "ALL",
  );
  const [program, setProgram] = useState(params.get("program") ?? ALL);
  const [search, setSearch] = useState("");
  const [notifyId, setNotifyId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const rows = interventionRows(data, programs, t);
  const openFollow = new Map(
    (follow.data ?? [])
      .filter((item) => item.resolvedAt == null)
      .map((item) => [item.mentorshipId, item]),
  );
  const tracked = (row: InterventionRow) =>
    row.mentorshipId ? openFollow.get(row.mentorshipId) : undefined;
  const unanswered = (row: InterventionRow) => {
    const item = tracked(row);
    return item != null && item.readAt == null;
  };
  const counts: Record<InterventionFilter, number> = {
    ALL: rows.length,
    CRITICAL: rows.filter((row) => row.kind === "critical" && !tracked(row))
      .length,
    BOTTLENECK: rows.filter((row) => row.kind === "bottleneck" && !tracked(row))
      .length,
    UNANSWERED: rows.filter(unanswered).length,
    ASSIGNED: rows.filter((row) => tracked(row) != null).length,
  };
  const visible = rows.filter((row) => {
    if (filter === "CRITICAL" && (row.kind !== "critical" || tracked(row))) {
      return false;
    }
    if (
      filter === "BOTTLENECK" &&
      (row.kind !== "bottleneck" || tracked(row))
    ) {
      return false;
    }
    if (filter === "UNANSWERED" && !unanswered(row)) return false;
    if (filter === "ASSIGNED" && !tracked(row)) return false;
    if (program !== ALL && row.programName !== program) return false;
    return `${row.mentorName} ${row.teamName} ${row.programName} ${row.issue}`
      .toLocaleLowerCase("tr")
      .includes(search.toLocaleLowerCase("tr"));
  });
  const notifyRow = rows.find((row) => row.mentorshipId === notifyId) ?? null;
  const detail = rows
    .map((row) => ({ row, item: tracked(row) }))
    .find((entry) => entry.item?.id === detailId);

  return (
    <div className="space-y-4">
      <FilterBar
        filters={INTERVENTION_FILTERS.map((id) => ({
          id,
          label: t(`interventionFilters.${id}`),
          count: counts[id],
          dot: id === "CRITICAL",
        }))}
        filter={filter}
        onFilter={(value) => setFilter(value as InterventionFilter)}
        search={search}
        onSearch={setSearch}
        searchPlaceholder={t("searchInterventions")}
        program={program}
        programs={programs.map((item) => item.name)}
        onProgram={setProgram}
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
            {filter === "UNANSWERED"
              ? t("noUnopened")
              : filter === "ASSIGNED"
                ? t("noTracked")
                : t("noInterventions")}
          </EmptyNote>
        ) : (
          visible.map((row) => (
            <div
              key={row.id}
              className={`${interventionCols} border-b border-[#f0f2f4] px-5 py-3.5 last:border-0`}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <Pair mentor={row.mentorName} team={row.teamName} />
                <span className="truncate text-[13.5px] font-medium text-[#22262b]">
                  {row.mentorName} ↔ {row.teamName}
                </span>
              </span>
              {tracked(row) ? (
                <StatusPill tone="track">{t("tracked")}</StatusPill>
              ) : (
                <StatusPill tone={row.kind === "critical" ? "red" : "amber"}>
                  {row.kind === "critical" ? t("critical") : t("bottleneck")}
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
                  row.kind === "critical" ? "text-[#d9464b]" : "text-[#b7791f]"
                }`}
              >
                {row.days == null ? "—" : t("stats.days", { count: row.days })}
              </span>
              <span className="truncate text-[13px] text-[#22262b]">
                {row.coordinatorName}
              </span>
              <span className="flex items-center justify-end gap-2">
                {tracked(row) ? (
                  <button
                    type="button"
                    onClick={() => setDetailId(tracked(row)?.id ?? null)}
                    className="inline-flex h-9 items-center justify-center rounded-full border border-[#e9ecef] bg-white px-3.5 text-[12.5px] font-medium text-[#22262b]"
                  >
                    {t("detail")}
                  </button>
                ) : row.mentorshipId ? (
                  <button
                    type="button"
                    onClick={() => setNotifyId(row.mentorshipId)}
                    className={`inline-flex h-9 items-center justify-center rounded-full px-3.5 text-[12.5px] font-medium ${
                      row.kind === "critical"
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
          ))
        )}
      </TableShell>
      <QueryNotice
        isLoading={false}
        error={follow.error instanceof Error ? follow.error : null}
      />
      <p className="rounded-2xl bg-[#f7f8fa] px-4 py-3 text-[12.5px] leading-[1.5] text-[#676e78]">
        {t("interventionsNote")}
      </p>
      {notifyRow?.mentorshipId ? (
        <NotifyInterventionDialog
          coordinatorName={notifyRow.coordinatorName}
          pair={`${notifyRow.mentorName} ↔ ${notifyRow.teamName}`}
          programName={notifyRow.programName}
          signals={signalsOf(notifyRow, t)}
          mentorshipId={notifyRow.mentorshipId}
          onClose={() => setNotifyId(null)}
          onOpened={() => {
            const name = notifyRow.coordinatorName;
            const pair = `${notifyRow.mentorName} ↔ ${notifyRow.teamName}`;
            setNotifyId(null);
            showToast({
              title: t("notifiedTitle", { name }),
              message: t("notifiedBody", { pair }),
              tone: ToastTone.Success,
            });
          }}
        />
      ) : null}
      {detail?.item ? (
        <InterventionDrawer
          intervention={detail.item}
          mentorName={detail.row.mentorName}
          teamName={detail.row.teamName}
          programName={detail.row.programName}
          signals={signalsOf(detail.row, t)}
          onClose={() => setDetailId(null)}
          onResolved={() => {
            setDetailId(null);
            showToast({
              message: t("resolved"),
              tone: ToastTone.Success,
            });
          }}
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
  const [filter, setFilter] = useState<MatchingFilter>("WAITING");
  const [program, setProgram] = useState(ALL);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"WAIT" | "NAME">("WAIT");
  const waiting = waitingTeams(data, programs);
  const matched = matchedThisWeek(data, programs);
  const declined = declinedRequests(data, programs);
  const waits = waiting
    .map((item) => item.waitDays)
    .filter((value): value is number => value != null);
  const averageWait = waits.length
    ? Math.round(
        (waits.reduce((sum, value) => sum + value, 0) / waits.length) * 10,
      ) / 10
    : null;
  const waitingPrograms = new Set(waiting.map((item) => item.programName));
  const counts: Record<MatchingFilter, number> = {
    WAITING: waiting.length,
    THIS_WEEK: matched.length,
    DECLINED: declined.length,
  };
  const visible = (() => {
    const source =
      filter === "THIS_WEEK"
        ? matched
        : filter === "DECLINED"
          ? declined
          : waiting;
    const rows = source.filter((item) => {
      if (program !== ALL && item.programName !== program) {
        return false;
      }
      return `${item.teamName} ${item.programName} ${item.need}`
        .toLocaleLowerCase("tr")
        .includes(search.toLocaleLowerCase("tr"));
    });
    if (sort === "NAME") {
      return [...rows].sort((a, b) =>
        a.teamName.localeCompare(b.teamName, "tr"),
      );
    }
    return [...rows].sort((a, b) => (b.waitDays ?? -1) - (a.waitDays ?? -1));
  })();

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          title={t("stats.waitingTeams")}
          value={String(waiting.length)}
          detail={t("stats.inPrograms", { count: waitingPrograms.size })}
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
          filters={(["WAITING", "THIS_WEEK", "DECLINED"] as const).map(
            (id) => ({
              id,
              label: t(`matchingFilters.${id}`),
              count: counts[id],
            }),
          )}
          filter={filter}
          onFilter={(value) => setFilter(value as MatchingFilter)}
        />
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2.5">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder={t("searchTeams")}
          />
          <ProgramSelect
            value={program}
            programs={programs.map((item) => item.name)}
            onChange={setProgram}
          />
          <label className="flex h-[42px] items-center gap-2 rounded-full border border-[#e9ecef] bg-white px-4 text-[13px]">
            <span className="text-[#858c96]">{t("sortBy")}</span>
            <select
              aria-label={t("sortLabel")}
              value={sort}
              onChange={(event) =>
                setSort(event.target.value as "WAIT" | "NAME")
              }
              className="appearance-none bg-transparent font-medium text-[#22262b] outline-none"
            >
              <option value="WAIT">{t("sorts.WAIT")}</option>
              <option value="NAME">{t("sorts.NAME")}</option>
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
                {filter === "WAITING" ? (
                  <Link
                    href={coordinatorHref(item.coordinatorId)}
                    className="inline-flex h-9 items-center justify-center rounded-full border border-[#e9ecef] bg-white px-3.5 text-[12.5px] font-medium text-[#22262b]"
                  >
                    {t("goToCoordinator")}
                  </Link>
                ) : (
                  <span className="text-[13px] text-[#858c96]">
                    {filter === "THIS_WEEK" ? t("matched") : t("declinedLabel")}
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
        onChange={(event) => onChange(event.target.value as ProgramTypeFilter)}
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
        <option value={ALL}>{t("allScope")}</option>
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
        <option value={ALL}>{t("allPrograms")}</option>
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
  const coordinator = data.users.find(
    (user) => user.id === program.coordinatorId,
  );
  const missing = coordinator != null && coordinator.status !== "APPROVED";
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

function signalsOf(row: InterventionRow, t: MentorshipsT) {
  const stale = row.days != null && row.days >= 14;
  const signals: { label: string; value: string; alert?: boolean }[] = [
    {
      label: t("signals.lastMeeting"),
      value:
        row.days == null
          ? "—"
          : row.noMeeting
            ? t("signals.noRecord")
            : t("signals.daysAgo", { days: row.days }),
      alert: stale || row.noMeeting,
    },
  ];
  if (row.goalTotal != null && row.goalTotal > 0) {
    signals.push({
      label: t("signals.tasks"),
      value: `${row.goalDone ?? 0} / ${row.goalTotal}`,
      alert: (row.goalDone ?? 0) === 0,
    });
  }
  signals.push({ label: t("signals.issue"), value: row.issue });
  return signals;
}

function coordinatorHref(coordinatorId: string | null) {
  return coordinatorId
    ? `/admin/users?user=${encodeURIComponent(coordinatorId)}`
    : "/admin/users";
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

type InterventionRow = {
  id: string;
  mentorshipId: string | null;
  kind: "critical" | "bottleneck";
  mentorName: string;
  teamName: string;
  programName: string;
  coordinatorName: string;
  coordinatorId: string | null;
  issue: string;
  /** A critical pair that has never met; the issue then starts with "no meeting recorded". */
  noMeeting: boolean;
  days: number | null;
  goalDone: number | null;
  goalTotal: number | null;
};

type MatchRow = {
  id: string;
  teamName: string;
  programName: string;
  coordinatorName: string;
  coordinatorId: string | null;
  missingAccess: boolean;
  need: string | null;
  waitDays: number | null;
};

function programsInScope(programs: AdminProgram[], scope: string) {
  if (scope === ALL) return programs;
  return programs.filter((program) => program.name === scope);
}

function activeMentorships(data: AdminOverview, programs: AdminProgram[]) {
  return data.mentorships.filter(
    (item) => item.status === "ACTIVE" && mentorshipInPrograms(item, programs),
  );
}

function organizationIds(programs: AdminProgram[]) {
  return new Set(
    programs.flatMap((program) =>
      program.startups.map((startup) => startup.id),
    ),
  );
}

function mentorshipHealth(program: AdminProgram, data: AdminOverview) {
  let green = 0;
  let amber = 0;
  let red = 0;
  for (const item of activeMentorships(data, [program])) {
    if (needsAttention(item)) red += 1;
    else if (hasBottleneck(data, item.organizationId)) amber += 1;
    else green += 1;
  }
  return { green, amber, red };
}

function hasBottleneck(data: AdminOverview, organizationId: string) {
  return data.bottlenecks.some(
    (item) => item.organizationId === organizationId,
  );
}

function interventionRows(
  data: AdminOverview,
  programs: AdminProgram[],
  t: MentorshipsT,
): InterventionRow[] {
  const ids = organizationIds(programs);
  const covered = new Set<string>();
  const rows: InterventionRow[] = [];
  for (const item of data.mentorships) {
    if (!mentorshipInPrograms(item, programs) || !needsAttention(item)) {
      continue;
    }
    const program = programOfMentorship(data, item);
    const blocks = data.bottlenecks.filter(
      (block) => block.organizationId === item.organizationId,
    );
    covered.add(item.organizationId);
    rows.push({
      id: item.id,
      mentorshipId: item.id,
      kind: "critical",
      mentorName: item.mentorName,
      teamName: item.organizationName,
      programName: program?.name ?? "—",
      coordinatorName: program?.coordinatorName ?? "—",
      coordinatorId: program?.coordinatorId ?? null,
      issue: [
        item.daysSinceMeeting == null
          ? t("noMeetingRecord")
          : t("lastMeeting", { days: item.daysSinceMeeting }),
        ...blocks.map((block) => block.title),
      ].join(" · "),
      noMeeting: item.daysSinceMeeting == null,
      days: item.daysSinceMeeting ?? daysSince(item.startDate),
      goalDone: item.goalDone ?? null,
      goalTotal: item.goalTotal ?? null,
    });
  }
  const grouped = new Map<string, typeof data.bottlenecks>();
  for (const block of data.bottlenecks) {
    if (!ids.has(block.organizationId) || covered.has(block.organizationId)) {
      continue;
    }
    const list = grouped.get(block.organizationId) ?? [];
    list.push(block);
    grouped.set(block.organizationId, list);
  }
  for (const [organizationId, blocks] of grouped) {
    const program = programForOrganization(data, organizationId);
    const mentorship = data.mentorships.find(
      (item) =>
        item.organizationId === organizationId && item.status === "ACTIVE",
    );
    const oldest = blocks.reduce(
      (min, block) => (block.createdAt < min ? block.createdAt : min),
      blocks[0].createdAt,
    );
    rows.push({
      id: blocks.map((block) => block.id).join(":"),
      mentorshipId: mentorship?.id ?? null,
      kind: "bottleneck",
      mentorName: mentorship?.mentorName ?? t("noMentor"),
      teamName: blocks[0].organizationName,
      programName: program?.name ?? "—",
      coordinatorName: program?.coordinatorName ?? "—",
      coordinatorId: program?.coordinatorId ?? null,
      issue: blocks.map((block) => block.title).join(" · "),
      noMeeting: false,
      days: daysSinceInstant(oldest),
      goalDone: mentorship?.goalDone ?? null,
      goalTotal: mentorship?.goalTotal ?? null,
    });
  }
  return rows;
}

function waitingTeams(
  data: AdminOverview,
  programs: AdminProgram[],
): MatchRow[] {
  const ids = organizationIds(programs);
  return unmatchedStartups(data)
    .filter((startup) => ids.has(startup.id))
    .map((startup) => toMatchRow(data, startup, openRequest(data, startup.id)));
}

function matchedThisWeek(
  data: AdminOverview,
  programs: AdminProgram[],
): MatchRow[] {
  return activeMentorships(data, programs)
    .filter((item) => {
      const age = daysSince(item.startDate);
      return age >= 0 && age <= 7;
    })
    .map((item) => mentorshipMatchRow(data, item));
}

function declinedRequests(
  data: AdminOverview,
  programs: AdminProgram[],
): MatchRow[] {
  const ids = organizationIds(programs);
  return data.requests
    .filter(
      (item) => item.status === "DECLINED" && ids.has(item.organizationId),
    )
    .map((item) => requestMatchRow(data, item));
}

function toMatchRow(
  data: AdminOverview,
  startup: AdminStartup,
  request: AdminRequest | null,
): MatchRow {
  const program = data.programs.find((item) => item.id === startup.programId);
  return {
    id: `${startup.programId}:${startup.id}`,
    teamName: startup.name,
    programName: startup.programName,
    coordinatorName: program?.coordinatorName ?? "—",
    coordinatorId: program?.coordinatorId ?? null,
    missingAccess: missingCoordinatorAccess(data, program),
    need: request?.supportArea ?? null,
    waitDays: request ? daysSinceInstant(request.createdAt) : null,
  };
}

function mentorshipMatchRow(
  data: AdminOverview,
  item: AdminMentorship,
): MatchRow {
  const program = programOfMentorship(data, item);
  return {
    id: item.id,
    teamName: item.organizationName,
    programName: program?.name ?? "—",
    coordinatorName: program?.coordinatorName ?? "—",
    coordinatorId: program?.coordinatorId ?? null,
    missingAccess: missingCoordinatorAccess(data, program),
    need: null,
    waitDays: null,
  };
}

function requestMatchRow(data: AdminOverview, item: AdminRequest): MatchRow {
  const program = programForOrganization(data, item.organizationId);
  return {
    id: item.id,
    teamName: item.organizationName,
    programName: program?.name ?? "—",
    coordinatorName: program?.coordinatorName ?? "—",
    coordinatorId: program?.coordinatorId ?? null,
    missingAccess: missingCoordinatorAccess(data, program),
    need: item.supportArea,
    waitDays: daysSinceInstant(item.createdAt),
  };
}

function openRequest(data: AdminOverview, organizationId: string) {
  return (
    data.requests.find(
      (item) =>
        item.organizationId === organizationId &&
        (item.status === "PENDING" ||
          item.status === "MORE_INFO_REQUESTED" ||
          item.status === "COUNTER_PROPOSED"),
    ) ?? null
  );
}

function missingCoordinatorAccess(
  data: AdminOverview,
  program: AdminProgram | undefined,
) {
  if (!program) return false;
  const coordinator = data.users.find(
    (user) => user.id === program.coordinatorId,
  );
  return coordinator != null && coordinator.status !== "APPROVED";
}

function daysSinceInstant(value: string) {
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000),
  );
}
