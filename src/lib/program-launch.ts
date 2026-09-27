import {
  type CoordinatorProgramDetail,
  type CreateProgramInput,
  ProgramLifecycle,
  type ProgramTeam,
  TeamJoinStatus,
} from "@/interfaces/coordinator-program";
import { isEmailAddress } from "@/lib/utils";

export enum LaunchStep {
  Basics = "BASICS",
  Rules = "RULES",
  Teams = "TEAMS",
}

export const LAUNCH_STEPS = [
  {
    id: LaunchStep.Basics,
    label: "Temel bilgiler",
    hint: "Ad, tarih, koordinatör",
  },
  {
    id: LaunchStep.Rules,
    label: "Mentorluk kuralları",
    hint: "Kapasite ve eşikler",
  },
  { id: LaunchStep.Teams, label: "Takımlar", hint: "Takım ve yetkililer" },
] as const;

export type LaunchRules = Pick<
  CreateProgramInput,
  | "defaultMentorCapacity"
  | "meetingFrequencyDays"
  | "communicationGapDays"
  | "bottleneckFlagDays"
>;

export const DEFAULT_LAUNCH_RULES: LaunchRules = {
  defaultMentorCapacity: 4,
  meetingFrequencyDays: 14,
  communicationGapDays: 14,
  bottleneckFlagDays: 21,
};

export type TeamRowDraft = { key: string; teamName: string; leadEmail: string };

export type LaunchDraft = {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  rules: LaunchRules;
  teams: TeamRowDraft[];
};

let rowKeySeed = 0;
export function emptyTeamRow(): TeamRowDraft {
  rowKeySeed += 1;
  return { key: `team-row-${rowKeySeed}`, teamName: "", leadEmail: "" };
}

export function emptyLaunchDraft(): LaunchDraft {
  return {
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    rules: { ...DEFAULT_LAUNCH_RULES },
    teams: [emptyTeamRow()],
  };
}

export const MAX_LAUNCH_TEAMS = 200;

/** The first problem with step 1, in Turkish, or null. */
export function basicsError(draft: LaunchDraft) {
  if (!draft.name.trim()) return "Program adı gerekli.";
  if (draft.startDate && draft.endDate && draft.endDate < draft.startDate) {
    return "Program bitişi başlangıçtan önce olamaz.";
  }
  return null;
}

export enum TeamRowProblem {
  MissingName = "MISSING_NAME",
  InvalidEmail = "INVALID_EMAIL",
  DuplicateEmail = "DUPLICATE_EMAIL",
}

export const TEAM_ROW_PROBLEM_LABELS: Record<TeamRowProblem, string> = {
  [TeamRowProblem.MissingName]: "Takım adı gerekli",
  [TeamRowProblem.InvalidEmail]: "Geçersiz e-posta",
  [TeamRowProblem.DuplicateEmail]: "Bu e-posta başka satırda var",
};

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

export function filledTeamRows(rows: TeamRowDraft[]) {
  return rows.filter((row) => !isBlankRow(row));
}

/** Mirrors the backend's TeamCodes.prefix so the wizard can preview "BIGG26-····". */
export function teamCodePrefix(programName: string) {
  const ascii = programName
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ı/g, "i")
    .toUpperCase();
  const words = ascii.split(/[^A-Z0-9]+/).filter(Boolean);
  const year = words.filter((word) => /^\d{4}$/.test(word)).at(-1);
  const word = words.filter((value) => !/^\d+$/.test(value)).at(-1) ?? "TAKIM";
  return word.slice(0, 6) + (year ? year.slice(2) : "");
}

/** "Takım adı, e-posta" per line; a header line and blank lines are skipped. */
export function parseTeamsCsv(text: string): TeamRowDraft[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.split(/[,;\t]/).map((cell) => cell.trim()))
    .filter(([name, email]) => name && email && email.includes("@"))
    .map(([teamName, leadEmail]) => ({
      ...emptyTeamRow(),
      teamName,
      leadEmail,
    }));
}

export function createProgramInput(draft: LaunchDraft): CreateProgramInput {
  return {
    name: draft.name.trim(),
    description: draft.description.trim() || null,
    startDate: draft.startDate || null,
    endDate: draft.endDate || null,
    coordinatorIds: [],
    ...draft.rules,
    teams: filledTeamRows(draft.teams).map((row) => ({
      teamName: row.teamName.trim(),
      leadEmail: row.leadEmail.trim(),
    })),
  };
}

export enum TeamFilter {
  All = "ALL",
  Joined = "JOINED",
  Waiting = "WAITING",
}

export function teamFilterOptions(teams: ProgramTeam[]) {
  const joined = teams.filter(
    (team) => team.status === TeamJoinStatus.Joined,
  ).length;
  return [
    { id: TeamFilter.All, label: `Tümü ${teams.length}` },
    { id: TeamFilter.Joined, label: `Katıldı ${joined}` },
    {
      id: TeamFilter.Waiting,
      label: `Yetkili bekleniyor ${teams.length - joined}`,
    },
  ];
}

export function filterTeams(teams: ProgramTeam[], filter: TeamFilter) {
  if (filter === TeamFilter.All) return teams;
  const status =
    filter === TeamFilter.Joined
      ? TeamJoinStatus.Joined
      : TeamJoinStatus.Waiting;
  return teams.filter((team) => team.status === status);
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
): SetupStep[] | null {
  if (detail.program.lifecycle === ProgramLifecycle.Completed) return null;
  const base = `/coordinator/programs/${encodeURIComponent(detail.program.id)}`;
  const joined = teams.filter(
    (team) => team.status === TeamJoinStatus.Joined,
  ).length;
  const steps: SetupStep[] = [
    {
      key: "created",
      title: "Program oluşturuldu",
      detail: "Temel bilgiler ve mentorluk kuralları",
      done: true,
      link: { label: "Gör", href: `${base}/settings` },
    },
    {
      key: "teams",
      title:
        teams.length > 0
          ? `${teams.length} takım eklendi, kodlar hazır`
          : "Takımları ekle",
      detail:
        teams.length > 0
          ? `${joined} yetkili katıldı · ${teams.length - joined} bekleniyor`
          : "Her takım yetkilisi için bir katılım kodu üretilir",
      done: teams.length > 0,
      link: {
        label: teams.length > 0 ? "Gör" : "Takım ekle",
        href: `${base}/teams`,
      },
    },
    {
      key: "mentors",
      title: "Mentor havuzunu oluştur",
      detail:
        detail.program.mentorCount > 0
          ? `${detail.program.mentorCount} mentor havuzda`
          : "Henüz mentor yok",
      done: detail.program.mentorCount > 0,
      link: { label: "Mentor davet et", href: `${base}/mentors` },
    },
    {
      key: "matching",
      title: "Eşleşmeleri başlat",
      detail: "Havuz hazır olunca öneriler açılır",
      done: detail.program.activeMentorshipCount > 0,
      link: { label: "Eşleştir", href: `${base}/matching` },
    },
  ];
  return steps.every((step) => step.done) ? null : steps;
}
