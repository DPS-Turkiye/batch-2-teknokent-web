import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "@/components/providers/toast-provider";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import { useOrganizationMembers } from "@/hooks/use-organization-members";
import { useStartupDocuments } from "@/hooks/use-startup-documents";
import { useStartupFiles } from "@/hooks/use-startup-files";
import { useStartupHeader } from "@/hooks/use-startup-header";
import type { DocumentRequestItem } from "@/interfaces/document-request";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { DocumentKind } from "@/interfaces/startup-document";
import { attachDocumentRequestUpload } from "@/lib/client/document-requests";
import { uploadDocument } from "@/lib/client/documents";
import {
  deleteDocument,
  getStartupDocumentRequests,
  shareDocument,
  unshareDocument,
} from "@/lib/client/startup-documents";
import { StartupFileFilter } from "@/lib/startup-files";
import { documentFixture } from "@test/fixtures/startup-files";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/hooks/use-startup-documents", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/use-startup-documents")>()),
  useStartupDocuments: vi.fn(),
}));
vi.mock("@/hooks/use-mentorship-requests", () => ({
  useMentorshipRequests: vi.fn(),
}));
vi.mock("@/hooks/use-organization-members", () => ({
  useOrganizationMembers: vi.fn(),
}));
vi.mock("@/hooks/use-startup-header", () => ({
  useStartupHeader: vi.fn(),
}));
vi.mock("@/lib/client/documents", () => ({ uploadDocument: vi.fn() }));
vi.mock("@/lib/client/document-requests", () => ({
  attachDocumentRequestUpload: vi.fn(),
}));
vi.mock("@/lib/client/startup-documents", () => ({
  deleteDocument: vi.fn(),
  getStartupDocumentRequests: vi.fn(),
  shareDocument: vi.fn(),
  unshareDocument: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}

function query<T>(data: T) {
  return { data, isLoading: false, error: null } as never;
}

function request(
  mentorId: string,
  mentorName: string,
  status: MentorshipRequestStatus,
) {
  return { id: `req-${mentorId}-${status}`, mentorId, mentorName, status };
}

const deck = documentFixture("deck");
const mentorNotes = documentFixture("notes", {
  uploadedById: "mentor-9",
  uploadedByName: "Nihan Öztürk",
  createdAt: "2026-08-16T09:00:00Z",
});
const programRequest: DocumentRequestItem = {
  id: "deck-request",
  title: "pitch-deck-v3.pdf",
  sortOrder: 0,
  dueDate: "2026-08-28",
  organizationId: "org-1",
  mentorshipRequestId: null,
  meetingId: null,
  mentorshipId: null,
  programId: "program-1",
  createdById: "coordinator-1",
  createdByName: "METU Stars",
  createdAt: "2026-08-20T09:00:00Z",
  uploads: [],
};

describe("useStartupFiles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useStartupDocuments).mockReturnValue(query([deck, mentorNotes]));
    vi.mocked(useOrganizationMembers).mockReturnValue(
      query([{ id: "user-1", fullName: "Gülse Buran" }]),
    );
    vi.mocked(useStartupHeader).mockReturnValue({
      programName: "METU Stars 2026",
    } as never);
    vi.mocked(getStartupDocumentRequests).mockResolvedValue([programRequest]);
    vi.mocked(useMentorshipRequests).mockReturnValue(
      query([
        request("m-1", "Nihan Öztürk", MentorshipRequestStatus.Accepted),
        request("m-1", "Nihan Öztürk", MentorshipRequestStatus.Accepted),
        request("m-2", "Ahmet Yılmaz", MentorshipRequestStatus.Pending),
      ]),
    );
  });

  it("lists the files with what was asked for, and narrows them by filter", async () => {
    const { result } = renderHook(() => useStartupFiles(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.filter).toBe(StartupFileFilter.All);
    expect(result.current.rows.map((row) => row.key)).toEqual([
      "document:deck",
      "request:deck-request",
      "document:notes",
    ]);
    expect(result.current.counts[StartupFileFilter.Pending]).toBe(1);
    expect(result.current.pendingNotice).toBe(
      "“pitch-deck-v3.pdf” METU Stars tarafından talep edildi, henüz yüklenmedi. Son tarih 28 Ağustos 2026.",
    );

    act(() => result.current.setFilter(StartupFileFilter.Pending));

    expect(result.current.rows.map((row) => row.key)).toEqual([
      "request:deck-request",
    ]);
  });

  it("reports document requests that could not be loaded", async () => {
    vi.mocked(getStartupDocumentRequests).mockRejectedValue(
      new Error("İstenen belgeler yüklenemedi."),
    );

    const { result } = renderHook(() => useStartupFiles(), { wrapper });

    await waitFor(() =>
      expect(result.current.error?.message).toBe(
        "İstenen belgeler yüklenemedi.",
      ),
    );
  });

  it("reports a team that could not be loaded instead of mislabelling the files", () => {
    vi.mocked(useOrganizationMembers).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Ekip yüklenemedi."),
    } as never);

    const { result } = renderHook(() => useStartupFiles(), { wrapper });

    expect(result.current.error?.message).toBe("Ekip yüklenemedi.");
  });

  it("offers each accepted mentor once, and only accepted ones", () => {
    const { result } = renderHook(() => useStartupFiles(), { wrapper });

    expect(result.current.mentors).toEqual([
      { id: "m-1", name: "Nihan Öztürk" },
    ]);
  });

  it("shares and unshares the document picked from the menu", async () => {
    vi.mocked(shareDocument).mockResolvedValue(deck);
    vi.mocked(unshareDocument).mockResolvedValue(undefined as never);
    const { result } = renderHook(() => useStartupFiles(), { wrapper });

    act(() => result.current.openShare("deck"));
    expect(result.current.sharingDocument).toBe(deck);

    act(() => result.current.shareWith("m-3"));
    await waitFor(() =>
      expect(shareDocument).toHaveBeenCalledWith("deck", "m-3"),
    );

    act(() => result.current.stopSharing("m-1"));
    await waitFor(() =>
      expect(unshareDocument).toHaveBeenCalledWith("deck", "m-1"),
    );
  });

  it("deletes only after confirming", async () => {
    vi.mocked(deleteDocument).mockResolvedValue(undefined as never);
    const { result } = renderHook(() => useStartupFiles(), { wrapper });

    act(() => result.current.askDelete("deck"));
    expect(result.current.deletingDocument).toBe(deck);
    expect(deleteDocument).not.toHaveBeenCalled();

    act(() => result.current.confirmDelete());

    await waitFor(() => expect(result.current.deletingDocument).toBeNull());
    expect(vi.mocked(deleteDocument).mock.calls[0][0]).toBe("deck");
  });

  it("keeps the confirmation open when the delete fails", async () => {
    vi.mocked(deleteDocument).mockRejectedValue(new Error("Dosya silinemedi."));
    const { result } = renderHook(() => useStartupFiles(), { wrapper });

    act(() => result.current.askDelete("deck"));
    act(() => result.current.confirmDelete());

    await waitFor(() => expect(result.current.isDeleting).toBe(false));
    expect(deleteDocument).toHaveBeenCalled();
    expect(result.current.deletingDocument).toBe(deck);
  });

  it("uploads a requested file and attaches it to the request", async () => {
    vi.mocked(uploadDocument).mockResolvedValue({ id: "stored-1" } as never);
    vi.mocked(attachDocumentRequestUpload).mockResolvedValue({} as never);
    const file = new File(["deck"], "deck.pdf", { type: "application/pdf" });
    const { result } = renderHook(() => useStartupFiles(), { wrapper });

    act(() =>
      result.current.uploadForRequest(
        { ...programRequest, meetingId: "meeting-1" },
        file,
      ),
    );

    await waitFor(() =>
      expect(attachDocumentRequestUpload).toHaveBeenCalledWith(
        "deck-request",
        "stored-1",
      ),
    );
    expect(uploadDocument).toHaveBeenCalledWith(
      file,
      DocumentKind.RequestedDoc,
      undefined,
      "meeting-1",
    );
    await waitFor(() =>
      expect(result.current.uploadingRequestId).toBeUndefined(),
    );
  });
});
