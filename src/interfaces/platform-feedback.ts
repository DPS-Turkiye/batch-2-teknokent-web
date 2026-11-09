import type { PageResponse } from "@/interfaces/page-response";
import type { ProgramType } from "@/interfaces/program";
import type { UserRole } from "@/interfaces/session";
import type { Locale } from "@/lib/i18n";

export enum PlatformFeedbackKind {
  Feedback = "FEEDBACK",
  Suggestion = "SUGGESTION",
}

export enum FeedbackSubmitError {
  Failed = "failed",
  SessionRequired = "sessionRequired",
  RateLimited = "rateLimited",
}

export type SubmitPlatformFeedback = {
  kind: PlatformFeedbackKind;
  subject: string;
  message: string;
  language: Locale;
};

export type PlatformFeedback = SubmitPlatformFeedback & {
  id: string;
  authorName: string;
  authorEmail: string;
  authorRole: UserRole;
  createdAt: string;
  readAt: string | null;
  /** The program the author was in when they sent it; null for older feedback or no single program. */
  programId: string | null;
  programName: string | null;
  programType: ProgramType | null;
};

export type PlatformFeedbackInbox = {
  page: PageResponse<PlatformFeedback>;
  unreadCount: number;
};
