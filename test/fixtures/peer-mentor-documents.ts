import {
  PeerDocumentVisibility,
  PeerEvidenceType,
  type PeerMentorDocument,
} from "@/interfaces/peer-mentor-documents";

export function peerFileFixture(
  overrides: Partial<PeerMentorDocument> = {},
): PeerMentorDocument {
  return {
    id: "8a0e2f4c-0000-4000-8000-000000000001",
    evidenceType: PeerEvidenceType.Transcript,
    visibility: PeerDocumentVisibility.VerificationOnly,
    url: null,
    originalFilename: "Transkript_2026_Guz.pdf",
    contentType: "application/pdf",
    sizeBytes: 2 * 1024 * 1024,
    createdAt: "2026-11-13T09:00:00Z",
    ...overrides,
  };
}

export function peerLinkFixture(
  overrides: Partial<PeerMentorDocument> = {},
): PeerMentorDocument {
  return {
    id: "8a0e2f4c-0000-4000-8000-000000000009",
    evidenceType: PeerEvidenceType.Portfolio,
    visibility: PeerDocumentVisibility.Profile,
    url: "https://github.com/mertdemir",
    originalFilename: null,
    contentType: null,
    sizeBytes: null,
    createdAt: "2026-11-13T09:05:00Z",
    ...overrides,
  };
}
