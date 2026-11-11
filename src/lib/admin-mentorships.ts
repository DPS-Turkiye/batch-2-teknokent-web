import type { useTranslations } from "next-intl";

import type { AdminIntervention } from "@/interfaces/admin-intervention";
import type {
  AdminBottleneck,
  AdminMentorship,
  AdminOverview,
  AdminProgram,
  AdminRequest,
  AdminStartup,
} from "@/interfaces/admin-overview";
import { MentorshipStatus } from "@/interfaces/coordinator-mentorship";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { ProgramStatus } from "@/interfaces/program";
import { UserAccountStatus } from "@/interfaces/session";
import {
  daysSince,
  mentorshipInPrograms,
  needsAttention,
  programForOrganization,
  programOfMentorship,
  unmatchedStartups,
} from "@/lib/admin-model";
import { isEnumValue } from "@/lib/enum";
import {
  matchesProgramType,
  type ProgramTypeFilter,
} from "@/lib/program-types";
import {
  InterventionFilter,
  InterventionKind,
  MatchingFilter,
  MatchingSort,
} from "@/types/admin-mentorships";

export type MentorshipsT = ReturnType<
  typeof useTranslations<"adminMentorships">
>;

/** The empty value of the scope and program selects: every program. */
export const ALL_PROGRAMS = "";

/** A pair that has not met for this many days is late. */
const STALE_DAYS = 14;
/** A mentorship that started within this many days counts as matched this week. */
const THIS_WEEK_DAYS = 7;
const DAY_MS = 86_400_000;

export const INTERVENTION_FILTERS: readonly InterventionFilter[] = [
  InterventionFilter.All,
  InterventionFilter.Critical,
  InterventionFilter.Bottleneck,
  InterventionFilter.Unanswered,
  InterventionFilter.Assigned,
];

export const MATCHING_FILTERS: readonly MatchingFilter[] = [
  MatchingFilter.Waiting,
  MatchingFilter.ThisWeek,
  MatchingFilter.Declined,
];

export const MATCHING_SORTS: readonly MatchingSort[] = [
  MatchingSort.Wait,
  MatchingSort.Name,
];

