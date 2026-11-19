import type {
  MentorLabel,
  MentorLabelAssignment,
} from "@/interfaces/mentor-label";
import {
  MENTOR_LABEL_NAME_MAX_LENGTH,
  MENTOR_LABELS_PER_MENTOR,
} from "@/lib/const/mentor-labels";

export enum MentorLabelNameProblem {
  Required = "nameRequired",
  TooLong = "nameTooLong",
  Taken = "nameTaken",
}

// Like the backend: invisible characters other than ASCII whitespace go first, then every run of spaces becomes one.
const INVISIBLE = /(?![\t\n\v\f\r])[\p{Cf}\p{Cc}]/gu;
const SPACES = /[\p{Z}\s]+/gu;

/**
 * The name the backend saves: without invisible characters (zero-width spaces, direction marks), trimmed, and with
 * inner runs of any kind of space made one.
 */
export function normalizeMentorLabelName(raw: string) {
  return raw.replace(INVISIBLE, "").replace(SPACES, " ").trim();
}

/** Length as a person counts it: an emoji or a letter with its accent is one. */
export function mentorLabelNameLength(name: string) {
  return Array.from(name).length;
}

/**
 * The first problem with a label name, or null. Names compare without case, like the backend does
 * (`toLowerCase(Locale.ROOT)`), so the check here never passes a name the backend would refuse as taken.
 */
export function mentorLabelNameProblem(
  raw: string,
  labels: readonly MentorLabel[],
  exceptId: string | null = null,
): MentorLabelNameProblem | null {
  const name = normalizeMentorLabelName(raw);
  if (!name) return MentorLabelNameProblem.Required;
  if (mentorLabelNameLength(name) > MENTOR_LABEL_NAME_MAX_LENGTH) {
    return MentorLabelNameProblem.TooLong;
  }
  const key = name.toLowerCase();
  const taken = labels.some(
    (label) => label.id !== exceptId && label.name.toLowerCase() === key,
  );
  return taken ? MentorLabelNameProblem.Taken : null;
}

/** The ids of the labels one mentor carries. */
export function mentorLabelIds(
  assignments: readonly MentorLabelAssignment[],
  mentorId: string,
): string[] {
  return (
    assignments.find((assignment) => assignment.mentorId === mentorId)
      ?.labelIds ?? []
  );
}

/** The labels one mentor carries, in the program list's order. */
export function labelsOfMentor(
  labels: readonly MentorLabel[],
  assignments: readonly MentorLabelAssignment[],
  mentorId: string,
): MentorLabel[] {
  const ids = new Set(mentorLabelIds(assignments, mentorId));
  return labels.filter((label) => ids.has(label.id));
}

/** The labels at least one mentor carries: the only ones worth filtering by. */
export function carriedLabels<T extends MentorLabel>(
  labels: readonly T[],
  assignments: readonly MentorLabelAssignment[],
): T[] {
  const carried = new Set(assignments.flatMap((row) => row.labelIds));
  return labels.filter((label) => carried.has(label.id));
}

/** Keeps the items whose mentor carries every selected label; no selection keeps them all. */
export function withAllLabels<T>(
  items: readonly T[],
  mentorIdOf: (item: T) => string | null,
  assignments: readonly MentorLabelAssignment[],
  selected: readonly string[],
): T[] {
  if (selected.length === 0) return [...items];
  return items.filter((item) => {
    const mentorId = mentorIdOf(item);
    if (!mentorId) return false;
    const carried = new Set(mentorLabelIds(assignments, mentorId));
    return selected.every((id) => carried.has(id));
  });
}

/** Adds or removes one label from a selection; a mentor's selection stops at the per-mentor limit. */
export function toggleMentorLabel(
  selected: readonly string[],
  labelId: string,
  limit: number = MENTOR_LABELS_PER_MENTOR,
): string[] {
  if (selected.includes(labelId)) {
    return selected.filter((id) => id !== labelId);
  }
  return selected.length >= limit ? [...selected] : [...selected, labelId];
}

/** Drops ids that no longer name a label (one deleted while a filter or a draft still held it). */
export function knownLabelIds(
  ids: readonly string[],
  labels: readonly MentorLabel[],
): string[] {
  const known = new Set(labels.map((label) => label.id));
  return ids.filter((id) => known.has(id));
}
