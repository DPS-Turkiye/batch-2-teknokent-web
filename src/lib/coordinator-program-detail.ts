import { clientText } from "@/i18n/client-texts";
import type {
  CoordinatorProgramDetail,
  ProgramPhaseInput,
  ProgramRules,
  UpdateProgramDetailsInput,
} from "@/interfaces/coordinator-program";
import { ProgramType } from "@/interfaces/program";
import { formatMonthRange, type ProgramsT } from "@/lib/coordinator-programs";

export enum ProgramTab {
  Overview = "OVERVIEW",
  Participants = "PARTICIPANTS",
  Teams = "TEAMS",
  MentorPool = "MENTOR_POOL",
  Students = "STUDENTS",
  PeerMentors = "PEER_MENTORS",
  Matching = "MATCHING",
  Appointments = "APPOINTMENTS",
  Approvals = "APPROVALS",
  Settings = "SETTINGS",
}

/** The sub-tabs under Katılımcılar; Girişim's two and the peer program's two have screens so far. */
export enum ParticipantTab {
  Teams = "TEAMS",
  MentorPool = "MENTOR_POOL",
  Students = "STUDENTS",
  PeerMentors = "PEER_MENTORS",
  Academics = "ACADEMICS",
}

export enum SettingsSection {
  General = "GENERAL",
  Curriculum = "CURRICULUM",
  Coordinators = "COORDINATORS",
  Rules = "RULES",
  Eligibility = "ELIGIBILITY",
  PeerCategories = "PEER_CATEGORIES",
  Archive = "ARCHIVE",
}

/** Program Ayarları' sections for a type: only peer programs choose categories. */
export function settingsSections(type: ProgramType) {
  return Object.values(SettingsSection).filter(
    (section) =>
      section !== SettingsSection.PeerCategories ||
      type === ProgramType.PeerMentoring,
  );
}

const PARTICIPANT_PAGES = [
  ProgramTab.Participants,
  ProgramTab.Teams,
  ProgramTab.MentorPool,
  ProgramTab.Students,
  ProgramTab.PeerMentors,
];

/**
 * The shared tabs, adapted to the type: Girişim keeps its screens under Katılımcılar,
 * Office Hours shows Randevular in place of Eşleşmeler and has no Onaylar.
 */
export function programTabs(
  detail: CoordinatorProgramDetail,
  programId: string,
) {
  const base = `/coordinator/programs/${encodeURIComponent(programId)}`;
  const type = detail.program.type;
  const startup = type === ProgramType.StartupMentoring;
  const peer = type === ProgramType.PeerMentoring;
  const officeHours = type === ProgramType.OfficeHours;
  return [
    { id: ProgramTab.Overview, href: base, count: null },
    {
      id: ProgramTab.Participants,
      href: startup
        ? `${base}/teams`
        : peer
          ? `${base}/students`
          : `${base}/participants`,
      count: null,
    },
    officeHours
      ? {
          id: ProgramTab.Appointments,
          href: `${base}/appointments`,
          count: null,
        }
      : {
          id: ProgramTab.Matching,
          href: `${base}/matching`,
          count: startup ? detail.program.awaitingMatchCount : null,
        },
    ...(officeHours
      ? []
      : [{ id: ProgramTab.Approvals, href: `${base}/approvals`, count: null }]),
    { id: ProgramTab.Settings, href: `${base}/settings`, count: null },
  ];
}

/** Takımlar and Mentor Havuzu light up the Katılımcılar tab. */
export function isActiveTab(item: ProgramTab, current: ProgramTab) {
  return (
    item === current ||
    (item === ProgramTab.Participants && PARTICIPANT_PAGES.includes(current))
  );
}

export function isParticipantsTab(tab: ProgramTab) {
  return PARTICIPANT_PAGES.includes(tab);
}

/** Katılımcılar's sub-tabs; the ones without a screen yet have no link. */
export function participantTabs(
  detail: CoordinatorProgramDetail,
  programId: string,
): { id: ParticipantTab; href: string | null; count: number | null }[] {
  const base = `/coordinator/programs/${encodeURIComponent(programId)}`;
  switch (detail.program.type) {
    case ProgramType.PeerMentoring:
      return [
        { id: ParticipantTab.Students, href: `${base}/students`, count: null },
        {
          id: ParticipantTab.PeerMentors,
          href: `${base}/peer-mentors`,
          count: null,
        },
      ];
    case ProgramType.OfficeHours:
      return [
        { id: ParticipantTab.Academics, href: null, count: null },
        { id: ParticipantTab.Students, href: null, count: null },
      ];
    default:
      return [
        {
          id: ParticipantTab.Teams,
          href: `${base}/teams`,
          count: detail.program.teamCount,
        },
        {
          id: ParticipantTab.MentorPool,
          href: `${base}/mentors`,
          count: detail.program.mentorCount,
        },
      ];
  }
}

