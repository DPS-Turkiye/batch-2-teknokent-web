"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  AdminIcon,
  AdminOverlay,
  EmptyNote,
  QueryNotice,
} from "@/components/admin/admin-ui";
import { MeetingFeedbackList } from "@/components/admin/meeting-feedback-list";
import { MeetingRatingsSection } from "@/components/admin/meeting-ratings-section";
import { ProgramTypeChip } from "@/components/coordinator/program-type-chip";
import { useAdminOverview } from "@/hooks/use-admin-overview";
import { useAdminReporting } from "@/hooks/use-admin-reporting";
import type {
  AdminMeetingMark,
  AdminOverview,
  AdminProgram,
} from "@/interfaces/admin-overview";
import { MeetingStatus } from "@/interfaces/meeting";
import type { ProgramMeetingRatings } from "@/interfaces/program-report";
import { coordinatorUsersHref } from "@/lib/admin-model";
import {
  activityCounts,
  bottlenecksOpenedThisWeek,
  cellState,
  countSummaryRows,
  csvText,
  flagCounts,
  flagListCounts,
  formatPercent,
  gapTop,
  goalRate,
  meetingCount,
  meetingRate,
  meetingSummaryRows,
  pairsWithMeeting,
  pairWeekPoints,
  programSummaryRows,
  REPORT_RANGES,
  reportTabs,
  weekLabel,
  type ReportPair,
  type WeekPoint,
} from "@/lib/admin-reporting";
import { satisfactionKpi } from "@/lib/meeting-ratings";
import { isProgramTypeFilter, PROGRAM_TYPE_FILTERS } from "@/lib/program-types";
import { initials } from "@/lib/utils";
import { HeatCell, ReportTab } from "@/types/admin-reporting";

export function ReportingView() {
  const query = useAdminOverview();
  if (!query.data) {
    return <QueryNotice isLoading={query.isLoading} error={query.error} />;
  }
  return <ProgramReporting data={query.data} />;
}

/**
 * Raporlama's numbers. The admin picks any program; a coordinator's Program raporu passes `fixedProgram`, which
 * hides the program picker and Sistem Aktivitesi (its data carries no user list).
 */
