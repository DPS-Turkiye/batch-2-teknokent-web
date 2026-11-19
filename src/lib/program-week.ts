import type {
  ProgramPlanWeek,
  ProgramPlanWeekInput,
  ProgramSession,
  ProgramSpecialDay,
  ProgramThisWeek,
  ProgramWeekSoFar,
  WeekVisibility,
} from "@/interfaces/program-week";
import { shortWeekday } from "@/lib/calendar";
import { newRowKey } from "@/lib/keyed-list";
import { calendarDay, formatDayMonth } from "@/lib/utils";

/** What the "Bu hafta" card shows. */
export enum ProgramWeekCardState {
  NotStarted = "NOT_STARTED",
  Ended = "ENDED",
  Empty = "EMPTY",
  /** The coordinator hid the running week: its number and dates show, its plan does not. */
  Hidden = "HIDDEN",
  Ready = "READY",
}

// Matches the backend's cap: a week read from one row per session can carry up to twelve lines.
export const MAX_WEEK_LINES = 12;
export const MAX_PLAN_WEEKS = 104;

export function programWeekCardState(week: ProgramThisWeek) {
  if (week.notStarted) return ProgramWeekCardState.NotStarted;
  if (week.ended) return ProgramWeekCardState.Ended;
  if (week.planHidden) return ProgramWeekCardState.Hidden;
  if (!week.plan && week.phases.length === 0 && week.specialDays.length === 0)
    return ProgramWeekCardState.Empty;
  return ProgramWeekCardState.Ready;
}

/** The phase running today, else the first one that falls in the week. */
export function weekPhase(week: ProgramThisWeek) {
  return week.phases.find((phase) => phase.current) ?? week.phases[0] ?? null;
}

/** "Geçmiş haftalar": the weeks reached so far without the running one ("Bu hafta" shows it), newest first. */
export function pastWeeks(weeks: readonly ProgramWeekSoFar[]) {
  return weeks
    .filter((week) => !week.current && !week.upcoming)
    .toSorted((left, right) => right.plan.week - left.plan.week);
}

/** "Yaklaşan haftalar": the weeks the coordinator opened before they begin, soonest first. */
export function upcomingWeeks(weeks: readonly ProgramWeekSoFar[]) {
  return weeks
    .filter((week) => week.upcoming)
    .toSorted((left, right) => left.plan.week - right.plan.week);
}

/**
 * Each saved week's visibility by week number. Only the coordinator's saved plan carries one; a week without it (not
 * saved yet) is left out, so it cannot be set.
 */
export function savedVisibilities(weeks: readonly ProgramPlanWeek[]) {
  const visibilities = new Map<number, WeekVisibility>();
  for (const week of weeks) {
    if (week.menteeVisibility)
      visibilities.set(week.week, week.menteeVisibility);
  }
  return visibilities;
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
  /** The week's own dates; null follows the program calendar. */
  startDate: string | null;
  endDate: string | null;
  /** Read from the syllabus and kept as they are; the editor shows them. */
  sessions: ProgramSession[];
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
    // A computed week sends no dates, so it keeps following the program calendar.
    startDate: week.datesFromSource ? week.startDate : null,
    endDate: week.datesFromSource ? week.endDate : null,
    sessions: week.sessions,
  };
}

/**
 * A saved week as an editor row, keyed by its number (unique in a saved plan) rather than a fresh key, so a new answer
 * for the same plan keeps each row's DOM and focus.
 */
export function savedWeekDraftOf(week: ProgramPlanWeek): WeekDraft {
  return { ...weekDraftOf(week), key: `saved-week-${week.week}` };
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
    startDate: draft.startDate,
    endDate: draft.endDate,
    sessions: draft.sessions,
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
  InvalidDates = "INVALID_DATES",
  RepeatedWeek = "REPEATED_WEEK",
  PastTheEnd = "PAST_THE_END",
}

/** Why the plan can't be saved yet, or null. */
export function weekPlanProblem(
  drafts: WeekDraft[],
  totalWeeks: number | null,
) {
  if (
    drafts.some(
      (draft) =>
        Boolean(draft.startDate) !== Boolean(draft.endDate) ||
        (draft.startDate && draft.endDate && draft.endDate < draft.startDate),
    )
  ) {
    return WeekPlanProblem.InvalidDates;
  }
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
        draft.week >
          (draft.startDate ? MAX_PLAN_WEEKS : (totalWeeks ?? MAX_PLAN_WEEKS)) ||
        !Number.isInteger(draft.week),
    )
  ) {
    return WeekPlanProblem.PastTheEnd;
  }
  return null;
}

/** A week's days: its own dates when it has both, else the program calendar's. */
export function weekDaysOf(
  drafts: readonly WeekDraft[],
  week: number,
  programStart: string | null,
  programEnd: string | null,
) {
  const draft = drafts.find((row) => row.week === week);
  return draft?.startDate && draft.endDate
    ? { start: draft.startDate, end: draft.endDate }
    : programWeekDays(programStart, programEnd, week);
}

/** "18:00" from the backend's "18:00:00". */
function clockTime(time: string) {
  return time.slice(0, 5);
}

/** "Pzt 9 Kas · 18:00–20:00 · Online · Yapılandırılmış eğitim"; parts the syllabus leaves out are skipped. */
export function planDayLabel(
  day: ProgramSession | ProgramSpecialDay,
  locale = "tr",
) {
  const date = calendarDay(day.date);
  const time = day.startTime
    ? [day.startTime, day.endTime]
        .filter((part) => part !== null)
        .map(clockTime)
        .join("–")
    : null;
  return [
    `${shortWeekday(date, locale)} ${formatDayMonth(date, locale)}`,
    time,
    day.place,
    day.title,
  ]
    .filter(Boolean)
    .join(" · ");
}
