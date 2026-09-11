import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import type { MeetingDetails } from "@/hooks/use-startup-meetings";
import {
  DocumentKind,
  type StartupDocument,
} from "@/interfaces/startup-document";

export function meetingFixture(
  id: string,
  scheduledAt: string,
  overrides: Partial<MeetingItem> = {},
): MeetingItem {
  return {
    id,
    organizationId: "org-1",
    mentorId: "mentor-1",
    mentorName: "Nihan Öztürk",
    mentorshipRequestId: "req-mvp",
    scheduledAt,
    durationMinutes: 45,
    agenda: "MVP Scope & User Flow",
    status: MeetingStatus.Scheduled,
    ...overrides,
  };
}

export function meetingFileFixture(
  id: string,
  meetingId: string,
): StartupDocument {
  return {
    id,
    kind: DocumentKind.MeetingFile,
    originalFilename: `${id}.pdf`,
    contentType: "application/pdf",
    sizeBytes: 1024,
    createdAt: "2026-08-18T12:00:00Z",
    uploadedById: "user-1",
    uploadedByName: "Gülse Buran",
    meetingId,
    meetingAgenda: "MVP Scope & User Flow",
    meetingScheduledAt: "2026-08-18T09:00:00Z",
    shares: [],
  };
}

export function detailsFixture(
  overrides: Partial<MeetingDetails> = {},
): () => MeetingDetails {
  return () => ({
    mentorTitle: "UX/UI Mentor",
    summary: "MVP kapsamını daraltmak ve kullanıcı akışını netleştirmek",
    files: [],
    ...overrides,
  });
}
