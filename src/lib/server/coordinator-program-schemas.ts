import "server-only";
import { z } from "zod";

import { ProgramEventKind } from "@/interfaces/coordinator-program";
import { ProgramType } from "@/interfaces/program";
import { stringOrNullSchema } from "@/lib/server/request-body";

/** A program rule left out or sent as null keeps the backend's default or the saved value. */
const optionalNumberSchema = z
  .number()
  .nullish()
  .transform((value) => value ?? undefined);

const optionalBooleanSchema = z
  .boolean()
  .nullish()
  .transform((value) => value ?? undefined);

/** One team on "Yeni Program", Takımlar's "Takım ekle", or a waiting team being fixed. */
export const teamInviteSchema = z.object({
  teamName: z.string(),
  leadEmail: z.string(),
});

export const programPhaseSchema = z.object({
  name: z.string(),
  startDate: stringOrNullSchema,
  endDate: stringOrNullSchema,
  expectedOutput: stringOrNullSchema,
});

export const createProgramSchema = z.object({
  type: z.enum(ProgramType),
  name: z.string(),
  description: stringOrNullSchema,
  startDate: stringOrNullSchema,
  endDate: stringOrNullSchema,
  coordinatorIds: z.array(z.string()),
  newCoordinators: z
    .array(z.object({ fullName: z.string(), email: z.string() }))
    .default([]),
  defaultMentorCapacity: optionalNumberSchema,
  meetingFrequencyDays: optionalNumberSchema,
  communicationGapDays: optionalNumberSchema,
  bottleneckFlagDays: optionalNumberSchema,
  teams: z.array(teamInviteSchema).optional(),
  phases: z.array(programPhaseSchema).optional(),
  syllabusDocumentId: stringOrNullSchema,
});

export const updateProgramSchema = z.object({
  name: z.string(),
  description: stringOrNullSchema,
  startDate: stringOrNullSchema,
  endDate: stringOrNullSchema,
  meetingFrequencyDays: z.number(),
  staleAfterDays: z.number(),
  meetingNoteRequired: z.boolean(),
  autoMatchSuggestions: z.boolean(),
  defaultMentorCapacity: optionalNumberSchema,
  communicationGapDays: optionalNumberSchema,
  bottleneckFlagDays: optionalNumberSchema,
  /** "" clears the domain; null or left out keeps the saved one. */
  eligibleEmailDomain: z
    .string()
    .nullish()
    .transform((value) => value ?? undefined),
  rosterOnly: optionalBooleanSchema,
  individualMentees: optionalBooleanSchema,
});

export const createProgramEventSchema = z.object({
  title: z.string(),
  kind: z.enum(ProgramEventKind),
  startsAt: z.string(),
  endsAt: stringOrNullSchema,
  description: stringOrNullSchema,
});
