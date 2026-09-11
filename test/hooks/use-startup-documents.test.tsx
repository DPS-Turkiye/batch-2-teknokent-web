import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

vi.mock("@/lib/client/startup-documents", () => ({
  getStartupDocuments: vi.fn(),
  getDocumentDownloadUrl: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <ToastProvider>{children}</ToastProvider>
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
  });

  afterEach(() => {
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

  it("opens the signed link in a tab opened during the click", async () => {
    const tab = { opener: {}, location: { href: "" }, close: vi.fn() };
    const open = vi
      .spyOn(window, "open")
      .mockReturnValue(tab as unknown as Window);
    vi.mocked(getDocumentDownloadUrl).mockResolvedValue(link);

    const { result } = renderHook(() => useOpenDocument(), { wrapper });
    await act(() => result.current("canvas-1"));

    expect(open).toHaveBeenCalledWith("", "_blank");
    expect(tab.opener).toBeNull();
    expect(tab.location.href).toBe(link.url);
  });

  it("closes the tab again when the link cannot be signed", async () => {
    const tab = { opener: {}, location: { href: "" }, close: vi.fn() };
    vi.spyOn(window, "open").mockReturnValue(tab as unknown as Window);
    vi.mocked(getDocumentDownloadUrl).mockRejectedValue(new Error("403"));

    const { result } = renderHook(() => useOpenDocument(), { wrapper });
    await act(() => result.current("canvas-1"));

    expect(tab.close).toHaveBeenCalled();
    expect(tab.location.href).toBe("");
  });
});