export type InterventionRow = {
  id: string;
  mentorshipId: string | null;
  kind: InterventionKind;
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

/** An intervention row with the coordinator follow-up opened for it, if any. */
export type InterventionEntry = {
  row: InterventionRow;
  tracked: AdminIntervention | undefined;
};

export type MatchRow = {
  id: string;
  teamName: string;
  programName: string;
  coordinatorName: string;
  coordinatorId: string | null;
  missingAccess: boolean;
  need: string | null;
  waitDays: number | null;
};

export type MentorshipHealth = {
  completed: boolean;
  green: number;
  amber: number;
  red: number;
  /** green + amber + red. */
  active: number;
};

export type InterventionSignal = {
  label: string;
  value: string;
  alert?: boolean;
};

/** The programs of the chosen type, then those of the chosen scope (a program name, or every program). */
export function programsInScope(
  programs: AdminProgram[],
  type: ProgramTypeFilter,
  scope: string,
) {
  const typed = programs.filter((program) =>
    matchesProgramType(program.type, type),
  );
  return {
    typed,
    programs:
      scope === ALL_PROGRAMS
        ? typed
        : typed.filter((program) => program.name === scope),
  };
}

/** Running programs; interventions and matching look only at these. */
export function livePrograms(programs: AdminProgram[]) {
  return programs.filter((program) => program.status === ProgramStatus.Active);
}

export function activeMentorships(
  data: AdminOverview,
  programs: AdminProgram[],
) {
  return data.mentorships.filter(
    (item) =>
      item.status === MentorshipStatus.Active &&
      mentorshipInPrograms(item, programs),
  );
}

export function organizationIds(programs: AdminProgram[]) {
  return new Set(
    programs.flatMap((program) =>
      program.startups.map((startup) => startup.id),
    ),
  );
}

export function hasBottleneck(data: AdminOverview, organizationId: string) {
  return data.bottlenecks.some(
    (item) => item.organizationId === organizationId,
  );
}

/** A program's active pairs by health: late (red), blocked (amber) or fine (green); nothing for a finished program. */
export function programHealth(
  program: AdminProgram,
  data: AdminOverview,
  now = new Date(),
): MentorshipHealth {
  const completed = program.status === ProgramStatus.Completed;
  let green = 0;
  let amber = 0;
  let red = 0;
  if (!completed) {
    for (const item of activeMentorships(data, [program])) {
      if (needsAttention(item, now)) red += 1;
      else if (hasBottleneck(data, item.organizationId)) amber += 1;
      else green += 1;
    }
  }
  return { completed, green, amber, red, active: green + amber + red };
}

/** Whole days from an instant to now, never negative. */
export function daysSinceInstant(value: string, now = new Date()) {
  return Math.max(
    0,
    Math.floor((now.getTime() - new Date(value).getTime()) / DAY_MS),
  );
}

/**
 * The pairs that need the admin: every late pair (critical, with its team's bottlenecks), then each other team of
 * these programs with open bottlenecks (one row per team).
 */
export function interventionRows(
  data: AdminOverview,
  programs: AdminProgram[],
  t: MentorshipsT,
  now = new Date(),
): InterventionRow[] {
  const ids = organizationIds(programs);
  const covered = new Set<string>();
  const rows: InterventionRow[] = [];
  for (const item of data.mentorships) {
    if (!mentorshipInPrograms(item, programs) || !needsAttention(item, now)) {
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
      kind: InterventionKind.Critical,
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
      days: item.daysSinceMeeting ?? daysSince(item.startDate, now),
      goalDone: item.goalDone ?? null,
      goalTotal: item.goalTotal ?? null,
    });
  }
  const grouped = new Map<string, AdminBottleneck[]>();
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
        item.organizationId === organizationId &&
        item.status === MentorshipStatus.Active,
    );
    const lead = blocks[0];
    if (!lead) continue;
    const oldest = blocks.reduce(
      (min, block) => (block.createdAt < min ? block.createdAt : min),
      lead.createdAt,
    );
    rows.push({
      id: blocks.map((block) => block.id).join(":"),
      mentorshipId: mentorship?.id ?? null,
      kind: InterventionKind.Bottleneck,
      mentorName: mentorship?.mentorName ?? t("noMentor"),
      teamName: lead.organizationName,
      programName: program?.name ?? "—",
      coordinatorName: program?.coordinatorName ?? "—",
      coordinatorId: program?.coordinatorId ?? null,
      issue: blocks.map((block) => block.title).join(" · "),
      noMeeting: false,
      days: daysSinceInstant(oldest, now),
      goalDone: mentorship?.goalDone ?? null,
      goalTotal: mentorship?.goalTotal ?? null,
    });
  }
  return rows;
}

/** The numbers of the overview tab's stat cards. */
export function overviewSummary(
  data: AdminOverview,
  programs: AdminProgram[],
  t: MentorshipsT,
  now = new Date(),
) {
  const live = livePrograms(programs);
  const active = activeMentorships(data, live);
  const gaps = active
    .map((item) => item.daysSinceMeeting)
    .filter((value): value is number => value != null);
  const rows = interventionRows(data, live, t, now);
  const critical = rows.filter((row) => row.kind === InterventionKind.Critical);
  const activePrograms = new Set(
    active
      .map((item) => programOfMentorship(data, item)?.name)
      .filter((name): name is string => Boolean(name)),
  );
  return {
    activeCount: active.length,
    activeProgramCount: activePrograms.size,
    criticalCount: critical.length,
    criticalProgramCount: new Set(critical.map((row) => row.programName)).size,
    bottleneckCount: rows.filter(
      (row) => row.kind === InterventionKind.Bottleneck,
    ).length,
    /** Mean days since the last meeting, rounded; null when no active pair has met. */
    averageGap: gaps.length
      ? Math.round(gaps.reduce((sum, value) => sum + value, 0) / gaps.length)
      : null,
  };
}

/** The interventions filter named in the URL, or every row. */
export function interventionFilterOf(value: string | null) {
  return isEnumValue(InterventionFilter, value)
    ? value
    : InterventionFilter.All;
}

