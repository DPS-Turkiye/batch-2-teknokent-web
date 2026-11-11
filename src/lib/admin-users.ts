import type { useTranslations } from "next-intl";

import type {
  AdminMentorship,
  AdminOverview,
  AdminProgram,
  AdminStartup,
  AdminUser,
} from "@/interfaces/admin-overview";
import { MentorshipStatus } from "@/interfaces/coordinator-mentorship";
import { ProgramMentorStatus } from "@/interfaces/program";
import { UserAccountStatus } from "@/interfaces/session";
import {
  activeMentorshipFor,
  needsAttention,
  programsForCoordinator,
  programsForMentor,
} from "@/lib/admin-model";
import { TeamHealth, UserDrawerSection, UserFilter } from "@/types/admin-users";

export type UsersT = ReturnType<typeof useTranslations<"adminUsers">>;

export const USERS_PAGE_SIZE = 7;

export const COORDINATOR_FILTERS = [
  UserFilter.All,
  UserFilter.Active,
  UserFilter.Pending,
  UserFilter.NoAccess,
  UserFilter.Inactive,
];
export const MENTOR_FILTERS = [
  UserFilter.All,
  UserFilter.Active,
  UserFilter.Pending,
  UserFilter.Invited,
  UserFilter.Inactive,
];
export const TEAM_FILTERS = [
  UserFilter.All,
  UserFilter.Mentored,
  UserFilter.Waiting,
  UserFilter.Risky,
];

export const COORDINATOR_SECTIONS = [
  UserDrawerSection.Overview,
  UserDrawerSection.Assigned,
  UserDrawerSection.Access,
  UserDrawerSection.Activity,
];
export const MENTOR_SECTIONS = [
  UserDrawerSection.Overview,
  UserDrawerSection.Programs,
  UserDrawerSection.Mentorships,
  UserDrawerSection.Activity,
];
export const TEAM_SECTIONS = [
  UserDrawerSection.Overview,
  UserDrawerSection.Team,
  UserDrawerSection.Mentorship,
];

export type FilterCounts = Partial<Record<UserFilter, number>>;

/** What the admin narrowed a users table to: a filter chip, a program name ("" for all) and a search text. */
export type UserListCriteria = {
  filter: UserFilter;
  program: string;
  search: string;
};

function matchesSearch(text: string, search: string) {
  return text.toLocaleLowerCase("tr").includes(search.toLocaleLowerCase("tr"));
}

function countWithStatus(
  users: readonly AdminUser[],
  status: UserAccountStatus,
) {
  return users.filter((user) => user.status === status).length;
}

/** The Aktif, Bekleyen and Pasif chips keep accounts with that status; every other chip lets them all through. */
function fitsAccountFilter(user: AdminUser, filter: UserFilter) {
  if (filter === UserFilter.Active) {
    return user.status === UserAccountStatus.Approved;
  }
  if (filter === UserFilter.Pending) {
    return user.status === UserAccountStatus.Pending;
  }
  if (filter === UserFilter.Inactive) {
    return user.status === UserAccountStatus.Rejected;
  }
  return true;
}

/** The rows on one page of a users table. */
export function pageOf<T>(rows: readonly T[], page: number) {
  return rows.slice(page * USERS_PAGE_SIZE, (page + 1) * USERS_PAGE_SIZE);
}

/** The pager's numbers: how many pages there are and the 1-based range of rows shown (0–0 when empty). */
export function pageRange(total: number, page: number) {
  return {
    pages: Math.max(1, Math.ceil(total / USERS_PAGE_SIZE)),
    start: total === 0 ? 0 : page * USERS_PAGE_SIZE + 1,
    end: Math.min(total, (page + 1) * USERS_PAGE_SIZE),
  };
}

/** How many coordinators each chip shows; no coordinator is counted as without access yet. */
export function coordinatorCounts(users: readonly AdminUser[]): FilterCounts {
  return {
    [UserFilter.All]: users.length,
    [UserFilter.Active]: countWithStatus(users, UserAccountStatus.Approved),
    [UserFilter.Pending]: countWithStatus(users, UserAccountStatus.Pending),
    [UserFilter.NoAccess]: 0,
    [UserFilter.Inactive]: countWithStatus(users, UserAccountStatus.Rejected),
  };
}

