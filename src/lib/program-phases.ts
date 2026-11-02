import { clientText } from "@/i18n/client-texts";
import type { ProposedPhase } from "@/interfaces/coordinator-program";
import {
  emptyPhase,
  MAX_PHASES,
  type PhaseDraft,
} from "@/lib/coordinator-program-detail";
import { parseDay } from "@/lib/coordinator-programs";
import { formatDayMonth } from "@/lib/utils";

/** Where the wizard's phases come from: read from the syllabus, or typed in. */
export enum PhaseSource {
  File = "FILE",
  Manual = "MANUAL",
}

/** A phase row in the wizard; `fromFile` keeps the "Dosyadan" chip after edits. */
export type WizardPhase = PhaseDraft & { fromFile: boolean };

export const SYLLABUS_MAX_BYTES = 10 * 1024 * 1024;
const OUTPUT_SEPARATOR = " · ";
const MAX_OUTPUT_LENGTH = 200;
const DAY_MS = 24 * 60 * 60 * 1000;

export function blankWizardPhase(): WizardPhase {
  return { ...emptyPhase(), fromFile: false };
}

export function proposedPhases(proposals: ProposedPhase[]): WizardPhase[] {
  return proposals.slice(0, MAX_PHASES).map((proposal) => ({
    ...emptyPhase(),
    ...proposal,
    fromFile: true,
  }));
}

export function missingDate(phase: PhaseDraft) {
  return !phase.startDate || !phase.endDate;
}

/** "3 Kas – 30 Kas"; null when the phase has no dates. */
export function phaseDateRange(phase: PhaseDraft, locale: string) {
  const day = (value: string) => formatDayMonth(parseDay(value), locale);
  if (phase.startDate && phase.endDate) {
    return `${day(phase.startDate)} – ${day(phase.endDate)}`;
  }
  const only = phase.startDate ?? phase.endDate;
  return only ? day(only) : null;
}

/** "Pilot müşteri · Fiyatlandırma hipotezi" is edited as two chips. */
export function outputTokens(value: string | null) {
  return (value ?? "")
    .split(OUTPUT_SEPARATOR)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function joinOutputs(tokens: string[]) {
  const joined = tokens.join(OUTPUT_SEPARATOR).slice(0, MAX_OUTPUT_LENGTH);
  return joined || null;
}

/** Moves the row at `from` to `to`, as a drag-and-drop does. */
export function reorderPhases<T>(phases: T[], from: number, to: number) {
  if (from === to || to < 0 || to >= phases.length) return phases;
  const next = [...phases];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** The first reason the phases cannot be confirmed yet, or null. */
export function curriculumError(phases: WizardPhase[]) {
  if (phases.length > MAX_PHASES) {
    return clientText("programSettings.tooManyPhases", { max: MAX_PHASES });
  }
  for (const [index, phase] of phases.entries()) {
    const name = phase.name.trim();
    if (!name) {
      return clientText("programLaunch.phaseNameRequired", { n: index + 1 });
    }
    if (phase.fromFile && missingDate(phase)) {
      return clientText("programLaunch.phaseDateMissing", { name });
    }
    if (phase.startDate && phase.endDate && phase.endDate < phase.startDate) {
      return clientText("programSettings.phaseDates", { name });
    }
  }
  return null;
}

function daysBetween(start: string, end: string) {
  return Math.round((Date.parse(end) - Date.parse(start)) / DAY_MS) + 1;
}

/** Whole months the program runs, for "5 faz · 11 ay"; null without both dates. */
export function monthSpan(start: string | null, end: string | null) {
  if (!start || !end || end < start) return null;
  return Math.max(1, Math.round(daysBetween(start, end) / 30.44));
}

export type TimelineSegment = {
  key: string;
  name: string;
  weight: number;
  missing: boolean;
};

/**
 * One bar segment per phase, as wide as the phase is long. A phase without dates gets the
 * typical width of the others and is drawn dashed until its dates are filled in.
 */
export function timelineSegments(phases: PhaseDraft[]): TimelineSegment[] {
  const known = phases
    .filter((phase) => !missingDate(phase))
    .map((phase) => daysBetween(phase.startDate!, phase.endDate!))
    .filter((days) => days > 0);
  const typical = known.length
    ? known.reduce((sum, days) => sum + days, 0) / known.length
    : 30;
  return phases.map((phase) => {
    const missing = missingDate(phase);
    const days = missing ? 0 : daysBetween(phase.startDate!, phase.endDate!);
    return {
      key: phase.key,
      name: phase.name.trim(),
      weight: Math.max(1, Math.round(days > 0 ? days : typical)),
      missing,
    };
  });
}