/** The coordinator follow-ups still open, by mentorship. */
export function openFollowUps(follow: readonly AdminIntervention[]) {
  return new Map(
    follow
      .filter((item) => item.resolvedAt == null)
      .map((item) => [item.mentorshipId, item]),
  );
}

export function interventionEntries(
  rows: InterventionRow[],
  open: ReadonlyMap<string, AdminIntervention>,
): InterventionEntry[] {
  return rows.map((row) => ({
    row,
    tracked: row.mentorshipId ? open.get(row.mentorshipId) : undefined,
  }));
}

/** A follow-up the coordinator has not opened yet. */
function isUnanswered(entry: InterventionEntry) {
  return entry.tracked != null && entry.tracked.readAt == null;
}

export function matchesInterventionFilter(
  entry: InterventionEntry,
  filter: InterventionFilter,
) {
  switch (filter) {
    case InterventionFilter.All:
      return true;
    case InterventionFilter.Critical:
      return entry.row.kind === InterventionKind.Critical && !entry.tracked;
    case InterventionFilter.Bottleneck:
      return entry.row.kind === InterventionKind.Bottleneck && !entry.tracked;
    case InterventionFilter.Unanswered:
      return isUnanswered(entry);
    case InterventionFilter.Assigned:
      return entry.tracked != null;
  }
}

export function interventionCounts(
  entries: InterventionEntry[],
): Record<InterventionFilter, number> {
  const count = (filter: InterventionFilter) =>
    entries.filter((entry) => matchesInterventionFilter(entry, filter)).length;
  return {
    [InterventionFilter.All]: count(InterventionFilter.All),
    [InterventionFilter.Critical]: count(InterventionFilter.Critical),
    [InterventionFilter.Bottleneck]: count(InterventionFilter.Bottleneck),
    [InterventionFilter.Unanswered]: count(InterventionFilter.Unanswered),
    [InterventionFilter.Assigned]: count(InterventionFilter.Assigned),
  };
}

/** Case-insensitive (Turkish) substring search over the given fields. */
export function matchesSearch(fields: readonly string[], search: string) {
  return fields
    .join(" ")
    .toLocaleLowerCase("tr")
    .includes(search.toLocaleLowerCase("tr"));
}

export function visibleInterventions(
  entries: InterventionEntry[],
  { filter, program, search }: InterventionQuery,
) {
  return entries.filter((entry) => {
    const { row } = entry;
    if (!matchesInterventionFilter(entry, filter)) return false;
    if (program !== ALL_PROGRAMS && row.programName !== program) return false;
    return matchesSearch(
      [row.mentorName, row.teamName, row.programName, row.issue],
      search,
    );
  });
}

export type InterventionQuery = {
  filter: InterventionFilter;
  program: string;
  search: string;
};

export function pairLabel(
  row: Pick<InterventionRow, "mentorName" | "teamName">,
) {
  return `${row.mentorName} ↔ ${row.teamName}`;
}

