import type { DocumentRequestItem } from "@/interfaces/document-request";

/** A file a mentor asked the startup for, not uploaded yet. */
export function documentRequestItem(
  id: string,
  overrides: Partial<DocumentRequestItem> = {},
): DocumentRequestItem {
  return {
    id,
    title: `${id}.pdf`,
    sortOrder: 0,
    dueDate: null,
    organizationId: "org-1",
    mentorshipRequestId: "request-1",
    meetingId: null,
    mentorshipId: null,
    programId: null,
    createdById: "mentor-1",
    createdByName: "Nihan Öztürk",
    createdAt: "2026-08-23T09:00:00Z",
    uploads: [],
    ...overrides,
  };
}
