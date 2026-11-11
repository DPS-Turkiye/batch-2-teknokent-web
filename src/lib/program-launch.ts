import type { useTranslations } from "next-intl";

import {
  ProgramLifecycle,
  TeamJoinStatus,
  type CoordinatorProgramDetail,
  type ProgramTeam,
} from "@/interfaces/coordinator-program";
import type { ProgramsT } from "@/lib/coordinator-programs";
import { formatDayMonth, isEmailAddress } from "@/lib/utils";

export type TeamRowDraft = { key: string; teamName: string; leadEmail: string };

let rowKeySeed = 0;
export function emptyTeamRow(): TeamRowDraft {
  rowKeySeed += 1;
  return { key: `team-row-${rowKeySeed}`, teamName: "", leadEmail: "" };
}

export enum TeamRowProblem {
  MissingName = "MISSING_NAME",
  InvalidEmail = "INVALID_EMAIL",
  DuplicateEmail = "DUPLICATE_EMAIL",
}

function isBlankRow(row: TeamRowDraft) {
  return !row.teamName.trim() && !row.leadEmail.trim();
}

/** Problems per row key; a wholly empty row is the "add another" placeholder and is ignored. */
export function teamRowProblems(rows: TeamRowDraft[]) {
  const problems = new Map<string, TeamRowProblem>();
  const seen = new Set<string>();
  for (const row of rows) {
    if (isBlankRow(row)) continue;
    const email = row.leadEmail.trim().toLowerCase();
    if (!row.teamName.trim()) {
      problems.set(row.key, TeamRowProblem.MissingName);
    } else if (!isEmailAddress(email)) {
      problems.set(row.key, TeamRowProblem.InvalidEmail);
    } else if (seen.has(email)) {
      problems.set(row.key, TeamRowProblem.DuplicateEmail);
    }
    seen.add(email);
  }
  return problems;
}

export enum TeamFilter {
  All = "ALL",
  Joined = "JOINED",
  Waiting = "WAITING",
  Problem = "PROBLEM",
}

/** A waiting team whose code email SES refused: "E-posta iletilemedi", listed under "Sorunlu". */
export function isTeamProblem(team: ProgramTeam) {
  return team.status === TeamJoinStatus.Waiting && team.codeSendFailed;
}

function teamFilterOf(team: ProgramTeam) {
  if (team.status === TeamJoinStatus.Joined) return TeamFilter.Joined;
  return isTeamProblem(team) ? TeamFilter.Problem : TeamFilter.Waiting;
}

export type TeamsT = ReturnType<typeof useTranslations<"programTeams">>;

export function teamFilterOptions(teams: ProgramTeam[], t: TeamsT) {
  return Object.values(TeamFilter).map((id) => ({
    id,
    label: t(`filters.${id}`, {
      count:
        id === TeamFilter.All
          ? teams.length
          : teams.filter((team) => teamFilterOf(team) === id).length,
    }),
  }));
}

export function filterTeams(teams: ProgramTeam[], filter: TeamFilter) {
  if (filter === TeamFilter.All) return teams;
  return teams.filter((team) => teamFilterOf(team) === filter);
}

/** "Gönderildi 19 Eyl · ali@pusula.io" once the code has been emailed. */
export function codeSentLabel(team: ProgramTeam, t: TeamsT, locale: string) {
  if (!team.codeSentAt) return null;
  return t("codeSent", {
    date: formatDayMonth(new Date(team.codeSentAt), locale),
    email: team.leadEmail ?? "",
  }).trim();
}

const DAY = 24 * 60 * 60 * 1000;

/** Whole days since the code was created, for "Yetkili bekleniyor · 3 gün". */
export function daysWaiting(invitedAt: string | null, now = new Date()) {
  if (!invitedAt) return 0;
  return Math.max(
    0,
    Math.floor((now.getTime() - new Date(invitedAt).getTime()) / DAY),
  );
}

export type SetupStep = {
  key: string;
  title: string;
  detail: string;
  done: boolean;
  link: { label: string; href: string | null } | null;
};

/** The "Kurulum n / 4" checklist; null once every step is done or the program is archived. */
export function setupSteps(
  detail: CoordinatorProgramDetail,
  teams: ProgramTeam[],
  t: ProgramsT,
): SetupStep[] | null {
  if (detail.program.lifecycle === ProgramLifecycle.Completed) return null;
  const base = `/coordinator/programs/${encodeURIComponent(detail.program.id)}`;
  const joined = teams.filter(
    (team) => team.status === TeamJoinStatus.Joined,
  ).length;
  const steps: SetupStep[] = [
    {
      key: "created",
      title: t("setup.createdTitle"),
      detail: t("setup.createdDetail"),
      done: true,
      link: { label: t("setup.see"), href: `${base}/settings` },
    },
    {
      key: "teams",
      title:
        teams.length > 0
          ? t("setup.teamsTitle", { count: teams.length })
          : t("setup.teamsEmptyTitle"),
      detail:
        teams.length > 0
          ? t("setup.teamsDetail", {
              joined,
              waiting: teams.length - joined,
            })
          : t("setup.teamsEmptyDetail"),
      done: teams.length > 0,
      link: {
        label: teams.length > 0 ? t("setup.see") : t("setup.addTeam"),
        href: `${base}/teams`,
      },
    },
    {
      key: "mentors",
      title: t("setup.mentorsTitle"),
      detail:
        detail.program.mentorCount > 0
          ? t("setup.mentorsDetail", { count: detail.program.mentorCount })
          : t("setup.mentorsEmpty"),
      done: detail.program.mentorCount > 0,
      link: { label: t("setup.inviteMentor"), href: `${base}/mentors` },
    },
    {
      key: "matching",
      title: t("setup.matchingTitle"),
      detail: t("setup.matchingDetail"),
      done: detail.program.activeMentorshipCount > 0,
      link: { label: t("setup.match"), href: `${base}/matching` },
    },
  ];
  return steps.every((step) => step.done) ? null : steps;
}
