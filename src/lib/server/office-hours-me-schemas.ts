import { z } from "zod";

import {
  MAX_PROPOSED_TIMES,
  OfficeHoursRequestAction,
} from "@/interfaces/academician-office-hours";
import { Weekday } from "@/interfaces/mentor";

/** An ISO time with its offset, as the screens send it ("2026-11-24T14:00:00+03:00" or "…Z"). */
const isoTimeSchema = z.iso.datetime({ offset: true });

/** A clock time of a weekly range ("09:30", or "09:30:00" as the backend writes it back). */
const clockTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/);

/** Optional text up to the backend's column size; blank is sent as it is and cleared there. */
const optionalText = (max: number) =>
  z.string().max(max).nullable().default(null);

/** The availability editor's payload (the mentor shape); the route renames menteeCapacity for the backend. */
export const officeHoursAvailabilitySchema = z.object({
  rules: z
    .array(
      z.object({
        dayOfWeek: z.enum(Weekday),
        startTime: clockTimeSchema,
        endTime: clockTimeSchema,
        slotMinutes: z.number().int().min(15).max(480),
      }),
    )
    .max(21),
  exceptions: z
    .array(
      z.object({
        startsOn: z.iso.date(),
        endsOn: z.iso.date(),
        reason: optionalText(200),
      }),
    )
    .max(30),
  menteeCapacity: z.number().int().min(1).max(50).nullable(),
  defaultMeetingDurationMinutes: z.number().int().min(15).max(480),
  meetingBufferMinutes: z.number().int().min(0).max(240),
});

export const officeHoursProfileSchema = z.object({
  listed: z.boolean(),
  defaultPlace: optionalText(200),
  // The backend also checks the link has a real host and no user name in it.
  onlineLink: optionalText(500),
  contactEmail: z
    .union([z.email().max(320), z.literal("")])
    .nullable()
    .default(null),
});

/** One of the academician's answers; the backend checks which fields each answer needs. */
export const officeHoursAnswerSchema = z.object({
  action: z.enum(OfficeHoursRequestAction),
  time: isoTimeSchema.optional(),
  times: z.array(isoTimeSchema).max(MAX_PROPOSED_TIMES).optional(),
  message: z.string().max(2000).nullable().optional(),
});

export const officeHoursRequestSchema = z.object({
  academicianId: z.uuid(),
  startsAt: isoTimeSchema,
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).nullable().default(null),
});

export const officeHoursAlternativeSchema = z.object({
  accept: z.boolean(),
  time: isoTimeSchema.optional(),
});
