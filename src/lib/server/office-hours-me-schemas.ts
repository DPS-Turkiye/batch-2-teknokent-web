import { z } from "zod";

import {
  MAX_PROPOSED_TIMES,
  OfficeHoursRequestAction,
} from "@/interfaces/academician-office-hours";
import { Weekday } from "@/interfaces/mentor";
import { stringOrNullSchema } from "@/lib/server/request-body";

/** An ISO time with its offset, as the screens send it ("2026-11-24T14:00:00+03:00" or "…Z"). */
const isoTimeSchema = z.iso.datetime({ offset: true });

/** The availability editor's payload (the mentor shape); the route renames menteeCapacity for the backend. */
export const officeHoursAvailabilitySchema = z.object({
  rules: z
    .array(
      z.object({
        dayOfWeek: z.enum(Weekday),
        startTime: z.string(),
        endTime: z.string(),
        slotMinutes: z.number().int(),
      }),
    )
    .max(21),
  exceptions: z
    .array(
      z.object({
        startsOn: z.iso.date(),
        endsOn: z.iso.date(),
        reason: stringOrNullSchema,
      }),
    )
    .max(30),
  menteeCapacity: z.number().int().nullable(),
  defaultMeetingDurationMinutes: z.number().int(),
  meetingBufferMinutes: z.number().int(),
});

export const officeHoursProfileSchema = z.object({
  listed: z.boolean(),
  defaultPlace: stringOrNullSchema,
  onlineLink: stringOrNullSchema,
  contactEmail: stringOrNullSchema,
});

/** One of the academician's answers; the backend checks which fields each answer needs. */
export const officeHoursAnswerSchema = z.object({
  action: z.enum(OfficeHoursRequestAction),
  time: isoTimeSchema.optional(),
  times: z.array(isoTimeSchema).max(MAX_PROPOSED_TIMES).optional(),
  message: stringOrNullSchema.optional(),
});

export const officeHoursRequestSchema = z.object({
  academicianId: z.string().min(1),
  startsAt: isoTimeSchema,
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).nullable().default(null),
});

export const officeHoursAlternativeSchema = z.object({
  accept: z.boolean(),
  time: isoTimeSchema.optional(),
});
