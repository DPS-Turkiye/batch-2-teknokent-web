import "server-only";
import { z } from "zod";

import {
  PeerActionOwner,
  PeerActivityType,
  PeerMeetingFormat,
  PeerMeetingTopic,
  PeerMeetingType,
  PeerMentorSkill,
} from "@/interfaces/peer-reports";

/** Free text up to the backend's limit; left out means empty. */
const optionalText = (max: number) =>
  z.string().max(max).nullable().default(null);

const TEXT = 4000;

/** A meeting report draft; every answer may still be empty, the backend checks the required ones on send. */
export const peerMeetingReportSchema = z.object({
  meetingType: z.enum(PeerMeetingType).nullable().default(null),
  meetingFormat: z.enum(PeerMeetingFormat).nullable().default(null),
  actualDurationMinutes: z
    .number()
    .int()
    .min(1)
    .max(600)
    .nullable()
    .default(null),
  topics: z.array(z.enum(PeerMeetingTopic)).max(8).default([]),
  menteeNeed: optionalText(TEXT),
  discussion: optionalText(TEXT),
  approach: optionalText(TEXT),
  skills: z.array(z.enum(PeerMentorSkill)).max(10).default([]),
  skillExample: optionalText(TEXT),
  outcome: optionalText(TEXT),
  actions: z
    .array(
      z.object({
        id: z.uuid().nullable().default(null),
        text: z.string().trim().min(1).max(500),
        owner: z.enum(PeerActionOwner),
        dueDate: z.iso.date().nullable().default(null),
        done: z.boolean().default(false),
      }),
    )
    .max(20)
    .default([]),
  followUpNeeded: z.boolean().default(false),
  followUpAt: z.iso.datetime({ offset: true }).nullable().default(null),
  productivity: z.number().int().min(1).max(5).nullable().default(null),
  nextTime: optionalText(TEXT),
  coordinatorSupportNeeded: z.boolean().nullable().default(null),
});

export const peerReportActionSchema = z.object({ done: z.boolean() });

export const peerDailyReportSchema = z.object({
  didToday: optionalText(TEXT),
  challenge: optionalText(TEXT),
  skills: z.array(z.enum(PeerMentorSkill)).max(10).default([]),
  learned: optionalText(TEXT),
  tomorrowPlan: optionalText(TEXT),
});

export const peerActivitySchema = z.object({
  activityDate: z.iso.date(),
  type: z.enum(PeerActivityType),
  title: z.string().trim().min(1).max(200),
  durationMinutes: z.number().int().min(1).max(720),
  menteeId: z.uuid().nullable().default(null),
  description: optionalText(2000),
});

export const peerWeeklyReportSchema = z.object({
  needsObserved: optionalText(TEXT),
  growth: optionalText(TEXT),
  nextWeekPlan: optionalText(TEXT),
});

export const peerReportRangeQuerySchema = z.object({
  from: z.iso.date(),
  to: z.iso.date(),
});

export const peerReportWeekQuerySchema = z.object({ week: z.iso.date() });