/** The coordinators the table lists, matching the chip, the program they coordinate and their name or email. */
export function filterCoordinators(
  data: AdminOverview,
  users: readonly AdminUser[],
  { filter, program, search }: UserListCriteria,
) {
  return users.filter((user) => {
    if (!fitsAccountFilter(user, filter)) return false;
    if (filter === UserFilter.NoAccess) return false;
    if (
      program &&
      !programsForCoordinator(data, user.id).some(
        (item) => item.name === program,
      )
    ) {
      return false;
    }
    return matchesSearch(`${user.fullName} ${user.email}`, search);
  });
}

/** An approved mentor still waiting to answer an invitation to one of these programs ("Davet gönderildi"). */
export function hasPendingInvite(
  user: AdminUser,
  programs: readonly AdminProgram[],
) {
  return (
    user.status === UserAccountStatus.Approved &&
    programs.some((program) =>
      program.mentors.some(
        (mentor) =>
          mentor.mentorId === user.id &&
          mentor.status === ProgramMentorStatus.Pending,
      ),
    )
  );
}

/** Whether the mentor's place in this program is still an unanswered invitation. */
export function isInvitePending(program: AdminProgram, mentorId: string) {
  return (
    program.mentors.find((mentor) => mentor.mentorId === mentorId)?.status ===
    ProgramMentorStatus.Pending
  );
}

/** How many mentors each chip shows. */
export function mentorCounts(
  data: AdminOverview,
  users: readonly AdminUser[],
): FilterCounts {
  return {
    [UserFilter.All]: users.length,
    [UserFilter.Active]: countWithStatus(users, UserAccountStatus.Approved),
    [UserFilter.Pending]: countWithStatus(users, UserAccountStatus.Pending),
    [UserFilter.Invited]: users.filter((user) =>
      hasPendingInvite(user, data.programs),
    ).length,
    [UserFilter.Inactive]: countWithStatus(users, UserAccountStatus.Rejected),
  };
}

/** The mentors the table lists, matching the chip, a program they are in and their name, email or expertise. */
export function filterMentors(
  data: AdminOverview,
  users: readonly AdminUser[],
  { filter, program, search }: UserListCriteria,
) {
  return users.filter((user) => {
    if (!fitsAccountFilter(user, filter)) return false;
    if (filter === UserFilter.Invited && !hasPendingInvite(user, data.programs))
      return false;
    if (
      program &&
      !programsForMentor(data, user.id).some((item) => item.name === program)
    ) {
      return false;
    }
    return matchesSearch(
      `${user.fullName} ${user.email} ${(user.expertise ?? []).join(" ")}`,
      search,
    );
  });
}

/** A mentor's load: their active and planned mentorships. */
export function liveMentorshipsOf(data: AdminOverview, mentorId: string) {
  return data.mentorships.filter(
    (item) =>
      item.mentorId === mentorId &&
      (item.status === MentorshipStatus.Active ||
        item.status === MentorshipStatus.Planned),
  );
}

/** Whether one of these mentorships has gone too long without a meeting ("Görüşme yok"). */
export function hasStaleMentorship(mentorships: readonly AdminMentorship[]) {
  return mentorships.some(
    (item) => item.status === MentorshipStatus.Active && needsAttention(item),
  );
}

/** One row of the Mentorlar table. */
export function mentorRow(data: AdminOverview, user: AdminUser) {
  const programs = programsForMentor(data, user.id);
  const mentorships = liveMentorshipsOf(data, user.id);
  return {
    user,
    programs,
    mentorships,
    stale: hasStaleMentorship(mentorships),
    pendingInvite: hasPendingInvite(user, programs),
  };
}

/** A team is listed once per program it is in, so the program is part of its key. */
export function teamKey(startup: Pick<AdminStartup, "id" | "programId">) {
  return `${startup.programId}:${startup.id}`;
}

