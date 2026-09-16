import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DocumentRequestChecklist } from "@/components/mentorships/document-request-checklist";
import { useOpenDocument } from "@/hooks/use-startup-documents";
import { UserRole } from "@/interfaces/session";
import { listDocumentRequests } from "@/lib/client/document-requests";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/hooks/use-startup-documents", () => ({
  useOpenDocument: vi.fn(),
}));

vi.mock("@/lib/client/document-requests", () => ({
  listDocumentRequests: vi.fn(),
  replaceDocumentRequests: vi.fn(),
  attachDocumentRequestUpload: vi.fn(),
  deleteDocumentRequestUpload: vi.fn(),
}));

vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => ({ role: UserRole.Mentor, userId: "mentor-1" }),
}));

const openDocument = vi.fn();

describe("DocumentRequestChecklist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useOpenDocument).mockReturnValue(openDocument);
    vi.mocked(listDocumentRequests).mockResolvedValue([
      {
        id: "item-1",
        title: "Pitch deck",
        sortOrder: 0,
        dueDate: null,
        organizationId: "org-1",
        mentorshipRequestId: "req-1",
        meetingId: null,
        mentorshipId: null,
        programId: null,
        createdById: "mentor-1",
        createdByName: "Nihan Öztürk",
        createdAt: "2026-09-01T10:00:00Z",
        uploads: [
          {
            id: "upload-1",
            storedDocumentId: "doc-1",
            originalFilename: "deck.pdf",
            contentType: "application/pdf",
            sizeBytes: 2048,
            uploadedById: "mentee-1",
            uploadedByName: "Gülse Buran",
            createdAt: "2026-09-02T10:00:00Z",
          },
        ],
      },
    ]);
  });

  it("lets the mentor open a file the mentee uploaded", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <DocumentRequestChecklist
        scope={{ mentorshipRequestId: "req-1" }}
        canManage
      />,
    );

    await user.click(await screen.findByRole("button", { name: "Görüntüle" }));
    expect(openDocument).toHaveBeenCalledWith("doc-1");
  });
});
