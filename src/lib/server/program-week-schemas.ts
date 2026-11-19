import { z } from "zod";

import { WeekVisibility } from "@/interfaces/program-week";
import { MAX_PLAN_WEEKS } from "@/lib/program-week";
import {
  invalidRequest,
  stringOrNullSchema,
  type JsonBody,
} from "@/lib/server/request-body";

/** Each line is trimmed and blank ones are dropped. */
const linesSchema = z
  .array(z.string())
  .transform((lines) =>
    lines.map((line) => line.trim()).filter((line) => line !== ""),
  );

// The backend's LocalTime: "18:00", or "18:00:00" as it sends them back.
const timeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/)
  .nullable();

const sessionSchema = z.object({
  date: z.iso.date(),
  startTime: timeSchema,
  endTime: timeSchema,
  place: z.string().nullable(),
  title: z.string().nullable(),
});
const specialDaySchema = sessionSchema.extend({
  title: z.string().trim().min(1),
  details: linesSchema,
});
// Dates, sessions and special days are required: a body from a page that predates them would otherwise drop the
// syllabus's dates on save.
const weekSchema = z.object({
  startDate: z.iso.date().nullable(),
  endDate: z.iso.date().nullable(),
  // The backend's caps (ReplaceProgramWeeksRequest): 12 sessions a week, 20 special days a plan.
  sessions: z.array(sessionSchema).max(12),
  week: z.number().int(),
  title: z.string(),
  topics: linesSchema,
  activities: linesSchema,
  deliverables: linesSchema,
  // Round-tripped from the GET; an AI week without the flag was saved as not inferred before.
  inferred: z
    .boolean()
    .nullish()
    .transform((inferred) => inferred ?? false),
});

export const weekPlanSchema = z.object({
  weeks: z.array(weekSchema),
  specialDays: z.array(specialDaySchema).max(20),
});

export const weeklyProgramReadSchema = z.object({ documentId: z.string() });

/** The backend checks the week ranges against the program's length and against each other. */
export const weeklyProgramSaveSchema = z.object({
  documentId: z.string(),
  specialDays: z.array(specialDaySchema).max(20),
  // An empty plan would only wipe the saved one.
  weeks: z.array(weekSchema).min(1),
  phases: z.array(
    z.object({
      name: z.string(),
      expectedOutput: stringOrNullSchema,
      firstWeek: z.number().int(),
      lastWeek: z.number().int(),
    }),
  ),
  seenPhaseCount: z.number().int().min(0),
  seenWeekCount: z.number().int().min(0),
  keepPast: z.boolean(),
});

export const weekVisibilitySchema = z.object({
  visibility: z.enum(WeekVisibility),
});

// Digits only, within the backend's 1–104 weeks: Number() would also take "1e2", "0x10" or " 5 ".
const planWeekSchema = z
  .string()
  .regex(/^[1-9]\d{0,2}$/)
  .transform(Number)
  .pipe(z.number().int().min(1).max(MAX_PLAN_WEEKS));

/** A route's `[week]` segment as a week number, or a 400 before the backend is called. */
export async function readPlanWeek(week: string): Promise<JsonBody<number>> {
  const parsed = planWeekSchema.safeParse(week);
  return parsed.success
    ? { ok: true, data: parsed.data }
    : { ok: false, response: await invalidRequest("invalidRequestFields") };
}