/**
 * Where a tab URL that the program's type does not show should go instead, or null when the type
 * shows it. Keeps a typed or old link from opening another type's screen or a wrong empty state.
 */
export function misplacedTabHref(
  detail: CoordinatorProgramDetail,
  programId: string,
  tab: ProgramTab,
): string | null {
  const base = `/coordinator/programs/${encodeURIComponent(programId)}`;
  switch (detail.program.type) {
    case ProgramType.StartupMentoring:
      if (
        tab === ProgramTab.Participants ||
        tab === ProgramTab.Students ||
        tab === ProgramTab.PeerMentors
      )
        return `${base}/teams`;
      if (tab === ProgramTab.Appointments) return `${base}/matching`;
      return null;
    case ProgramType.OfficeHours:
      if (
        tab === ProgramTab.Teams ||
        tab === ProgramTab.MentorPool ||
        tab === ProgramTab.Students ||
        tab === ProgramTab.PeerMentors
      )
        return `${base}/participants`;
      if (tab === ProgramTab.Matching) return `${base}/appointments`;
      if (tab === ProgramTab.Approvals) return base;
      return null;
    default:
      if (
        tab === ProgramTab.Teams ||
        tab === ProgramTab.MentorPool ||
        tab === ProgramTab.Participants
      )
        return `${base}/students`;
      if (tab === ProgramTab.Appointments) return `${base}/matching`;
      return null;
  }
}

/** Girişim has screens behind its tabs; a peer program its two Katılımcılar lists; the rest an empty state. */
export function hasTabContent(type: ProgramType, tab: ProgramTab) {
  return (
    type === ProgramType.StartupMentoring ||
    tab === ProgramTab.Settings ||
    (type === ProgramType.PeerMentoring &&
      (tab === ProgramTab.Students || tab === ProgramTab.PeerMentors))
  );
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

export type ProgramSettingsDraft = UpdateProgramDetailsInput & ProgramRules;

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
  };
}

export function savedPhases(detail: CoordinatorProgramDetail): PhaseDraft[] {
  return detail.program.phases.map((phase) => ({
    key: phase.id,
    name: phase.name,
    startDate: phase.startDate,
    endDate: phase.endDate,
    expectedOutput: phase.expectedOutput ?? null,
  }));
}

export function emptyPhase(): PhaseDraft {
  return {
    key: phaseKey(),
    name: "",
    startDate: null,
    endDate: null,
    expectedOutput: null,
  };
}

export const MAX_PHASES = 12;

/** The first problem with the draft, or null when it can be saved. */
export function settingsDraftError(draft: ProgramSettingsDraft) {
  if (!draft.name.trim()) return clientText("programSettings.nameRequired");
  if (draft.startDate && draft.endDate && draft.endDate < draft.startDate) {
    return clientText("programSettings.endBeforeStart");
  }
  return null;
}

/** The first problem with one phase in the Müfredat & fazlar drawer, or null. */
export function phaseDraftError(phase: PhaseDraft) {
  if (!phase.name.trim()) return clientText("programSettings.phaseName");
  if (phase.startDate && phase.endDate && phase.endDate < phase.startDate) {
    return clientText("programSettings.phaseDates", {
      name: phase.name.trim(),
    });
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
    eligibleEmailDomain: draft.eligibleEmailDomain?.trim() ?? "",
    rosterOnly: draft.rosterOnly,
    individualMentees: draft.individualMentees,
  };
}

/** Addresses pasted into the program list: one per line, or separated by commas, semicolons or spaces. */
export function parseEmailList(text: string): string[] {
  return text
    .split(/[\s,;]+/)
    .map((email) => email.trim())
    .filter(Boolean);
}

export function phasesInput(phases: PhaseDraft[]): ProgramPhaseInput[] {
  return phases.map((phase) => ({
    name: phase.name.trim(),
    startDate: phase.startDate || null,
    endDate: phase.endDate || null,
    expectedOutput: phase.expectedOutput?.trim() || null,
  }));
}
