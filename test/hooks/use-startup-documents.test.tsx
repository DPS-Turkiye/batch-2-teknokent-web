import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DocumentPreviewProvider } from "@/components/providers/document-preview-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import {
  useDocumentUrl,
  useOpenDocument,
  useStartupDocuments,
} from "@/hooks/use-startup-documents";
import {
  getDocumentDownloadUrl,
  getStartupDocuments,
} from "@/lib/client/startup-documents";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/startup-documents", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/client/startup-documents")>()),
  getStartupDocuments: vi.fn(),
  getDocumentDownloadUrl: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <ToastProvider>
        <DocumentPreviewProvider>{children}</DocumentPreviewProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

const link = {
  url: "https://bucket.s3/canvas.pdf?sig",
  filename: "canvas.pdf",
  contentType: "application/pdf",
};

describe("startup document hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        blob: () =>
          Promise.resolve(new Blob(["%PDF-1.4"], { type: "application/pdf" })),
      }),
    );
    vi.spyOn(URL, "createObjectURL").mockReturnValue(
      "blob:http://localhost/preview",
    );
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("loads the startup's documents", async () => {
    vi.mocked(getStartupDocuments).mockResolvedValue([]);

    const { result } = renderHook(() => useStartupDocuments(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getStartupDocuments).toHaveBeenCalledTimes(1);
  });

  it("only signs a link once there is a document", async () => {
    vi.mocked(getDocumentDownloadUrl).mockResolvedValue(link);

    const { rerender, result } = renderHook(
      ({ id }: { id?: string }) => useDocumentUrl(id),
      { wrapper, initialProps: {} },
    );
    expect(getDocumentDownloadUrl).not.toHaveBeenCalled();

    rerender({ id: "logo-1" });
    await waitFor(() => expect(result.current.data?.url).toBe(link.url));
    expect(getDocumentDownloadUrl).toHaveBeenCalledWith("logo-1");
  });

  it("opens the file in an in-app preview instead of downloading it", async () => {
    const open = vi.spyOn(window, "open");
    vi.mocked(getDocumentDownloadUrl).mockResolvedValue(link);

    const { result } = renderHook(() => useOpenDocument(), { wrapper });
    await act(() => result.current("canvas-1"));

    expect(open).not.toHaveBeenCalled();
    expect(
      screen.getByRole("dialog", { name: "canvas.pdf" }),
    ).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      "/api/startup/documents/canvas-1/content",
    );
    expect(await screen.findByTitle("canvas.pdf")).toHaveAttribute(
      "src",
      expect.stringContaining("#toolbar=0"),
    );
  });

  it("toasts when the link cannot be signed", async () => {
    vi.mocked(getDocumentDownloadUrl).mockRejectedValue(new Error("403"));

    const { result } = renderHook(() => useOpenDocument(), { wrapper });
    await act(() => result.current("canvas-1"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
