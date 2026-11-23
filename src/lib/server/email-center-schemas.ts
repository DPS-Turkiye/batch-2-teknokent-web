import { z } from "zod";

import { EmailAudience } from "@/interfaces/email-center";
import { EMAIL_SUBJECT_MAX } from "@/lib/email-center";

const BODY_MAX = 20_000;
const MAX_UNTICKED = 5_000;

export const emailDraftSchema = z.object({
  programId: z.uuid(),
  audience: z.enum(EmailAudience),
  subject: z
    .string()
    .trim()
    .min(1)
    .max(EMAIL_SUBJECT_MAX)
    .regex(/^[^\r\n]*$/),
  bodyHtml: z.string().min(1).max(BODY_MAX),
});

export const emailConfirmationSchema = z.object({
  reviewDigest: z.string().min(1).max(64),
  untickedIds: z.array(z.uuid()).max(MAX_UNTICKED),
  expectedCount: z.int().positive(),
});

/** The random token of an unsubscribe link, as the backend makes it. */
export const unsubscribeTokenSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{20,100}$/);
