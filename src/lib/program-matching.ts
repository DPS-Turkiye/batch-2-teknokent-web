import {
  type MatchCandidate,
  type MatchingOverview,
  MatchNeedSource,
  type WaitingTeam,
} from "@/interfaces/program-matching";

export enum MatchTab {
  Waiting = "WAITING",
  Active = "ACTIVE",
  Past = "PAST",
}

export function matchTabOptions(overview: MatchingOverview | undefined) {
  return [
    {
      id: MatchTab.Waiting,
      label: `Bekleyen ${overview?.waiting.length ?? 0}`,
    },
    {
      id: MatchTab.Active,
      label: `Aktif eşleşmeler ${overview?.active.length ?? 0}`,
    },
    { id: MatchTab.Past, label: `Geçmiş ${overview?.past.length ?? 0}` },
  ];
}

export function needLabel(team: WaitingTeam) {
  return team.needTopic ?? "İhtiyaç belirtilmedi";
}

export const NEED_SOURCE_NOTES: Record<MatchNeedSource, string> = {
  [MatchNeedSource.Request]: "Takımın açık mentorluk talebinden",
  [MatchNeedSource.Profile]: "Startup profilindeki destek alanlarından",
  [MatchNeedSource.None]:
    "Takım henüz ihtiyaç belirtmedi; öneriler profile göre sıralandı",
};

export function waitingLabel(days: number) {
  return days === 0 ? "bugün" : `${days} gün`;
}

/** "E-ticaret · Erken aşama · Yetkili: Mert Aydın". */
export function teamMeta(team: WaitingTeam) {
  return [team.sector, team.stage, team.leadName && `Yetkili: ${team.leadName}`]
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
export function loadAfterMatch(candidate: MatchCandidate) {
  return `Yük ${candidate.activeTeams}/${candidate.capacity} → ${candidate.activeTeams + 1}/${candidate.capacity} olacak`;
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
