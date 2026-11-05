import { clientText } from "@/i18n/client-texts";
import type {
  CoordinatorProgramDetail,
  ProgramPhaseInput,
  ProgramRules,
  UpdateProgramDetailsInput,
} from "@/interfaces/coordinator-program";
import { formatMonthRange, type ProgramsT } from "@/lib/coordinator-programs";

export enum ProgramTab {
  Overview = "OVERVIEW",
  Teams = "TEAMS",
  MentorPool = "MENTOR_POOL",
  Matching = "MATCHING",
  Approvals = "APPROVALS",
  Settings = "SETTINGS",
}

export enum SettingsSection {
  General = "GENERAL",
  Coordinators = "COORDINATORS",
  Rules = "RULES",
  Archive = "ARCHIVE",
}

export function programTabs(
  detail: CoordinatorProgramDetail,
  programId: string,
) {
  const base = `/coordinator/programs/${encodeURIComponent(programId)}`;
  return [
    { id: ProgramTab.Overview, href: base, count: null },
    {
      id: ProgramTab.Teams,
      href: `${base}/teams`,
      count: detail.program.teamCount,
    },
    {
      id: ProgramTab.MentorPool,
      href: `${base}/mentors`,
      count: detail.program.mentorCount,
    },
    {
      id: ProgramTab.Matching,
      href: `${base}/matching`,
      count: detail.program.awaitingMatchCount,
    },
    { id: ProgramTab.Settings, href: `${base}/settings`, count: null },
  ];
}

/** "Şub 2026 – Ara 2026 · Mentorluk dönemi, hafta 6/16 · Koordinatörler: Elif Demir, Burcu Şen". */
export function programHeaderLine(
  detail: CoordinatorProgramDetail,
  t: ProgramsT,
  locale: string,
) {
  const program = detail.program;
  const parts: string[] = [];
  const range = formatMonthRange(program.startDate, program.endDate, locale);
  if (range) parts.push(range);
  if (program.currentPhase) {
    parts.push(
      program.currentWeek && program.totalWeeks
        ? t("phaseWeek", {
            phase: program.currentPhase.name,
            current: program.currentWeek,
            total: program.totalWeeks,
          })
        : program.currentPhase.name,
    );
  }
  if (detail.coordinators.length > 0) {
    parts.push(
      t("coordinators", {
        count: detail.coordinators.length,
        names: detail.coordinators
          .map((coordinator) => coordinator.fullName)
          .join(", "),
      }),
    );
  }
  return parts.join(" · ");
}

/** The widths of the healthy / follow-up / risky bar, as percentages that add up to 100. */
export function healthShares(health: CoordinatorProgramDetail["health"]) {
  const total = health.healthy + health.followUp + health.risky;
  if (total === 0) return { healthy: 0, followUp: 0, risky: 0, total };
  const pct = (value: number) => (value / total) * 100;
  return {
    healthy: pct(health.healthy),
    followUp: pct(health.followUp),
    risky: pct(health.risky),
    total,
  };
}

export type OverviewAction = {
  key: string;
  title: string;
  detail: string;
  tone: "orange" | "blue" | "both";
  target: { label: string; href: string | null };
};

/** The Genel Bakış action cards: only the ones that currently need someone. */
export function overviewActions(
  detail: CoordinatorProgramDetail,
  t: ProgramsT,
): OverviewAction[] {
  const actions: OverviewAction[] = [];
  if (detail.program.awaitingMatchCount > 0) {
    const oldest = detail.awaitingTeams[0];
    actions.push({
      key: "awaiting",
      title: t("actions.awaitingTitle", {
        count: detail.program.awaitingMatchCount,
      }),
      detail: oldest
        ? t("actions.awaitingDetail", {
            days: oldest.waitingDays,
            name: oldest.name,
          })
        : t("actions.awaitingNone"),
      tone: "orange",
      target: {
        label: t("actions.matching"),
        href: `/coordinator/programs/${encodeURIComponent(detail.program.id)}/matching`,
      },
    });
  }
  if (detail.mentors.pending > 0) {
    actions.push({
      key: "pending-mentors",
      title: t("actions.pendingTitle", { count: detail.mentors.pending }),
      detail: t("actions.pendingDetail"),
      tone: "blue",
      target: {
        label: t("actions.mentorPool"),
        href: `/coordinator/programs/${encodeURIComponent(detail.program.id)}/mentors`,
      },
    });
  }
  if (detail.missingNoteMeetings > 0) {
    actions.push({
      key: "missing-notes",
      title: t("actions.notesTitle", { count: detail.missingNoteMeetings }),
      detail: t("actions.notesDetail"),
      tone: "both",
      target: {
        label: t("actions.mentorships"),
        href: "/coordinator/mentorships",
      },
    });
  }
  return actions;
}

