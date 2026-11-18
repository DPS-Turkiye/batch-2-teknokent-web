/** A session of a week on its own day, as the syllabus prints it. Times are "HH:mm" or "HH:mm:ss". */
export type ProgramSession = {
  date: string;
  startTime: string | null;
  endTime: string | null;
  place: string | null;
  title: string | null;
};

/** A day that is an event of its own (a bootcamp, a demo day), not part of a week. */
export type ProgramSpecialDay = {
  date: string;
  startTime: string | null;
  endTime: string | null;
  place: string | null;
  title: string;
  details: string[];
};

/** The first and last day the saved plan prints, when they are not the program's start and end. */
export type ProgramDateCheck = {
  syllabusStart: string;
  syllabusEnd: string;
};

/**
 * A week of a program's plan as the coordinator saved it (or the AI proposed it). Its dates are the ones the
 * syllabus prints (`datesFromSource`), else the program calendar's; null while neither exists. `inferred` marks a week the AI spread out
 * from a longer phase instead of reading it from a week-by-week syllabus.
 */
export type ProgramPlanWeek = {
  week: number;
  startDate: string | null;
  endDate: string | null;
  title: string;
  topics: string[];
  activities: string[];
  deliverables: string[];
  inferred: boolean;
  datesFromSource: boolean;
  sessions: ProgramSession[];
};

export type ProgramWeekPlan = {
  totalWeeks: number | null;
  weeks: ProgramPlanWeek[];
  specialDays: ProgramSpecialDay[];
  dateCheck: ProgramDateCheck | null;
};

export type ProgramPlanWeekInput = Omit<
  ProgramPlanWeek,
  "startDate" | "endDate" | "datesFromSource"
> & {
  /** The week's own dates (both or neither); null follows the program calendar. */
  startDate: string | null;
  endDate: string | null;
};

/** A week of the plan the program has reached; `current` marks the one "Bu hafta" shows. */
export type ProgramWeekSoFar = {
  plan: ProgramPlanWeek;
  current: boolean;
  /** The special days dated inside the week's days. */
  specialDays: ProgramSpecialDay[];
};

/**
 * "Geçmiş haftalar" on Süreç (`GET /api/programs/mine/weeks`): the saved weeks whose first day has come, in week
 * order. A week that has not begun, and anything dated after the running week, is never sent.
 */
export type ProgramWeeksSoFar = {
  programId: string;
  programName: string;
  currentWeek: number | null;
  weeks: ProgramWeekSoFar[];
};

export type ProgramThisWeekPhase = {
  id: string;
  name: string;
  position: number;
  startDate: string | null;
  endDate: string | null;
  expectedOutput: string | null;
  /** The phase whose dates contain today. */
  current: boolean;
};

/**
 * "Bu hafta" on Süreç (`GET /api/programs/mine/this-week`). `week` is null before the start, after the end, or
 * without a start date. `hasSyllabus` is false while the coordinator has saved neither phases nor weeks.
 */
export type ProgramThisWeek = {
  programId: string;
  programName: string;
  programStart: string | null;
  programEnd: string | null;
  week: number | null;
  totalWeeks: number | null;
  weekStart: string | null;
  weekEnd: string | null;
  notStarted: boolean;
  ended: boolean;
  hasSyllabus: boolean;
  plan: ProgramPlanWeek | null;
  phases: ProgramThisWeekPhase[];
  /** Special days in the shown week, or today's. */
  specialDays: ProgramSpecialDay[];
};
