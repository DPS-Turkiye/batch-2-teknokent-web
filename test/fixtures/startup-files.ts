import {
  DocumentKind,
  type StartupDocument,
} from "@/interfaces/startup-document";

export function documentFixture(
  id: string,
  overrides: Partial<StartupDocument> = {},
): StartupDocument {
  return {
    id,
    kind: DocumentKind.PitchDeck,
    originalFilename: `${id}.pdf`,
    contentType: "application/pdf",
    sizeBytes: 2_400_000,
    createdAt: "2026-09-12T12:00:00Z",
    uploadedById: "user-1",
    uploadedByName: "Gülse Buran",
    meetingId: null,
    meetingAgenda: null,
    meetingScheduledAt: null,
    shares: [],
    ...overrides,
  };
}
