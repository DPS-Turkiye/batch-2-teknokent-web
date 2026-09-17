import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "@/components/providers/toast-provider";
import { useProfilePhoto } from "@/hooks/use-profile-photo";
import { listOwnDocuments, uploadDocument } from "@/lib/client/documents";
import { getDocumentDownloadUrl } from "@/lib/client/startup-documents";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/documents", () => ({
  listOwnDocuments: vi.fn(),
  uploadDocument: vi.fn(),
}));

vi.mock("@/lib/client/startup-documents", () => ({
  getDocumentDownloadUrl: vi.fn(),
  getStartupDocuments: vi.fn(),
}));

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}

function stored(id: string, kind: string) {
  return { id, kind, originalFilename: `${id}.png`, sizeBytes: 10 };
}

describe("useProfilePhoto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listOwnDocuments).mockResolvedValue([]);
  });

  it("shows a signed link to the newest photo", async () => {
    vi.mocked(listOwnDocuments).mockResolvedValue([
      stored("cv", "cv"),
      stored("new", "avatar"),
      stored("old", "avatar"),
    ]);
    vi.mocked(getDocumentDownloadUrl).mockResolvedValue({
      url: "https://files.example/new.png",
    } as Awaited<ReturnType<typeof getDocumentDownloadUrl>>);

    const { result } = renderHook(() => useProfilePhoto(), {
      wrapper: Wrapper,
    });

    await waitFor(() =>
      expect(result.current.photoUrl).toBe("https://files.example/new.png"),
    );
    expect(getDocumentDownloadUrl).toHaveBeenCalledWith("new");
  });

  it("has no photo when nothing was uploaded", async () => {
    const { result } = renderHook(() => useProfilePhoto(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(listOwnDocuments).toHaveBeenCalled());
    expect(result.current.photoUrl).toBeNull();
    expect(getDocumentDownloadUrl).not.toHaveBeenCalled();
  });

  it("refuses a file that isn't a supported image without uploading", async () => {
    const { result } = renderHook(() => useProfilePhoto(), {
      wrapper: Wrapper,
    });

    act(() =>
      result.current.upload(new File(["x"], "me.gif", { type: "image/gif" })),
    );

    expect(
      await screen.findByText("PNG, JPG veya WebP bir fotoğraf seç."),
    ).toBeInTheDocument();
    expect(uploadDocument).not.toHaveBeenCalled();
  });

  it("uploads the photo as an avatar and reloads the list", async () => {
    vi.mocked(uploadDocument).mockResolvedValue(stored("new", "avatar"));
    const file = new File(["png"], "me.png", { type: "image/png" });
    const { result } = renderHook(() => useProfilePhoto(), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(listOwnDocuments).toHaveBeenCalledTimes(1));

    act(() => result.current.upload(file));

    await waitFor(() =>
      expect(uploadDocument).toHaveBeenCalledWith(file, "avatar"),
    );
    await waitFor(() => expect(listOwnDocuments).toHaveBeenCalledTimes(2));
    expect(
      await screen.findByText("Profil fotoğrafın güncellendi."),
    ).toBeInTheDocument();
  });

  it("says so when the upload fails", async () => {
    vi.mocked(uploadDocument).mockRejectedValue(new Error("network"));
    const { result } = renderHook(() => useProfilePhoto(), {
      wrapper: Wrapper,
    });

    act(() =>
      result.current.upload(new File(["png"], "me.png", { type: "image/png" })),
    );

    expect(
      await screen.findByText("Fotoğraf yüklenemedi."),
    ).toBeInTheDocument();
  });
});