export function ProgramReporting({
  data,
  fixedProgram = false,
}: {
  data: AdminOverview;
  fixedProgram?: boolean;
}) {
  const t = useTranslations("adminReporting");
  const tType = useTranslations("programTypes");
  const {
    type,
    chooseType,
    programs,
    program,
    chooseProgram,
    range,
    setRange,
    tab,
    setTab,
    weeks,
    pairs,
    selected,
    selectPair,
    ratingsFrom,
    ratingsQuery,
  } = useAdminReporting(data);
  const [notice, setNotice] = useState<{ title: string; body: string } | null>(
    null,
  );
  const meetingsKnown = data.meetings != null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <p className="flex flex-wrap items-center gap-2 text-[13px] text-[#858c96]">
          {program ? (
            <>
              {`${program.name} · ${t(`ranges.${range}`)}`}
              <ProgramTypeChip type={program.type} />
            </>
          ) : (
            t("noProgram")
          )}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {/* TEST UI: placeholder until the design team's screen; replace when it arrives. */}
          <label
            className={`${fixedProgram ? "hidden" : "flex"} h-[42px] items-center gap-2 rounded-full border border-[#e9ecef] bg-white px-4 text-[13px]`}
          >
            <span className="text-[#858c96]">{tType("label")}</span>
            <select
              aria-label={tType("label")}
              value={type}
              onChange={(event) => {
                if (!isProgramTypeFilter(event.target.value)) return;
                chooseType(event.target.value);
              }}
              className="appearance-none bg-transparent font-medium text-[#22262b] outline-none"
            >
              {PROGRAM_TYPE_FILTERS.map((option) => (
                <option key={option} value={option}>
                  {tType(option)}
                </option>
              ))}
            </select>
            <AdminIcon
              src="/admin/chevron-down-sm.svg"
              width={16}
              height={16}
            />
          </label>
          <label
            className={`${fixedProgram ? "hidden" : "flex"} h-[42px] items-center gap-2 rounded-full border border-[#e9ecef] bg-white px-4 text-[13px]`}
          >
            <span className="text-[#858c96]">{t("program")}</span>
            <select
              aria-label={t("programLabel")}
              value={program?.id ?? ""}
              onChange={(event) => chooseProgram(event.target.value)}
              className="max-w-[180px] appearance-none bg-transparent font-medium text-[#22262b] outline-none"
            >
              {programs.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <AdminIcon
              src="/admin/chevron-down-sm.svg"
              width={16}
              height={16}
            />
          </label>
          <div className="flex rounded-full bg-[#f5f6f8] p-1">
            {REPORT_RANGES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRange(item)}
                className={`rounded-full px-3.5 py-[7px] text-[13px] ${
                  range === item
                    ? "bg-white font-medium text-[#22262b] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                    : "text-[#676e78]"
                }`}
              >
                {t(`ranges.${item}`)}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              downloadCsv("program-ozeti.csv", programSummaryRows(program, t))
            }
            className="rounded-full border border-[#e9ecef] bg-white px-4 py-[10px] text-[13px] font-medium text-[#22262b]"
          >
            {t("export")}
          </button>
        </div>
      </div>

      <div className="flex border-b border-[#e9ecef]">
        {reportTabs(fixedProgram).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className="flex flex-1 flex-col items-center gap-3 px-4"
          >
            <span
              className={`text-[14.5px] leading-[1.3] ${
                tab === id ? "font-semibold text-[#22262b]" : "text-[#676e78]"
              }`}
            >
              {t(`tabs.${id}`)}
            </span>
            <span
              className={`h-[2.5px] w-full rounded-sm ${tab === id ? "bg-[#22262b]" : ""}`}
            />
          </button>
        ))}
      </div>

      {tab === ReportTab.Activity ? (
        <Activity data={data} pairs={pairs} weeks={weeks} />
      ) : (
        <>
          <div className="flex items-start justify-between gap-4 rounded-2xl bg-[#f7f8fa] px-4 py-3">
            <p className="text-[12.5px] leading-[1.5] text-[#676e78]">
              {t("privacy")}
            </p>
            <button
              type="button"
              onClick={() =>
                setNotice({
                  title: t("whatVisible"),
                  body: t("whatVisibleBody"),
                })
              }
              className="shrink-0 text-[12.5px] font-medium text-[#22262b]"
            >
              {t("whatVisibleLink")}
            </button>
          </div>
          {tab === ReportTab.Program ? (
            <Kpis
              data={data}
              pairs={pairs}
              weeks={weeks}
              meetingsKnown={meetingsKnown}
              ratings={ratingsQuery.data}
            />
          ) : null}
          <Heatmap
            pairs={pairs}
            weeks={weeks}
            meetings={data.meetings ?? []}
            meetingsKnown={meetingsKnown}
            selectedId={selected?.id ?? null}
            onSelect={selectPair}
          />
          {selected ? (
            <PairDetail
              pair={selected}
              weeks={weeks}
              meetings={data.meetings ?? []}
              program={program}
            />
          ) : null}
          {tab === ReportTab.Program ? (
            <MeetingRatingsSection
              ratings={ratingsQuery.data}
              isLoading={ratingsQuery.isLoading}
              error={ratingsQuery.error}
              details={
                program ? (
                  <MeetingFeedbackList
                    key={`${program.id}:${ratingsFrom ?? "all"}`}
                    programId={program.id}
                    from={ratingsFrom}
                  />
                ) : null
              }
            />
          ) : null}
          {tab === ReportTab.Program ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
              <Flags pairs={pairs} />
              <Exports program={program} pairs={pairs} />
            </div>
          ) : null}
        </>
      )}

      {notice ? (
        <AdminOverlay label={notice.title} onClose={() => setNotice(null)}>
          <div
            className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-[0_16px_48px_rgba(33,38,43,0.14)]"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-[18px] font-semibold text-[#22262b]">
              {notice.title}
            </h2>
            <p className="mt-2 text-[13.5px] leading-[1.5] text-[#676e78]">
              {notice.body}
            </p>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="mt-5 rounded-full bg-[#22262b] px-5 py-[11px] text-[13.5px] font-medium text-white"
            >
              {t("ok")}
            </button>
          </div>
        </AdminOverlay>
      ) : null}
    </div>
  );
}

