/**
 * A week of a program's plan as the coordinator saved it (or the AI proposed it). Dates come from the program's
 * start and end; they are null while the program has no start date. `inferred` marks a week the AI spread out
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
};

export type ProgramWeekPlan = {
  totalWeeks: number | null;
  weeks: ProgramPlanWeek[];
};

export type ProgramPlanWeekInput = Omit<
  ProgramPlanWeek,
  "startDate" | "endDate"
>;

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
};
