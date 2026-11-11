import type { useTranslations } from "next-intl";

import type {
  AdminBottleneck,
  AdminMeetingMark,
  AdminMentorship,
  AdminOverview,
  AdminProgram,
} from "@/interfaces/admin-overview";
import { MentorshipStatus } from "@/interfaces/coordinator-mentorship";
import { MeetingStatus } from "@/interfaces/meeting";
import { ProgramStatus } from "@/interfaces/program";
import { countsInProgram, needsAttention } from "@/lib/admin-model";
import { addDays, isoDay, startOfWeek } from "@/lib/coordinator-calendar";
import { formatDateRange } from "@/lib/format";
import {
  matchesProgramType,
  type ProgramTypeFilter,
} from "@/lib/program-types";
import { HeatCell, ReportRange, ReportTab } from "@/types/admin-reporting";

export type ReportingT = ReturnType<typeof useTranslations<"adminReporting">>;

/** An active mentorship as Raporlama reads it, with its team's open bottlenecks and whether it is overdue a meeting. */
export type ReportPair = AdminMentorship & {
  bottlenecks: number;
  stale: boolean;
  goalDone: number;
  goalTotal: number;
};

/** One week of a pair's charts: days since the last meeting, and meetings planned and held so far. */
export type WeekPoint = {
  week: string;
  gap: number | null;
  planned: number;
  completed: number;
};

export const REPORT_RANGES = Object.values(ReportRange);

const DAY_MS = 86_400_000;
const WEEK_MS = 604_800_000;
/** The "Program boyu" range never shows more weeks than this. */
const MAX_WEEKS = 16;

export function programsOfType(
  programs: AdminProgram[],
  type: ProgramTypeFilter,
) {
  return programs.filter((program) => matchesProgramType(program.type, type));
}

/** The program on screen: the one picked, else the first active one, else the first. */
export function reportProgram(
  programs: AdminProgram[],
  programId: string | null,
) {
  return (
    programs.find((item) => item.id === programId) ??
    programs.find((item) => item.status === ProgramStatus.Active) ??
    programs[0] ??
    null
  );
}

/** A coordinator's Program raporu has no Sistem Aktivitesi: its data carries no user list. */
export function reportTabs(fixedProgram: boolean) {
  return Object.values(ReportTab).filter(
    (id) => !(fixedProgram && id === ReportTab.Activity),
  );
}

/** The Mondays of the weeks the range covers, oldest first, ending with this week. */
export function weekStarts(
  range: ReportRange,
  createdAt: string | undefined,
  now = new Date(),
) {
  const thisWeek = startOfWeek(now);
  let count = range === ReportRange.Quarter ? 13 : 8;
  if (range === ReportRange.WholeProgram && createdAt) {
    const start = startOfWeek(new Date(createdAt));
    count = Math.min(
      MAX_WEEKS,
      Math.max(
        1,
        Math.round((thisWeek.getTime() - start.getTime()) / WEEK_MS) + 1,
      ),
    );
  }
  return Array.from({ length: count }, (_, index) =>
    addDays(thisWeek, (index - (count - 1)) * 7),
  );
}

/** The first day the meeting ratings cover; null for the whole program. */
export function ratingsFromDay(range: ReportRange, weeks: Date[]) {
  const first = weeks[0];
  return range === ReportRange.WholeProgram || !first ? null : isoDay(first);
}

/** The program's active mentorships, counted in the program they were made in. */
export function pairsIn(
  data: AdminOverview,
  program: AdminProgram,
  now = new Date(),
): ReportPair[] {
  const ids = new Set(program.startups.map((startup) => startup.id));
  return data.mentorships
    .filter(
      (item) =>
        item.status === MentorshipStatus.Active &&
        ids.has(item.organizationId) &&
        countsInProgram(item, program.id),
    )
    .map((item) => ({
      ...item,
      bottlenecks: data.bottlenecks.filter(
        (block) => block.organizationId === item.organizationId,
      ).length,
      stale: needsAttention(item, now),
      goalDone: item.goalDone ?? 0,
      goalTotal: item.goalTotal ?? 0,
    }));
}

function isPairMeeting(pair: ReportPair, meeting: AdminMeetingMark) {
  return (
    meeting.mentorId === pair.mentorId &&
    meeting.organizationId === pair.organizationId
  );
}

/**
 * Held meetings over planned ones in the range: a held meeting counts as planned too, a scheduled one only once its
 * time has passed. Null when there is nothing to divide.
 */