function Kpis({
  data,
  pairs,
  weeks,
  meetingsKnown,
  ratings,
}: {
  data: AdminOverview;
  pairs: ReportPair[];
  weeks: Date[];
  meetingsKnown: boolean;
  ratings: ProgramMeetingRatings | undefined;
}) {
  const t = useTranslations("adminReporting.kpis");
  const tRatings = useTranslations("meetingRatings");
  const locale = useLocale();
  const satisfaction = satisfactionKpi(ratings, tRatings, locale);
  const rate = meetingRate(pairs, data.meetings ?? [], weeks);
  const goals = goalRate(pairs);
  const flags = flagCounts(pairs);
  const openedThisWeek = bottlenecksOpenedThisWeek(data.bottlenecks, pairs);
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <Kpi
        title={t("meetingRate")}
        value={rate == null ? "—" : formatPercent(rate.percent, locale)}
        detail={
          rate == null
            ? meetingsKnown
              ? t("noPlanned")
              : t("noMeetingDates")
            : t("rateDetail", {
                completed: rate.completed,
                planned: rate.planned,
              })
        }
      />
      <Kpi title={t("communication")} value="—" detail={t("noMessages")} />
      <Kpi
        title={t("tasks")}
        value={goals == null ? "—" : formatPercent(goals.percent, locale)}
        detail={
          goals == null
            ? t("noGoals")
            : t("goalsDetail", { done: goals.done, total: goals.total })
        }
      />
      <Kpi
        title={t("satisfaction")}
        value={satisfaction.value}
        detail={satisfaction.detail}
      />
      <Kpi
        title={t("flags")}
        value={String(flags.red + flags.amber)}
        detail={
          openedThisWeek
            ? t("flagsThisWeek", {
                red: flags.red,
                amber: flags.amber,
                week: openedThisWeek,
              })
            : t("flagsDetail", { red: flags.red, amber: flags.amber })
        }
        valueClass={flags.red > 0 ? "text-[#d9464b]" : undefined}
      />
    </div>
  );
}

