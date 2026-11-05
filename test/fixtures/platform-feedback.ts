import {
  PlatformFeedbackKind,
  type PlatformFeedback,
  type PlatformFeedbackInbox,
} from "@/interfaces/platform-feedback";
import { UserRole } from "@/interfaces/session";
import { Locale } from "@/lib/i18n";

export function platformFeedback(
  overrides: Partial<PlatformFeedback> = {},
): PlatformFeedback {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    kind: PlatformFeedbackKind.Suggestion,
    subject: "Calendar shortcut",
    message: "Please add a shortcut to the calendar.",
    language: Locale.En,
    authorName: "Example User",
    authorEmail: "user@example.com",
    authorRole: UserRole.Mentee,
    createdAt: "2026-11-05T10:00:00Z",
    readAt: null,
    ...overrides,
  };
}

export function feedbackInbox(
  overrides: Partial<PlatformFeedbackInbox> = {},
): PlatformFeedbackInbox {
  return {
    page: {
      content: [platformFeedback()],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
    },
    unreadCount: 1,
    ...overrides,
  };
}
