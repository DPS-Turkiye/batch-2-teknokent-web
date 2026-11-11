import { z } from "zod";

import { stringOrNullSchema } from "@/lib/server/request-body";

/** Each line is trimmed and blank ones are dropped. */
const linesSchema = z
  .array(z.string())
  .transform((lines) =>
    lines.map((line) => line.trim()).filter((line) => line !== ""),
  );

const weekSchema = z.object({
  week: z.number(),
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

export const weekPlanSchema = z.object({ weeks: z.array(weekSchema) });

export const weeklyProgramReadSchema = z.object({ documentId: z.string() });

/** The backend checks the week ranges against the program's length and against each other. */
export const weeklyProgramSaveSchema = z.object({
  documentId: z.string(),
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