function Heatmap({
  pairs,
  weeks,
  meetings,
  meetingsKnown,
  selectedId,
  onSelect,
}: {
  pairs: ReportPair[];
  weeks: Date[];
  meetings: AdminMeetingMark[];
  meetingsKnown: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const t = useTranslations("adminReporting.heatmap");
  const locale = useLocale();
  const withMeeting = pairsWithMeeting(pairs, weeks, meetings, meetingsKnown);
  const [tip, setTip] = useState<{
    x: number;
    y: number;
    below: boolean;
    body: string;
  } | null>(null);
  return (
    <section className="overflow-hidden rounded-[28px] border border-[#e9ecef] bg-white">
      <div className="flex flex-wrap items-end justify-between gap-3 px-5 pt-5">
        <div>
          <h2 className="text-[15px] font-semibold text-[#22262b]">
            {t("title")}
          </h2>
          <p className="mt-1 text-[12.5px] text-[#858c96]">{t("hint")}</p>
        </div>
        <p className="flex flex-wrap gap-3 text-[12px] text-[#858c96]">
          <Swatch color="#e7f6d4" label={t("held")} />
          <Swatch color="#fde8e8" label={t("missed")} />
          <Swatch color="#f5f6f8" label={t("unknown")} />
        </p>
      </div>
      {pairs.length === 0 ? (
        <EmptyNote>{t("empty")}</EmptyNote>
      ) : (
        <div className="overflow-x-auto px-3 pb-2">
          <table className="w-full min-w-[760px] border-separate border-spacing-1">
            <thead>
              <tr className="text-[11px] font-medium text-[#858c96]">
                <th className="px-2 py-2 text-left font-medium">{t("pair")}</th>
                {weeks.map((week, index) => (
                  <th
                    key={week.toISOString()}
                    className="px-1 py-2 font-medium"
                  >
                    {t("week", { n: index + 1 })}
                  </th>
                ))}
                <th className="px-2 py-2 font-medium">{t("flag")}</th>
              </tr>
            </thead>
            <tbody>
              {pairs.map((pair) => (
                <tr
                  key={pair.id}
                  onClick={() => onSelect(pair.id)}
                  className="cursor-pointer"
                >
                  <td className="px-2 py-1">
                    <span className="flex items-center gap-2">
                      <PairMarks
                        mentor={pair.mentorName}
                        team={pair.organizationName}
                      />
                      <span className="truncate text-[13px] font-medium text-[#22262b]">
                        {pair.mentorName} ↔ {pair.organizationName}
                      </span>
                    </span>
                  </td>
                  {weeks.map((week) => {
                    const state = cellState(
                      pair,
                      week,
                      meetings,
                      meetingsKnown,
                    );
                    const count = meetingCount(
                      pair,
                      week,
                      meetings,
                      MeetingStatus.Completed,
                    );
                    const body = t("tip", {
                      pair: `${pair.mentorName} ↔ ${pair.organizationName}`,
                      week: weekLabel(week, locale),
                      completed: meetingsKnown ? count : "—",
                      bottlenecks: pair.bottlenecks,
                    });
                    return (
                      <td key={week.toISOString()} className="px-0.5 py-1">
                        <button
                          type="button"
                          onClick={() => onSelect(pair.id)}
                          onMouseEnter={(event) => {
                            const rect =
                              event.currentTarget.getBoundingClientRect();
                            const below = rect.top < 110;
                            setTip({
                              x: rect.left + rect.width / 2,
                              y: below ? rect.bottom + 8 : rect.top - 8,
                              below,
                              body,
                            });
                          }}
                          onMouseLeave={() => setTip(null)}
                          className={`grid h-9 w-full min-w-9 place-items-center rounded-[10px] text-[12px] font-medium ${cellClass(state)} ${
                            selectedId === pair.id
                              ? "ring-2 ring-[#22262b]"
                              : ""
                          }`}
                        >
                          {state === HeatCell.Unknown ? "—" : count}
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-2 py-1 text-center text-[12px]">
                    {pair.stale ? (
                      <span className="text-[#d9464b]">{t("noMeeting")}</span>
                    ) : pair.bottlenecks > 0 ? (
                      <span className="text-[#b7791f]">{t("bottleneck")}</span>
                    ) : (
                      <span className="text-[#aeb4bc]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tip
        ? createPortal(
            <span
              className="pointer-events-none fixed z-50 w-52 rounded-2xl bg-[#22262b] px-3 py-2 text-left text-[12px] leading-[1.45] whitespace-pre-line text-white"
              style={{
                left: tip.x,
                top: tip.y,
                transform: tip.below
                  ? "translate(-50%, 0)"
                  : "translate(-50%, -100%)",
              }}
            >
              {tip.body}
            </span>,
            document.body,
          )
        : null}
      <p className="px-5 py-3 text-[12px] text-[#858c96]">
        {t("summary", { withMeeting, total: pairs.length })}
      </p>
    </section>
  );
}

function PairDetail({
  pair,
  weeks,
  meetings,
  program,
}: {
  pair: ReportPair;
  weeks: Date[];
  meetings: AdminMeetingMark[];
  program: AdminProgram | null;
}) {
  const t = useTranslations("adminReporting.pair");
  const tHeat = useTranslations("adminReporting.heatmap");
  const goals = pair.goalTotal > 0 ? `${pair.goalDone}/${pair.goalTotal}` : "—";
  const rows = pairWeekPoints(pair, weeks, meetings, (index) =>
    tHeat("week", { n: index + 1 }),
  );
  return (
    <section className="rounded-[28px] border border-[#e9ecef] bg-white p-5">
      <div className="flex items-center gap-2">
        <PairMarks mentor={pair.mentorName} team={pair.organizationName} />
        <div>
          <p className="text-[15px] font-semibold text-[#22262b]">
            {pair.mentorName} ↔ {pair.organizationName}
          </p>
          <p className="text-[12.5px] text-[#858c96]">
            {program?.name}
            {program
              ? t("coordinator", { name: program.coordinatorName ?? "—" })
              : ""}
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_220px]">
        <ChartCard title={t("trend")} detail={t("trendHint")}>
          <GapLine rows={rows} />
        </ChartCard>
        <ChartCard
          title={t("burn")}
          legend={
            <span className="flex gap-3 text-[11px] text-[#858c96]">
              <LegendDot color="#c6ef6a" label={t("planned")} />
              <LegendDot color="#2f9e6b" label={t("completed")} />
            </span>
          }
        >
          <BurnChart rows={rows} />
        </ChartCard>
        <dl className="space-y-2 self-center text-[13px]">
          <Row label={t("goal")} value={goals} />
          <Row
            label={t("lastMeeting")}
            value={
              pair.daysSinceMeeting == null
                ? t("noRecord")
                : t("daysAgo", { days: pair.daysSinceMeeting })
            }
          />
          <Row label={t("openBottlenecks")} value={String(pair.bottlenecks)} />
          <Row label={t("flag")} value={pair.stale ? t("staleFlag") : "—"} />
        </dl>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href={coordinatorUsersHref(program)}
          className="rounded-full bg-[#22262b] px-4 py-2 text-[13px] font-medium text-white"
        >
          {t("goToCoordinator")}
        </Link>
        <Link
          href={`/admin/mentorships/interventions?program=${encodeURIComponent(program?.name ?? "")}`}
          className="rounded-full border border-[#e9ecef] px-4 py-2 text-[13px] font-medium text-[#22262b]"
        >
          {t("goToMentorship")}
        </Link>
      </div>
    </section>
  );
}

function ChartCard({
  title,
  detail,
  legend,
  children,
}: {
  title: string;
  detail?: string;
  legend?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[20px] border border-[#f0f2f4] px-4 pt-3 pb-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13.5px] font-medium text-[#22262b]">{title}</p>
          {detail ? (
            <p className="mt-0.5 text-[12px] text-[#858c96]">{detail}</p>
          ) : null}
        </div>
        {legend}
      </div>
      {children}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className="size-2 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

const axisTick = { fill: "#aeb4bc", fontSize: 11 };
const tooltipStyle = {
  border: "1px solid #e9ecef",
  borderRadius: 12,
  fontSize: 12,
  boxShadow: "none",
};

function GapLine({ rows }: { rows: WeekPoint[] }) {
  const t = useTranslations("adminReporting.pair");
  const top = gapTop(rows);
  return (
    <div className="mt-2 h-[190px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={rows}
          margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
        >
          <CartesianGrid vertical={false} stroke="#f0f2f4" />
          <XAxis
            dataKey="week"
            tick={axisTick}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            domain={[0, top]}
          />
          <ReferenceLine y={top / 2} stroke="#e7a3a8" strokeDasharray="4 4" />
          <Tooltip contentStyle={tooltipStyle} />
          <Line
            type="monotone"
            dataKey="gap"
            name={t("days")}
            stroke="#22262b"
            strokeWidth={2}
            connectNulls={false}
            dot={{ r: 3.5, fill: "#22262b", strokeWidth: 0 }}
            activeDot={{ r: 4.5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function BurnChart({ rows }: { rows: WeekPoint[] }) {
  const t = useTranslations("adminReporting.pair");
  const fillId = useId().replace(/:/g, "");
  return (
    <div className="mt-2 h-[190px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={rows}
          margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
        >
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b6ef4a" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#b6ef4a" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#f0f2f4" />
          <XAxis
            dataKey="week"
            tick={axisTick}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            domain={[0, (max: number) => Math.max(4, max)]}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Area
            type="monotone"
            dataKey="planned"
            name={t("planned")}
            stroke="#c6ef6a"
            strokeWidth={2}
            fill={`url(#${fillId})`}
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="completed"
            name={t("completed")}
            stroke="#2f9e6b"
            strokeWidth={2}
            fill="transparent"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function Flags({ pairs }: { pairs: ReportPair[] }) {
  const t = useTranslations("adminReporting.flags");
  const counts = flagListCounts(pairs);
  const rows = [
    { label: t("stale"), count: counts.stale },
    { label: t("bottleneck"), count: counts.bottleneck },
    { label: t("lowGoals"), count: counts.lowGoals },
  ];
  return (
    <section className="rounded-[28px] border border-[#e9ecef] bg-white p-5">
      <h2 className="text-[15px] font-semibold text-[#22262b]">{t("title")}</h2>
      <p className="mt-1 text-[12.5px] text-[#858c96]">{t("hint")}</p>
      <ul className="mt-4 space-y-2">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex items-center justify-between gap-3 rounded-2xl border border-[#f0f2f4] px-4 py-3"
          >
            <span className="text-[13.5px] text-[#22262b]">{row.label}</span>
            <span className="text-[13px] font-medium text-[#676e78]">
              {t("count", { count: row.count })}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Exports({
  program,
  pairs,
}: {
  program: AdminProgram | null;
  pairs: ReportPair[];
}) {
  const t = useTranslations("adminReporting");
  const items = [
    {
      label: t("exports.summary"),
      file: "program-ozeti.csv",
      rows: programSummaryRows(program, t),
    },
    {
      label: t("exports.meetings"),
      file: "gorusme-ozeti.csv",
      rows: meetingSummaryRows(pairs, t),
    },
    {
      label: t("exports.counts"),
      file: "sayi-ozeti.csv",
      rows: countSummaryRows(pairs, t),
    },
  ];
  return (
    <section className="rounded-[28px] border border-[#e9ecef] bg-white p-5">
      <h2 className="text-[15px] font-semibold text-[#22262b]">
        {t("exports.title")}
      </h2>
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex items-center justify-between gap-3 rounded-2xl border border-[#f0f2f4] px-4 py-3"
          >
            <span className="text-[13.5px] text-[#22262b]">{item.label}</span>
            <button
              type="button"
              onClick={() => downloadCsv(item.file, item.rows)}
              className="rounded-full border border-[#e9ecef] px-3 py-1.5 text-[12.5px] font-medium text-[#22262b]"
            >
              {t("export")}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = csvText(rows);
  const url = URL.createObjectURL(
    new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function Activity({
  data,
  pairs,
  weeks,
}: {
  data: AdminOverview;
  pairs: ReportPair[];
  weeks: Date[];
}) {
  const t = useTranslations("adminReporting.activity");
  const from = weeks[0];
  if (!from) return null;
  const counts = activityCounts(data, pairs, from);
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Kpi
        title={t("meetings")}
        value={data.meetings ? String(counts.completed) : "—"}
        detail={
          data.meetings
            ? t("meetingsDetail", {
                total: counts.meetings,
                completed: counts.completed,
              })
            : t("noMeetingDates")
        }
      />
      <Kpi
        title={t("bottlenecks")}
        value={String(counts.bottlenecks)}
        detail={t("bottlenecksDetail")}
      />
      <Kpi
        title={t("accounts")}
        value={String(counts.accounts)}
        detail={t("accountsDetail")}
      />
    </div>
  );
}

function Kpi({
  title,
  value,
  detail,
  valueClass,
}: {
  title: string;
  value: string;
  detail: string;
  valueClass?: string | undefined;
}) {
  return (
    <article className="rounded-[24px] border border-[#e9ecef] bg-white px-4 py-4">
      <p className="text-[12.5px] text-[#676e78]">{title}</p>
      <p
        className={`mt-2 text-[28px] leading-none font-semibold ${valueClass ?? "text-[#22262b]"}`}
      >
        {value}
      </p>
      <p className="mt-2 text-[12px] text-[#858c96]">{detail}</p>
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[#858c96]">{label}</dt>
      <dd className="font-medium text-[#22262b]">{value}</dd>
    </div>
  );
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className="size-2.5 rounded-sm"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

function PairMarks({ mentor, team }: { mentor: string; team: string }) {
  return (
    <span className="flex shrink-0 items-center">
      <span className="grid size-7 place-items-center rounded-full bg-[#eaf6ff] text-[9px] font-semibold text-[#1583d6] ring-2 ring-white">
        {initials(mentor)}
      </span>
      <span className="-ml-1.5 grid size-7 place-items-center rounded-full bg-[#fff1ec] text-[9px] font-semibold text-[#e0522a] ring-2 ring-white">
        {initials(team)}
      </span>
    </span>
  );
}

function cellClass(state: HeatCell) {
  switch (state) {
    case HeatCell.Held:
      return "bg-[#e7f6d4] text-[#3d6b00]";
    case HeatCell.Missed:
      return "bg-[#fde8e8] text-[#d9464b]";
    case HeatCell.Unknown:
      return "bg-[#f5f6f8] text-[#aeb4bc]";
  }
}