/** "17" and "EYL" for the date tiles of Yaklaşan tarihler. */
export function dateTile(value: string, locale: string) {
  const date = new Date(value);
  return {
    day: String(date.getDate()),
    month: new Intl.DateTimeFormat(locale, { month: "short" })
      .format(date)
      .replace(".", "")
      .toLocaleUpperCase(locale),
  };
}

export const RULE_LIMITS = {
  meetingFrequencyDays: { min: 1, max: 90 },
  staleAfterDays: { min: 1, max: 180 },
  communicationGapDays: { min: 1, max: 180 },
  bottleneckFlagDays: { min: 1, max: 365 },
  defaultMentorCapacity: { min: 1, max: 20 },
} as const;

export function stepDays(
  value: number,
  delta: number,
  limits: { min: number; max: number },
) {
  return Math.min(limits.max, Math.max(limits.min, value + delta));
}

export type PhaseDraft = ProgramPhaseInput & { key: string };

export type ProgramSettingsDraft = UpdateProgramDetailsInput &
  ProgramRules & {
    phases: PhaseDraft[];
  };

let phaseKeySeed = 0;
function phaseKey() {
  phaseKeySeed += 1;
  return `new-phase-${phaseKeySeed}`;
}

export function settingsDraftOf(
  detail: CoordinatorProgramDetail,
): ProgramSettingsDraft {
  const program = detail.program;
  return {
    name: program.name,
    description: program.description,
    startDate: program.startDate,
    endDate: program.endDate,
    ...detail.rules,
    phases: program.phases.map((phase) => ({
      key: phase.id,
      name: phase.name,
      startDate: phase.startDate,
      endDate: phase.endDate,
    })),
  };
}

export function emptyPhase(): PhaseDraft {
  return { key: phaseKey(), name: "", startDate: null, endDate: null };
}

export function movePhase(phases: PhaseDraft[], index: number, step: -1 | 1) {
  const target = index + step;
  if (target < 0 || target >= phases.length) return phases;
  const next = [...phases];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export const MAX_PHASES = 12;

/** The first problem with the draft, or null when it can be saved. */
export function settingsDraftError(draft: ProgramSettingsDraft) {
  if (!draft.name.trim()) return clientText("programSettings.nameRequired");
  if (draft.startDate && draft.endDate && draft.endDate < draft.startDate) {
    return clientText("programSettings.endBeforeStart");
  }
  if (draft.phases.length > MAX_PHASES) {
    return clientText("programSettings.tooManyPhases", { max: MAX_PHASES });
  }
  for (const phase of draft.phases) {
    if (!phase.name.trim()) return clientText("programSettings.phaseName");
    if (phase.startDate && phase.endDate && phase.endDate < phase.startDate) {
      return clientText("programSettings.phaseDates", {
        name: phase.name.trim(),
      });
    }
  }
  return null;
}

export function detailsInput(
  draft: ProgramSettingsDraft,
): UpdateProgramDetailsInput {
  return {
    name: draft.name.trim(),
    description: draft.description?.trim() || null,
    startDate: draft.startDate || null,
    endDate: draft.endDate || null,
    meetingFrequencyDays: draft.meetingFrequencyDays,
    staleAfterDays: draft.staleAfterDays,
    meetingNoteRequired: draft.meetingNoteRequired,
    autoMatchSuggestions: draft.autoMatchSuggestions,
    defaultMentorCapacity: draft.defaultMentorCapacity,
    communicationGapDays: draft.communicationGapDays,
    bottleneckFlagDays: draft.bottleneckFlagDays,
  };
}

export function phasesInput(
  value: ProgramSettingsDraft | PhaseDraft[],
): ProgramPhaseInput[] {
  const draft = Array.isArray(value) ? { phases: value } : value;
  return draft.phases.map((phase) => ({
    name: phase.name.trim(),
    startDate: phase.startDate || null,
    endDate: phase.endDate || null,
    ...(Array.isArray(value) || "expectedOutput" in phase
      ? { expectedOutput: phase.expectedOutput?.trim() || null }
      : {}),
  }));
}

/** Phases are replaced as a whole, so they are only sent when something about them changed. */
export function phasesChanged(
  draft: ProgramSettingsDraft,
  detail: CoordinatorProgramDetail,
) {
  const saved = detail.program.phases.map((phase) => ({
    name: phase.name,
    startDate: phase.startDate,
    endDate: phase.endDate,
  }));
  return JSON.stringify(phasesInput(draft)) !== JSON.stringify(saved);
}