/** A team without an active or planned mentorship in that program is waiting for a mentor. */
export function isWaitingForMentor(data: AdminOverview, startup: AdminStartup) {
  return !activeMentorshipFor(data, startup);
}

/** A team whose active mentorship has gone too long without a meeting. */
export function isRiskyTeam(data: AdminOverview, startup: AdminStartup) {
  const mentorship = activeMentorshipFor(data, startup);
  return Boolean(mentorship && needsAttention(mentorship));
}

/** How many teams each chip shows. */
export function teamCounts(
  data: AdminOverview,
  teams: readonly AdminStartup[],
): FilterCounts {
  return {
    [UserFilter.All]: teams.length,
    [UserFilter.Mentored]: teams.filter(
      (startup) => !isWaitingForMentor(data, startup),
    ).length,
    [UserFilter.Waiting]: teams.filter((startup) =>
      isWaitingForMentor(data, startup),
    ).length,
    [UserFilter.Risky]: teams.filter((startup) => isRiskyTeam(data, startup))
      .length,
  };
}

/** The teams the table lists, matching the chip, the program and the team, founder or program name. */
export function filterTeams(
  data: AdminOverview,
  teams: readonly AdminStartup[],
  { filter, program, search }: UserListCriteria,
) {
  return teams.filter((startup) => {
    if (filter === UserFilter.Mentored && isWaitingForMentor(data, startup))
      return false;
    if (filter === UserFilter.Waiting && !isWaitingForMentor(data, startup))
      return false;
    if (filter === UserFilter.Risky && !isRiskyTeam(data, startup))
      return false;
    if (program && startup.programName !== program) return false;
    return matchesSearch(
      `${startup.name} ${startup.founderName ?? ""} ${startup.programName}`,
      search,
    );
  });
}

/** The rows (people, bottlenecks, requests…) that belong to one organization. */
export function ofOrganization<T extends { organizationId: string | null }>(
  items: readonly T[],
  organizationId: string,
) {
  return items.filter((item) => item.organizationId === organizationId);
}

/**
 * A mentored team is risky when its mentorship needs attention, needs follow-up when it has an open bottleneck, and
 * is healthy otherwise; a team still waiting for a mentor has no health (null).
 */
export function teamHealth(data: AdminOverview, startup: AdminStartup) {
  const mentorship = activeMentorshipFor(data, startup);
  if (!mentorship) return null;
  if (needsAttention(mentorship)) return TeamHealth.Risky;
  if (data.bottlenecks.some((item) => item.organizationId === startup.id)) {
    return TeamHealth.FollowUp;
  }
  return TeamHealth.Healthy;
}

/** One row of the Takımlar table. */
export function teamRow(data: AdminOverview, startup: AdminStartup) {
  return {
    startup,
    key: teamKey(startup),
    mentorship: activeMentorshipFor(data, startup),
    members: ofOrganization(data.users, startup.id),
    health: teamHealth(data, startup),
  };
}

const MINUTE_MS = 60_000;
const HOUR_MINUTES = 60;
const DAY_MINUTES = 24 * HOUR_MINUTES;
/** Activity older than a week is shown as stale. */
const STALE_MINUTES = 7 * DAY_MINUTES;

/** "Az önce", "3 saat önce", "Dün"… for a timestamp, and whether it is over a week old; null when unknown. */
export function relativeTime(
  value: string | null | undefined,
  t: UsersT,
  now = Date.now(),
) {
  if (!value) return null;
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return null;
  const minutes = Math.floor((now - then) / MINUTE_MS);
  let label = t("justNow");
  if (minutes >= 2 * DAY_MINUTES) {
    label = t("daysAgo", { count: Math.floor(minutes / DAY_MINUTES) });
  } else if (minutes >= DAY_MINUTES) label = t("yesterday");
  else if (minutes >= HOUR_MINUTES) {
    label = t("hoursAgo", { count: Math.floor(minutes / HOUR_MINUTES) });
  } else if (minutes >= 1) label = t("minutesAgo", { count: minutes });
  return { label, stale: minutes >= STALE_MINUTES };
}
