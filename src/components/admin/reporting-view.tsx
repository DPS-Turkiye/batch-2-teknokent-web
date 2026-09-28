"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useId, useState, type ReactNode } from "react";
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

import { needsAttention } from "@/components/admin/admin-model";
import { MeetingRatingsSection } from "@/components/admin/meeting-ratings-section";
import {
  AdminIcon,
  AdminOverlay,
  EmptyNote,
  QueryNotice,
} from "@/components/admin/admin-ui";
import { useAdminOverview } from "@/hooks/use-admin-overview";
import { useProgramMeetingRatings } from "@/hooks/use-program-report";
import type {
  AdminMeetingMark,
  AdminMentorship,
  AdminOverview,
  AdminProgram,
} from "@/interfaces/admin-overview";
import type { ProgramMeetingRatings } from "@/interfaces/program-report";
import { isoDay } from "@/lib/coordinator-calendar";
import { satisfactionKpi } from "@/lib/meeting-ratings";
import { initials } from "@/lib/utils";

type RangeId = "8" | "13" | "all";
type TabId = "program" | "health" | "activity";

const RANGES: { id: RangeId; label: string }[] = [
  { id: "8", label: "Son 8 hafta" },
  { id: "13", label: "Çeyrek" },
  { id: "all", label: "Program boyu" },
];

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
  const [programId, setProgramId] = useState<string | null>(null);
  const [range, setRange] = useState<RangeId>("8");
  const [tab, setTab] = useState<TabId>("program");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ title: string; body: string } | null>(
    null,
  );
  const program =
    data.programs.find((item) => item.id === programId) ??
    data.programs.find((item) => item.status === "ACTIVE") ??
    data.programs[0] ??
    null;
  const weeks = weekStarts(range, program?.createdAt);
  const pairs = program ? pairsIn(data, program) : [];
  const selected = pairs.find((pair) => pair.id === selectedId) ?? null;
  const meetingsKnown = data.meetings != null;
  const ratingsQuery = useProgramMeetingRatings(
    program?.id ?? null,
    range === "all" || !weeks[0] ? null : isoDay(weeks[0]),
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-[13px] text-[#858c96]">
          {program
            ? `${program.name} · ${RANGES.find((item) => item.id === range)?.label}`
            : "Program yok"}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label
            className={`${fixedProgram ? "hidden" : "flex"} h-[42px] items-center gap-2 rounded-full border border-[#e9ecef] bg-white px-4 text-[13px]`}
          >
            <span className="text-[#858c96]">Program:</span>
            <select
              aria-label="Program"
              value={program?.id ?? ""}
              onChange={(event) => {
                setProgramId(event.target.value);
                setSelectedId(null);
              }}
              className="max-w-[180px] appearance-none bg-transparent font-medium text-[#22262b] outline-none"
            >
              {data.programs.map((item) => (
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
            {RANGES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRange(item.id)}
                className={`rounded-full px-3.5 py-[7px] text-[13px] ${
                  range === item.id
                    ? "bg-white font-medium text-[#22262b] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                    : "text-[#676e78]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              downloadCsv("program-ozeti.csv", programSummaryRows(program))
            }
            className="rounded-full border border-[#e9ecef] bg-white px-4 py-[10px] text-[13px] font-medium text-[#22262b]"
          >
            Dışa aktar
          </button>
        </div>
      </div>

      <div className="flex border-b border-[#e9ecef]">
        {(
          [
            ["program", "Program Raporları"],
            ["health", "Mentorluk Sağlığı"],
            ["activity", "Sistem Aktivitesi"],
          ] as const
        )
          .filter(([id]) => !(fixedProgram && id === "activity"))
          .map(([id, label]) => (
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
                {label}
              </span>
              <span
                className={`h-[2.5px] w-full rounded-sm ${tab === id ? "bg-[#22262b]" : ""}`}
              />
            </button>
          ))}
      </div>

      {tab === "activity" ? (
        <Activity data={data} program={program} weeks={weeks} />
      ) : (
        <>
          <div className="flex items-start justify-between gap-4 rounded-2xl bg-[#f7f8fa] px-4 py-3">
            <p className="text-[12.5px] leading-[1.5] text-[#676e78]">
              Raporlar oran ve sayı içerir. Görüşme notu, transkript, görev
              başlığı ve darboğaz metni bu ekranda yok.
            </p>
            <button
              type="button"
              onClick={() =>
                setNotice({
                  title: "Neler görünür?",
                  body: "Program, eşleşme, haftalık görüşme sayısı, tamamlanan hedef oranı, açık darboğaz sayısı ve görüşme sonrası anket puanları. Görüşme notu, transkript, görev başlığı ve anketteki yazılı notlar görünmez.",
                })
              }
              className="shrink-0 text-[12.5px] font-medium text-[#22262b]"
            >
              Neler görünür? →
            </button>
          </div>
          {tab === "program" ? (
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
            onSelect={setSelectedId}
          />
          {selected ? (
            <PairDetail
              pair={selected}
              weeks={weeks}
              meetings={data.meetings ?? []}
              program={program}
            />
          ) : null}
          {tab === "program" ? (
            <MeetingRatingsSection
              ratings={ratingsQuery.data}
              isLoading={ratingsQuery.isLoading}
              error={ratingsQuery.error}
            />
          ) : null}
          {tab === "program" ? (
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
              Tamam
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
  pairs: Pair[];
  weeks: Date[];
  meetingsKnown: boolean;
  ratings: ProgramMeetingRatings | undefined;
}) {
  const satisfaction = satisfactionKpi(ratings);
  const rate = meetingRate(pairs, data.meetings ?? [], weeks);
  const goals = goalRate(pairs);
  const flags = flagCounts(pairs);
  const openedThisWeek = data.bottlenecks.filter((item) =>
    pairs.some(
      (pair) =>
        pair.organizationId === item.organizationId &&
        daysSinceInstant(item.createdAt) <= 7,
    ),
  ).length;
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <Kpi
        title="Görüşme gerçekleşme"
        value={rate == null ? "—" : `%${rate.percent}`}
        detail={
          rate == null
            ? meetingsKnown
              ? "bu pencerede planlı görüşme yok"
              : "görüşme tarihi gelmiyor"
            : `tamamlanan ${rate.completed} · planlanan ${rate.planned}`
        }
      />
      <Kpi title="İletişim yoğunluğu" value="—" detail="mesaj kaydı yok" />
      <Kpi
        title="Görev tamamlama"
        value={goals == null ? "—" : `%${goals.percent}`}
        detail={
          goals == null
            ? "hedef kaydı yok"
            : `${goals.done}/${goals.total} hedef`
        }
      />
      <Kpi
        title="Memnuniyet"
        value={satisfaction.value}
        detail={satisfaction.detail}
      />
      <Kpi
        title="Aktif bayrak"
        value={String(flags.red + flags.amber)}
        detail={`${flags.red} kırmızı · ${flags.amber} sarı${openedThisWeek ? ` · ${openedThisWeek} bu hafta` : ""}`}
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
  pairs: Pair[];
  weeks: Date[];
  meetings: AdminMeetingMark[];
  meetingsKnown: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const withMeeting = pairs.filter((pair) =>
    weeks.some(
      (week) => cellState(pair, week, meetings, meetingsKnown) === "held",
    ),
  ).length;
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
            Görüşme · eşleşme × hafta
          </h2>
          <p className="mt-1 text-[12.5px] text-[#858c96]">
            Hücre, o hafta tamamlanan görüşme sayısı. Skor kaydı yok.
          </p>
        </div>
        <p className="flex flex-wrap gap-3 text-[12px] text-[#858c96]">
          <Swatch color="#e7f6d4" label="Görüşme var" />
          <Swatch color="#fde8e8" label="Görüşme yok" />
          <Swatch color="#f5f6f8" label="Veri yok" />
        </p>
      </div>
      {pairs.length === 0 ? (
        <EmptyNote>Bu programda aktif mentorluk yok.</EmptyNote>
      ) : (
        <div className="overflow-x-auto px-3 pb-2">
          <table className="w-full min-w-[760px] border-separate border-spacing-1">
            <thead>
              <tr className="text-[11px] font-medium text-[#858c96]">
                <th className="px-2 py-2 text-left font-medium">Eşleşme</th>
                {weeks.map((week, index) => (
                  <th
                    key={week.toISOString()}
                    className="px-1 py-2 font-medium"
                  >
                    H{index + 1}
                  </th>
                ))}
                <th className="px-2 py-2 font-medium">Bayrak</th>
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
                      "COMPLETED",
                    );
                    const body = `${pair.mentorName} ↔ ${pair.organizationName}\n${weekLabel(week)}\nTamamlanan görüşme: ${meetingsKnown ? count : "—"}\nAçık darboğaz: ${pair.bottlenecks}`;
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
                          {state === "unknown" ? "—" : count}
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-2 py-1 text-center text-[12px]">
                    {pair.stale ? (
                      <span className="text-[#d9464b]">görüşme yok</span>
                    ) : pair.bottlenecks > 0 ? (
                      <span className="text-[#b7791f]">darboğaz</span>
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
        {withMeeting} eşleşmede bu pencerede görüşme var · {pairs.length} aktif
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
  pair: Pair;
  weeks: Date[];
  meetings: AdminMeetingMark[];
  program: AdminProgram | null;
}) {
  const gaps = weeks.map((week) => gapAtWeekEnd(pair, week, meetings));
  const completed = cumulative(pair, weeks, meetings, "COMPLETED");
  const planned = weeks.map((_, index) => {
    let total = 0;
    for (let cursor = 0; cursor <= index; cursor += 1) {
      total += plannedInWeek(pair, weeks[cursor], meetings);
    }
    return total;
  });
  const goals = pair.goalTotal > 0 ? `${pair.goalDone}/${pair.goalTotal}` : "—";
  const rows = weeks.map((_, index) => ({
    week: `H${index + 1}`,
    gap: gaps[index],
    planned: planned[index],
    completed: completed[index],
  }));
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
            {program ? ` · koordinatör ${program.coordinatorName}` : ""}
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_220px]">
        <ChartCard title="İletişim trendi" detail="Son görüşmeden geçen gün">
          <GapLine rows={rows} />
        </ChartCard>
        <ChartCard
          title="Görüşme birikimi"
          legend={
            <span className="flex gap-3 text-[11px] text-[#858c96]">
              <LegendDot color="#c6ef6a" label="Planlanan" />
              <LegendDot color="#2f9e6b" label="Tamamlanan" />
            </span>
          }
        >
          <BurnChart rows={rows} />
        </ChartCard>
        <dl className="space-y-2 self-center text-[13px]">
          <Row label="Hedef" value={goals} />
          <Row
            label="Son görüşme"
            value={
              pair.daysSinceMeeting == null
                ? "kayıt yok"
                : `${pair.daysSinceMeeting} gün önce`
            }
          />
          <Row label="Açık darboğaz" value={String(pair.bottlenecks)} />
          <Row
            label="Bayrak"
            value={pair.stale ? "14+ gün görüşme yok" : "—"}
          />
        </dl>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href={
            program?.coordinatorId
              ? `/admin/users?user=${encodeURIComponent(program.coordinatorId)}`
              : "/admin/users"
          }
          className="rounded-full bg-[#22262b] px-4 py-2 text-[13px] font-medium text-white"
        >
          Koordinatöre git
        </Link>
        <Link
          href={`/admin/mentorships/interventions?program=${encodeURIComponent(program?.name ?? "")}`}
          className="rounded-full border border-[#e9ecef] px-4 py-2 text-[13px] font-medium text-[#22262b]"
        >
          Mentorluğa git
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

type WeekPoint = {
  week: string;
  gap: number | null;
  planned: number;
  completed: number;
};

const axisTick = { fill: "#aeb4bc", fontSize: 11 };
const tooltipStyle = {
  border: "1px solid #e9ecef",
  borderRadius: 12,
  fontSize: 12,
  boxShadow: "none",
};

function gapTop(rows: WeekPoint[]) {
  const peak = rows.reduce((max, row) => Math.max(max, row.gap ?? 0), 0);
  return Math.max(28, Math.ceil((peak * 1.15) / 7) * 7);
}

function GapLine({ rows }: { rows: WeekPoint[] }) {
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
            name="Gün"
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
            name="Planlanan"
            stroke="#c6ef6a"
            strokeWidth={2}
            fill={`url(#${fillId})`}
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="completed"
            name="Tamamlanan"
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

function Flags({ pairs }: { pairs: Pair[] }) {
  const rows = [
    {
      label: "14 gündür görüşme yok",
      count: pairs.filter((pair) => pair.stale).length,
    },
    {
      label: "Açık darboğaz",
      count: pairs.filter((pair) => pair.bottlenecks > 0).length,
    },
    {
      label: "Hedef ilerlemesi %50 altında",
      count: pairs.filter(
        (pair) => pair.goalTotal > 0 && pair.goalDone / pair.goalTotal < 0.5,
      ).length,
    },
  ];
  return (
    <section className="rounded-[28px] border border-[#e9ecef] bg-white p-5">
      <h2 className="text-[15px] font-semibold text-[#22262b]">
        Otomatik bayraklar
      </h2>
      <p className="mt-1 text-[12.5px] text-[#858c96]">
        Eşik görüşme günü, açık darboğaz sayısı ve hedef oranından gelir.
      </p>
      <ul className="mt-4 space-y-2">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex items-center justify-between gap-3 rounded-2xl border border-[#f0f2f4] px-4 py-3"
          >
            <span className="text-[13.5px] text-[#22262b]">{row.label}</span>
            <span className="text-[13px] font-medium text-[#676e78]">
              {row.count} eşleşme
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
  pairs: Pair[];
}) {
  const items = [
    {
      label: "Program özeti",
      file: "program-ozeti.csv",
      rows: programSummaryRows(program),
    },
    {
      label: "Mentorluk görüşme özeti",
      file: "gorusme-ozeti.csv",
      rows: meetingSummaryRows(pairs),
    },
    {
      label: "Sayı özeti",
      file: "sayi-ozeti.csv",
      rows: countSummaryRows(pairs),
    },
  ];
  return (
    <section className="rounded-[28px] border border-[#e9ecef] bg-white p-5">
      <h2 className="text-[15px] font-semibold text-[#22262b]">
        Hazır raporlar
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
              Dışa aktar
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function programSummaryRows(program: AdminProgram | null): string[][] {
  return [
    ["Program", "Koordinatör", "Takım", "Mentor", "Bekleyen davet"],
    [
      program?.name ?? "",
      program?.coordinatorName ?? "",
      String(program?.startupCount ?? 0),
      String(program?.acceptedMentorCount ?? 0),
      String(program?.pendingMentorCount ?? 0),
    ],
  ];
}

function meetingSummaryRows(pairs: Pair[]): string[][] {
  return [
    [
      "Mentor",
      "Takım",
      "Son görüşme (gün)",
      "Hedef tamam",
      "Hedef toplam",
      "Açık darboğaz",
    ],
    ...pairs.map((pair) => [
      pair.mentorName,
      pair.organizationName,
      pair.daysSinceMeeting == null ? "" : String(pair.daysSinceMeeting),
      String(pair.goalDone),
      String(pair.goalTotal),
      String(pair.bottlenecks),
    ]),
  ];
}

function countSummaryRows(pairs: Pair[]): string[][] {
  return [
    ["Aktif eşleşme", "14+ gün görüşme yok", "Açık darboğazı olan"],
    [
      String(pairs.length),
      String(pairs.filter((pair) => pair.stale).length),
      String(pairs.filter((pair) => pair.bottlenecks > 0).length),
    ],
  ];
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","),
    )
    .join("\n");
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
  program,
  weeks,
}: {
  data: AdminOverview;
  program: AdminProgram | null;
  weeks: Date[];
}) {
  const from = weeks[0];
  const pairs = program ? pairsIn(data, program) : [];
  const ids = new Set(pairs.map((pair) => pair.organizationId));
  const meetings = (data.meetings ?? []).filter((item) => {
    if (!ids.has(item.organizationId) || item.status === "CANCELLED")
      return false;
    return new Date(item.scheduledAt) >= from;
  });
  const completed = meetings.filter(
    (item) => item.status === "COMPLETED",
  ).length;
  const bottlenecks = data.bottlenecks.filter(
    (item) => ids.has(item.organizationId) && new Date(item.createdAt) >= from,
  ).length;
  const users = data.users.filter(
    (user) => user.createdAt && new Date(user.createdAt) >= from,
  ).length;
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Kpi
        title="Görüşme"
        value={data.meetings ? String(completed) : "—"}
        detail={
          data.meetings
            ? `${meetings.length} kaydın ${completed} tanesi tamamlandı`
            : "görüşme tarihi gelmiyor"
        }
      />
      <Kpi
        title="Açılan darboğaz"
        value={String(bottlenecks)}
        detail="bu pencerede, başlık yok"
      />
      <Kpi
        title="Yeni hesap"
        value={String(users)}
        detail="bu pencerede oluşturulan kullanıcı"
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
  valueClass?: string;
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

type Pair = AdminMentorship & {
  bottlenecks: number;
  stale: boolean;
  goalDone: number;
  goalTotal: number;
};

function pairsIn(data: AdminOverview, program: AdminProgram): Pair[] {
  const ids = new Set(program.startups.map((startup) => startup.id));
  return data.mentorships
    .filter((item) => item.status === "ACTIVE" && ids.has(item.organizationId))
    .map((item) => ({
      ...item,
      bottlenecks: data.bottlenecks.filter(
        (block) => block.organizationId === item.organizationId,
      ).length,
      stale: needsAttention(item),
      goalDone: item.goalDone ?? 0,
      goalTotal: item.goalTotal ?? 0,
    }));
}

function meetingRate(
  pairs: Pair[],
  meetings: AdminMeetingMark[],
  weeks: Date[],
) {
  if (meetings.length === 0 && pairs.length > 0) {
    const any = pairs.some((pair) => pair.daysSinceMeeting != null);
    if (!any && meetings.length === 0) return null;
  }
  const from = weeks[0];
  const until = addDays(weeks[weeks.length - 1], 7);
  const now = new Date();
  let completed = 0;
  let planned = 0;
  for (const meeting of meetings) {
    if (
      !pairs.some(
        (pair) =>
          pair.mentorId === meeting.mentorId &&
          pair.organizationId === meeting.organizationId,
      )
    ) {
      continue;
    }
    const at = new Date(meeting.scheduledAt);
    if (at < from || at >= until || meeting.status === "CANCELLED") continue;
    if (meeting.status === "COMPLETED") {
      completed += 1;
      planned += 1;
    } else if (at <= now) {
      planned += 1;
    }
  }
  if (planned === 0) return null;
  return {
    completed,
    planned,
    percent: Math.round((completed / planned) * 100),
  };
}

function goalRate(pairs: Pair[]) {
  const withGoals = pairs.filter((pair) => pair.goalTotal > 0);
  if (withGoals.length === 0) return null;
  const done = withGoals.reduce((sum, pair) => sum + pair.goalDone, 0);
  const total = withGoals.reduce((sum, pair) => sum + pair.goalTotal, 0);
  return { done, total, percent: Math.round((done / total) * 100) };
}

function flagCounts(pairs: Pair[]) {
  const red = pairs.filter((pair) => pair.stale).length;
  const amber = pairs.filter(
    (pair) =>
      !pair.stale &&
      (pair.bottlenecks > 0 ||
        (pair.goalTotal > 0 && pair.goalDone / pair.goalTotal < 0.5)),
  ).length;
  return { red, amber };
}

type Cell = "held" | "missed" | "unknown";

function cellState(
  pair: Pair,
  week: Date,
  meetings: AdminMeetingMark[],
  meetingsKnown: boolean,
): Cell {
  if (!meetingsKnown) return "unknown";
  const end = addDays(week, 7);
  const now = new Date();
  if (week > now) return "unknown";
  const started = new Date(`${pair.startDate}T00:00:00`);
  if (end <= started) return "unknown";
  if (meetingCount(pair, week, meetings, "COMPLETED") > 0) return "held";
  return "missed";
}

function meetingCount(
  pair: Pair,
  week: Date,
  meetings: AdminMeetingMark[],
  status: AdminMeetingMark["status"],
) {
  const end = addDays(week, 7);
  return meetings.filter((meeting) => {
    if (
      meeting.mentorId !== pair.mentorId ||
      meeting.organizationId !== pair.organizationId ||
      meeting.status !== status
    ) {
      return false;
    }
    const at = new Date(meeting.scheduledAt);
    return at >= week && at < end;
  }).length;
}

function gapAtWeekEnd(pair: Pair, week: Date, meetings: AdminMeetingMark[]) {
  const end = addDays(week, 7);
  const asOf = end.getTime() < Date.now() ? end : new Date();
  const started = new Date(`${pair.startDate}T00:00:00`);
  if (asOf.getTime() <= started.getTime()) return null;
  const held = meetings
    .filter(
      (meeting) =>
        meeting.mentorId === pair.mentorId &&
        meeting.organizationId === pair.organizationId &&
        meeting.status === "COMPLETED" &&
        new Date(meeting.scheduledAt).getTime() <= asOf.getTime(),
    )
    .map((meeting) => new Date(meeting.scheduledAt).getTime());
  const last = held.length ? Math.max(...held) : started.getTime();
  return Math.max(0, Math.floor((asOf.getTime() - last) / 86_400_000));
}

function plannedInWeek(pair: Pair, week: Date, meetings: AdminMeetingMark[]) {
  const end = addDays(week, 7);
  const now = Date.now();
  return meetings.filter((meeting) => {
    if (
      meeting.mentorId !== pair.mentorId ||
      meeting.organizationId !== pair.organizationId ||
      meeting.status === "CANCELLED"
    ) {
      return false;
    }
    const at = new Date(meeting.scheduledAt).getTime();
    if (at < week.getTime() || at >= end.getTime()) return false;
    return meeting.status === "COMPLETED" || at <= now;
  }).length;
}

function cumulative(
  pair: Pair,
  weeks: Date[],
  meetings: AdminMeetingMark[],
  status: AdminMeetingMark["status"],
) {
  let total = 0;
  return weeks.map((week) => {
    total += meetingCount(pair, week, meetings, status);
    return total;
  });
}

function cellClass(state: Cell) {
  if (state === "held") return "bg-[#e7f6d4] text-[#3d6b00]";
  if (state === "missed") return "bg-[#fde8e8] text-[#d9464b]";
  return "bg-[#f5f6f8] text-[#aeb4bc]";
}

function weekStarts(range: RangeId, createdAt?: string) {
  const thisWeek = startOfWeek(new Date());
  let count = range === "13" ? 13 : 8;
  if (range === "all" && createdAt) {
    const start = startOfWeek(new Date(createdAt));
    count = Math.min(
      16,
      Math.max(
        1,
        Math.round((thisWeek.getTime() - start.getTime()) / 604_800_000) + 1,
      ),
    );
  }
  return Array.from({ length: count }, (_, index) =>
    addDays(thisWeek, (index - (count - 1)) * 7),
  );
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay();
  copy.setDate(copy.getDate() + (day === 0 ? -6 : 1 - day));
  return copy;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function weekLabel(week: Date) {
  const end = addDays(week, 6);
  const format = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
  });
  return `${format.format(week)} – ${format.format(end)}`;
}

function daysSinceInstant(value: string) {
  return Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
}