export function meetingRate(
  pairs: ReportPair[],
  meetings: AdminMeetingMark[],
  weeks: Date[],
  now = new Date(),
) {
  if (meetings.length === 0 && pairs.length > 0) {
    const any = pairs.some((pair) => pair.daysSinceMeeting != null);
    if (!any) return null;
  }
  const from = weeks[0];
  const lastWeek = weeks.at(-1);
  if (!from || !lastWeek) return null;
  const until = addDays(lastWeek, 7);
  let completed = 0;
  let planned = 0;
  for (const meeting of meetings) {
    if (!pairs.some((pair) => isPairMeeting(pair, meeting))) continue;
    const at = new Date(meeting.scheduledAt);
    if (at < from || at >= until || meeting.status === MeetingStatus.Cancelled)
      continue;
    if (meeting.status === MeetingStatus.Completed) {
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

/** Goals done over goals set, across the pairs that set any; null when none did. */
export function goalRate(pairs: ReportPair[]) {
  const withGoals = pairs.filter((pair) => pair.goalTotal > 0);
  if (withGoals.length === 0) return null;
  const done = withGoals.reduce((sum, pair) => sum + pair.goalDone, 0);
  const total = withGoals.reduce((sum, pair) => sum + pair.goalTotal, 0);
  return { done, total, percent: Math.round((done / total) * 100) };
}

/** Fewer than half of the pair's goals done. */
export function hasLowGoals(pair: ReportPair) {
  return pair.goalTotal > 0 && pair.goalDone / pair.goalTotal < 0.5;
}

/** Red: overdue a meeting. Amber: otherwise blocked or behind on goals. */
export function flagCounts(pairs: ReportPair[]) {
  const red = pairs.filter((pair) => pair.stale).length;
  const amber = pairs.filter(
    (pair) => !pair.stale && (pair.bottlenecks > 0 || hasLowGoals(pair)),
  ).length;
  return { red, amber };
}

/** The pairs behind each line of the flag list; a pair can count on more than one line. */
export function flagListCounts(pairs: ReportPair[]) {
  return {
    stale: pairs.filter((pair) => pair.stale).length,
    bottleneck: pairs.filter((pair) => pair.bottlenecks > 0).length,
    lowGoals: pairs.filter(hasLowGoals).length,
  };
}

/** Whole days since an instant. */
export function daysSinceInstant(value: string, now = new Date()) {
  return Math.floor((now.getTime() - new Date(value).getTime()) / DAY_MS);
}

/** Bottlenecks of the pairs' teams opened in the last seven days. */
export function bottlenecksOpenedThisWeek(
  bottlenecks: AdminBottleneck[],
  pairs: ReportPair[],
  now = new Date(),
) {
  return bottlenecks.filter((item) =>
    pairs.some(
      (pair) =>
        pair.organizationId === item.organizationId &&
        daysSinceInstant(item.createdAt, now) <= 7,
    ),
  ).length;
}

/** The pair's meetings with this status in the week starting on `week`. */
export function meetingCount(
  pair: ReportPair,
  week: Date,
  meetings: AdminMeetingMark[],
  status: MeetingStatus,
) {
  const end = addDays(week, 7);
  return meetings.filter((meeting) => {
    if (!isPairMeeting(pair, meeting) || meeting.status !== status) {
      return false;
    }
    const at = new Date(meeting.scheduledAt);
    return at >= week && at < end;
  }).length;
}

export function cellState(
  pair: ReportPair,
  week: Date,
  meetings: AdminMeetingMark[],
  meetingsKnown: boolean,
  now = new Date(),
): HeatCell {
  if (!meetingsKnown) return HeatCell.Unknown;
  const end = addDays(week, 7);
  if (week > now) return HeatCell.Unknown;
  const started = new Date(`${pair.startDate}T00:00:00`);
  if (end <= started) return HeatCell.Unknown;
  if (meetingCount(pair, week, meetings, MeetingStatus.Completed) > 0) {
    return HeatCell.Held;
  }
  return HeatCell.Missed;
}

/** Pairs with a held meeting in at least one of the weeks. */
export function pairsWithMeeting(
  pairs: ReportPair[],
  weeks: Date[],
  meetings: AdminMeetingMark[],
  meetingsKnown: boolean,
  now = new Date(),
) {
  return pairs.filter((pair) =>
    weeks.some(
      (week) =>
        cellState(pair, week, meetings, meetingsKnown, now) === HeatCell.Held,
    ),
  ).length;
}

/** Days from the pair's last held meeting (or its start) to the week's end, or to now for this week; null before it started. */
export function gapAtWeekEnd(
  pair: ReportPair,
  week: Date,
  meetings: AdminMeetingMark[],
  now = new Date(),
) {
  const end = addDays(week, 7);
  const asOf = end.getTime() < now.getTime() ? end : now;
  const started = new Date(`${pair.startDate}T00:00:00`);
  if (asOf.getTime() <= started.getTime()) return null;
  const held = meetings
    .filter(
      (meeting) =>
        isPairMeeting(pair, meeting) &&
        meeting.status === MeetingStatus.Completed &&
        new Date(meeting.scheduledAt).getTime() <= asOf.getTime(),
    )
    .map((meeting) => new Date(meeting.scheduledAt).getTime());
  const last = held.length ? Math.max(...held) : started.getTime();
  return Math.max(0, Math.floor((asOf.getTime() - last) / DAY_MS));
}

/** The pair's meetings that week that were due: held ones, and scheduled ones whose time has passed. */
export function plannedInWeek(
  pair: ReportPair,
  week: Date,
  meetings: AdminMeetingMark[],
  now = new Date(),
) {
  const end = addDays(week, 7);
  return meetings.filter((meeting) => {
    if (
      !isPairMeeting(pair, meeting) ||
      meeting.status === MeetingStatus.Cancelled
    ) {
      return false;
    }
    const at = new Date(meeting.scheduledAt).getTime();
    if (at < week.getTime() || at >= end.getTime()) return false;
    return meeting.status === MeetingStatus.Completed || at <= now.getTime();
  }).length;
}

/** The pair's chart rows, one per week; `weekName` labels a week by its index. */
export function pairWeekPoints(
  pair: ReportPair,
  weeks: Date[],
  meetings: AdminMeetingMark[],
  weekName: (index: number) => string,
  now = new Date(),
): WeekPoint[] {
  let planned = 0;
  let completed = 0;
  return weeks.map((week, index) => {
    planned += plannedInWeek(pair, week, meetings, now);
    completed += meetingCount(pair, week, meetings, MeetingStatus.Completed);
    return {
      week: weekName(index),
      gap: gapAtWeekEnd(pair, week, meetings, now),
      planned,
      completed,
    };
  });
}

/** The top of the gap chart: a whole number of weeks above the peak, at least four. */
export function gapTop(rows: WeekPoint[]) {
  const peak = rows.reduce((max, row) => Math.max(max, row.gap ?? 0), 0);
  return Math.max(28, Math.ceil((peak * 1.15) / 7) * 7);
}

/** Sistem Aktivitesi's numbers since `from`: meetings of the pairs' teams, their bottlenecks, and new accounts. */
export function activityCounts(
  data: AdminOverview,
  pairs: ReportPair[],
  from: Date,
) {
  const ids = new Set(pairs.map((pair) => pair.organizationId));
  const meetings = (data.meetings ?? []).filter((item) => {
    if (
      !ids.has(item.organizationId) ||
      item.status === MeetingStatus.Cancelled
    )
      return false;
    return new Date(item.scheduledAt) >= from;
  });
  return {
    meetings: meetings.length,
    completed: meetings.filter(
      (item) => item.status === MeetingStatus.Completed,
    ).length,
    bottlenecks: data.bottlenecks.filter(
      (item) =>
        ids.has(item.organizationId) && new Date(item.createdAt) >= from,
    ).length,
    accounts: data.users.filter(
      (user) => user.createdAt && new Date(user.createdAt) >= from,
    ).length,
  };
}

/** "9–15 Kas" for the week starting on `week`. */
export function weekLabel(week: Date, locale: string) {
  return formatDateRange(
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }),
    week,
    addDays(week, 6),
  );
}

/** "%75" in Turkish, "75%" in English. */
export function formatPercent(value: number, locale: string) {
  return new Intl.NumberFormat(locale, { style: "percent" }).format(
    value / 100,
  );
}

export function programSummaryRows(
  program: AdminProgram | null,
  t: ReportingT,
): string[][] {
  return [
    [
      t("csv.program"),
      t("csv.coordinator"),
      t("csv.teams"),
      t("csv.mentors"),
      t("csv.pendingInvites"),
    ],
    [
      program?.name ?? "",
      program?.coordinatorName ?? "",
      String(program?.startupCount ?? 0),
      String(program?.acceptedMentorCount ?? 0),
      String(program?.pendingMentorCount ?? 0),
    ],
  ];
}

export function meetingSummaryRows(
  pairs: ReportPair[],
  t: ReportingT,
): string[][] {
  return [
    [
      t("csv.mentor"),
      t("csv.team"),
      t("csv.lastMeetingDays"),
      t("csv.goalsDone"),
      t("csv.goalsTotal"),
      t("csv.openBottlenecks"),
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

export function countSummaryRows(
  pairs: ReportPair[],
  t: ReportingT,
): string[][] {
  const flags = flagListCounts(pairs);
  return [
    [t("csv.activePairs"), t("csv.stale"), t("csv.withBottleneck")],
    [String(pairs.length), String(flags.stale), String(flags.bottleneck)],
  ];
}

/** The rows as CSV, every cell quoted. */
export function csvText(rows: string[][]) {
  return rows
    .map((row) =>
      row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","),
    )
    .join("\n");
}
