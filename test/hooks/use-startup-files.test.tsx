import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "@/components/providers/toast-provider";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import { useStartupDocuments } from "@/hooks/use-startup-documents";
import { useStartupFiles } from "@/hooks/use-startup-files";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import {
  deleteDocument,
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
vi.mock("@/lib/client/startup-documents", () => ({
  deleteDocument: vi.fn(),
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

const deck = documentFixture("deck", {
  shares: [
    {
      mentorId: "m-1",
      mentorName: "Nihan Öztürk",
      sharedAt: "2026-09-05T09:00:00Z",
    },
  ],
});
const meetingFile = documentFixture("notes", { meetingId: "meeting-1" });

describe("useStartupFiles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useStartupDocuments).mockReturnValue(query([deck, meetingFile]));
    vi.mocked(useMentorshipRequests).mockReturnValue(
      query([
        request("m-1", "Nihan Öztürk", MentorshipRequestStatus.Accepted),
        request("m-1", "Nihan Öztürk", MentorshipRequestStatus.Accepted),
        request("m-2", "Ahmet Yılmaz", MentorshipRequestStatus.Pending),
      ]),
    );
  });

  it("splits the documents into the three lists", () => {
    const { result } = renderHook(() => useStartupFiles(), { wrapper });

    expect(result.current.filter).toBe(StartupFileFilter.All);
    expect(result.current.sections.startup).toEqual([deck]);
    expect(result.current.sections.meeting).toEqual([meetingFile]);
    expect(result.current.sections.shared).toHaveLength(1);
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
});
