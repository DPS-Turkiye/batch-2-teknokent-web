import type {
  ProgramPlanWeek,
  ProgramPlanWeekInput,
  ProgramThisWeek,
} from "@/interfaces/program-week";
import { newRowKey } from "@/lib/keyed-list";
import { calendarDay, formatDayMonth } from "@/lib/utils";

/** What the "Bu hafta" card shows. */
export enum ProgramWeekCardState {
  NotStarted = "NOT_STARTED",
  Ended = "ENDED",
  Empty = "EMPTY",
  Ready = "READY",
}

export const MAX_WEEK_LINES = 8;
export const MAX_PLAN_WEEKS = 104;

export function programWeekCardState(week: ProgramThisWeek) {
  if (week.notStarted) return ProgramWeekCardState.NotStarted;
  if (week.ended) return ProgramWeekCardState.Ended;
  if (!week.plan && week.phases.length === 0) return ProgramWeekCardState.Empty;
  return ProgramWeekCardState.Ready;
}

/** The phase running today, else the first one that falls in the week. */
export function weekPhase(week: ProgramThisWeek) {
  return week.phases.find((phase) => phase.current) ?? week.phases[0] ?? null;
}

/** "12 Eki – 18 Eki"; null without both days. */
export function dayRangeLabel(
  start: string | null,
  end: string | null,
  locale = "tr",
) {
  if (!start || !end) return null;
  return `${formatDayMonth(calendarDay(start), locale)} – ${formatDayMonth(calendarDay(end), locale)}`;
}

function addDays(day: string, days: number) {
  const date = calendarDay(day);
  date.setDate(date.getDate() + days);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Program week `week`'s days, as the backend counts them (ProgramCalendar): seven days from the program start,
 * the last week cut at the end. Null without a start date.
 */
export function programWeekDays(
  programStart: string | null,
  programEnd: string | null,
  week: number,
) {
  if (!programStart) return null;
  const start = addDays(programStart, 7 * (week - 1));
  const last = addDays(start, 6);
  return { start, end: programEnd && programEnd < last ? programEnd : last };
}

/** Whole weeks from start to end, a partial last week counted; null without both dates. */
export function programTotalWeeks(
  programStart: string | null,
  programEnd: string | null,
) {
  if (!programStart || !programEnd) return null;
  const days =
    Math.round(
      (calendarDay(programEnd).getTime() -
        calendarDay(programStart).getTime()) /
        86_400_000,
    ) + 1;
  return Math.max(1, Math.ceil(days / 7));
}

/** A week under edit: list fields are typed one item per line. */
export type WeekDraft = {
  /** React's key for the row (see keyed-list); never sent. */
  key: string;
  week: number;
  title: string;
  topics: string;
  activities: string;
  deliverables: string;
  inferred: boolean;
};

export function weekDraftOf(week: ProgramPlanWeek): WeekDraft {
  return {
    key: newRowKey(),
    week: week.week,
    title: week.title,
    topics: week.topics.join("\n"),
    activities: week.activities.join("\n"),
    deliverables: week.deliverables.join("\n"),
    inferred: week.inferred,
  };
}

function linesOf(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, MAX_WEEK_LINES);
}

export function weekInputOf(draft: WeekDraft): ProgramPlanWeekInput {
  return {
    week: draft.week,
    title: draft.title.trim(),
    topics: linesOf(draft.topics),
    activities: linesOf(draft.activities),
    deliverables: linesOf(draft.deliverables),
    inferred: draft.inferred,
  };
}

/** The first week number not in the plan yet, within the program; null when every week is planned. */
export function nextFreeWeek(drafts: WeekDraft[], totalWeeks: number | null) {
  const taken = new Set(drafts.map((draft) => draft.week));
  const limit = totalWeeks ?? MAX_PLAN_WEEKS;
  for (let week = 1; week <= limit; week += 1) {
    if (!taken.has(week)) return week;
  }
  return null;
}

export enum WeekPlanProblem {
  MissingTitle = "MISSING_TITLE",
  RepeatedWeek = "REPEATED_WEEK",
  PastTheEnd = "PAST_THE_END",
}

/** Why the plan can't be saved yet, or null. */
export function weekPlanProblem(
  drafts: WeekDraft[],
  totalWeeks: number | null,
) {
  if (drafts.some((draft) => !draft.title.trim())) {
    return WeekPlanProblem.MissingTitle;
  }
  if (new Set(drafts.map((draft) => draft.week)).size !== drafts.length) {
    return WeekPlanProblem.RepeatedWeek;
  }
  if (
    drafts.some(
      (draft) =>
        draft.week < 1 ||
        draft.week > (totalWeeks ?? MAX_PLAN_WEEKS) ||
        !Number.isInteger(draft.week),
    )
  ) {
    return WeekPlanProblem.PastTheEnd;
  }
  return null;
}
