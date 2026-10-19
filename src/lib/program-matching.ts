import type { useTranslations } from "next-intl";

import {
  type MatchCandidate,
  type MatchingOverview,
  type WaitingTeam,
} from "@/interfaces/program-matching";

export enum MatchTab {
  Waiting = "WAITING",
  Active = "ACTIVE",
  Past = "PAST",
}

export type MatchingT = ReturnType<typeof useTranslations<"programMatching">>;

export function matchTabOptions(
  overview: MatchingOverview | undefined,
  t: MatchingT,
) {
  return [
    {
      id: MatchTab.Waiting,
      label: t("tabs.WAITING", { count: overview?.waiting.length ?? 0 }),
    },
    {
      id: MatchTab.Active,
      label: t("tabs.ACTIVE", { count: overview?.active.length ?? 0 }),
    },
    {
      id: MatchTab.Past,
      label: t("tabs.PAST", { count: overview?.past.length ?? 0 }),
    },
  ];
}

export function waitingLabel(days: number, t: MatchingT) {
  return days === 0 ? t("today") : t("days", { count: days });
}

/** "E-ticaret · Erken aşama · Yetkili: Mert Aydın"; `stage` is the saved stage, already labelled. */
export function teamMeta(
  team: WaitingTeam,
  stage: string | null,
  t: MatchingT,
) {
  return [
    team.sector,
    stage,
    team.leadName && t("lead", { name: team.leadName }),
  ]
    .filter(Boolean)
    .join(" · ");
}

export function isFull(candidate: MatchCandidate) {
  return candidate.activeTeams >= candidate.capacity;
}

export function loadShare(candidate: MatchCandidate) {
  return candidate.capacity > 0
    ? Math.min(100, (candidate.activeTeams / candidate.capacity) * 100)
    : 100;
}

/** "Yük 3/4 → 4/4 olacak" in the confirmation. */
export function loadAfterMatch(candidate: MatchCandidate, t: MatchingT) {
  return t("loadAfter", {
    active: candidate.activeTeams,
    capacity: candidate.capacity,
    next: candidate.activeTeams + 1,
  });
}

export function filterPool(pool: MatchCandidate[], search: string) {
  const query = search.trim().toLocaleLowerCase("tr");
  if (!query) return [];
  return pool.filter((candidate) =>
    [candidate.fullName, candidate.title ?? "", ...candidate.specialties].some(
      (value) => value.toLocaleLowerCase("tr").includes(query),
    ),
  );
}

export const INTRO_MEETING_MINUTES = 30;
export const INTRO_AGENDA = "İlk tanışma görüşmesi";

/** The mentorship a match just created, found in the overview the match call returns. */
export function findMatch(
  overview: MatchingOverview,
  organizationId: string,
  mentorId: string,
) {
  return (
    overview.active.find(
      (match) =>
        match.organizationId === organizationId && match.mentorId === mentorId,
    ) ?? null
  );
}

/** What the "İlk adımlar" drawer needs about a match made a moment ago. */
export type FirstSteps = {
  mentorshipId: string;
  teamName: string;
  leadName: string | null;
  mentorId: string;
  mentorName: string;
  mentorLoad: string;
  matchedAt: string;
};