/** What the notify dialog and the follow-up drawer show about a pair. */
export function interventionSignals(row: InterventionRow, t: MentorshipsT) {
  const stale = row.days != null && row.days >= STALE_DAYS;
  const signals: InterventionSignal[] = [
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

/** The coordinator's row in the admin users screen, or the screen itself when there is none. */
export function coordinatorHref(coordinatorId: string | null) {
  return coordinatorId
    ? `/admin/users?user=${encodeURIComponent(coordinatorId)}`
    : "/admin/users";
}

/** A coordinator whose account is not approved cannot act on the program. */
export function missingCoordinatorAccess(
  data: AdminOverview,
  program: AdminProgram | undefined,
) {
  if (!program) return false;
  const coordinator = data.users.find(
    (user) => user.id === program.coordinatorId,
  );
  return (
    coordinator != null && coordinator.status !== UserAccountStatus.Approved
  );
}

const OPEN_REQUEST_STATUSES: ReadonlySet<MentorshipRequestStatus> = new Set([
  MentorshipRequestStatus.Pending,
  MentorshipRequestStatus.MoreInfoRequested,
  MentorshipRequestStatus.CounterProposed,
]);

/** The team's mentorship request still waiting for an answer, if any. */
export function openRequest(data: AdminOverview, organizationId: string) {
  return (
    data.requests.find(
      (item) =>
        item.organizationId === organizationId &&
        OPEN_REQUEST_STATUSES.has(item.status),
    ) ?? null
  );
}

function startupMatchRow(
  data: AdminOverview,
  startup: AdminStartup,
  request: AdminRequest | null,
  now: Date,
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
    waitDays: request ? daysSinceInstant(request.createdAt, now) : null,
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

function requestMatchRow(
  data: AdminOverview,
  item: AdminRequest,
  now: Date,
): MatchRow {
  const program = programForOrganization(data, item.organizationId);
  return {
    id: item.id,
    teamName: item.organizationName,
    programName: program?.name ?? "—",
    coordinatorName: program?.coordinatorName ?? "—",
    coordinatorId: program?.coordinatorId ?? null,
    missingAccess: missingCoordinatorAccess(data, program),
    need: item.supportArea,
    waitDays: daysSinceInstant(item.createdAt, now),
  };
}

/** Teams of these programs without a mentor, with the request they are waiting on. */
export function waitingTeams(
  data: AdminOverview,
  programs: AdminProgram[],
  now = new Date(),
): MatchRow[] {
  const ids = organizationIds(programs);
  return unmatchedStartups(data)
    .filter((startup) => ids.has(startup.id))
    .map((startup) =>
      startupMatchRow(data, startup, openRequest(data, startup.id), now),
    );
}

export function matchedThisWeek(
  data: AdminOverview,
  programs: AdminProgram[],
  now = new Date(),
): MatchRow[] {
  return activeMentorships(data, programs)
    .filter((item) => {
      const age = daysSince(item.startDate, now);
      return age >= 0 && age <= THIS_WEEK_DAYS;
    })
    .map((item) => mentorshipMatchRow(data, item));
}

export function declinedRequests(
  data: AdminOverview,
  programs: AdminProgram[],
  now = new Date(),
): MatchRow[] {
  const ids = organizationIds(programs);
  return data.requests
    .filter(
      (item) =>
        item.status === MentorshipRequestStatus.Declined &&
        ids.has(item.organizationId),
    )
    .map((item) => requestMatchRow(data, item, now));
}

/** The matching tab's rows by filter, and the numbers of its stat cards. */
export function matchingSummary(
  data: AdminOverview,
  programs: AdminProgram[],
  now = new Date(),
) {
  const rows: Record<MatchingFilter, MatchRow[]> = {
    [MatchingFilter.Waiting]: waitingTeams(data, programs, now),
    [MatchingFilter.ThisWeek]: matchedThisWeek(data, programs, now),
    [MatchingFilter.Declined]: declinedRequests(data, programs, now),
  };
  const waits = rows[MatchingFilter.Waiting]
    .map((item) => item.waitDays)
    .filter((value): value is number => value != null);
  return {
    rows,
    /** Mean wait in days to one decimal; null when no waiting team has a request date. */
    averageWait: waits.length
      ? Math.round(
          (waits.reduce((sum, value) => sum + value, 0) / waits.length) * 10,
        ) / 10
      : null,
    waitingProgramCount: new Set(
      rows[MatchingFilter.Waiting].map((item) => item.programName),
    ).size,
  };
}

export type MatchingQuery = {
  program: string;
  search: string;
  sort: MatchingSort;
};

/** One filter's rows narrowed by program and search, longest wait or team name first. */
export function visibleMatches(
  rows: MatchRow[],
  { program, search, sort }: MatchingQuery,
) {
  const shown = rows.filter((item) => {
    if (program !== ALL_PROGRAMS && item.programName !== program) return false;
    return matchesSearch(
      [item.teamName, item.programName, item.need ?? ""],
      search,
    );
  });
  switch (sort) {
    case MatchingSort.Name:
      return [...shown].sort((a, b) =>
        a.teamName.localeCompare(b.teamName, "tr"),
      );
    case MatchingSort.Wait:
      return [...shown].sort((a, b) => (b.waitDays ?? -1) - (a.waitDays ?? -1));
  }
}
