import { z } from "zod";

import { ProgramType } from "@/interfaces/program";

import { PlatformFeedbackKind } from "@/interfaces/platform-feedback";
import { Locale } from "@/lib/i18n";

export const FEEDBACK_SUBJECT_LIMIT = 120;
export const FEEDBACK_MESSAGE_LIMIT = 2000;

export const platformFeedbackSubmissionSchema = z.object({
  kind: z.enum(PlatformFeedbackKind),
  subject: z.string().trim().min(1).max(FEEDBACK_SUBJECT_LIMIT),
  message: z.string().trim().min(1).max(FEEDBACK_MESSAGE_LIMIT),
  language: z.enum(Locale),
});

export const feedbackInboxQuerySchema = z.object({
  page: z.coerce.number().int().min(0).max(10000).default(0),
  unreadOnly: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  programType: z.enum(ProgramType).optional(),
});
