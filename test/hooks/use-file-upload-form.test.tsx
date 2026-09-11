import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "@/components/providers/toast-provider";
import { useFileUploadForm } from "@/hooks/use-file-upload-form";
import { DocumentKind } from "@/interfaces/startup-document";
import { uploadDocument } from "@/lib/client/documents";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/documents", () => ({ uploadDocument: vi.fn() }));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}

const file = new File(["x"], "model.xlsx");

describe("useFileUploadForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("can only submit once a file is picked", () => {
    const { result } = renderHook(() => useFileUploadForm(), { wrapper });

    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);
    expect(result.current.canSubmit).toBe(false);

    act(() => result.current.setFile(file));
    expect(result.current.canSubmit).toBe(true);
  });

  it("uploads the file as the chosen kind and closes", async () => {
    vi.mocked(uploadDocument).mockResolvedValue({} as never);
    const { result } = renderHook(() => useFileUploadForm(), { wrapper });

    act(() => {
      result.current.open();
      result.current.setKind(DocumentKind.Other);
      result.current.setFile(file);
    });
    act(() => result.current.submit());

    await waitFor(() => expect(result.current.isOpen).toBe(false));
    expect(uploadDocument).toHaveBeenCalledWith(file, DocumentKind.Other);
  });

  it("stays open when the upload fails", async () => {
    vi.mocked(uploadDocument).mockRejectedValue(new Error("Dosya çok büyük."));
    const { result } = renderHook(() => useFileUploadForm(), { wrapper });

    act(() => {
      result.current.open();
      result.current.setFile(file);
    });
    act(() => result.current.submit());

    await waitFor(() => expect(result.current.isUploading).toBe(false));
    expect(uploadDocument).toHaveBeenCalled();
    expect(result.current.isOpen).toBe(true);
  });
});
