import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePersonalCv } from "@/hooks/use-personal-cv";
import { listDocuments, uploadDocument } from "@/lib/client/documents";
import { readCv } from "@/lib/client/profile-analysis";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/documents", () => ({
  listDocuments: vi.fn(),
  uploadDocument: vi.fn(),
}));
vi.mock("@/lib/client/profile-analysis", () => ({ readCv: vi.fn() }));
vi.mock("@/lib/firebase/auth", () => ({
  currentIdToken: vi.fn().mockResolvedValue("token"),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

const draft = {
  fullName: "Gülse Buran",
  jobTitle: "Kurucu",
  phone: null,
  bio: "Eski",
  linkedinUrl: null,
  expertise: ["UX"],
};

const parsedProfile = {
  current_role: "Product Manager",
  professional_summary: "Ürün geliştiren bir yönetici.",
  technologies: ["Figma"],
};

function storedCv(originalFilename: string) {
  return { id: "cv-1", kind: "cv", originalFilename, sizeBytes: 1024 };
}

describe("usePersonalCv", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fills the draft from the CV already on file", async () => {
    vi.mocked(listDocuments).mockResolvedValue([storedCv("gulse-cv.pdf")]);
    vi.mocked(readCv).mockResolvedValue(parsedProfile);
    const setField = vi.fn();
    const { result } = renderHook(() => usePersonalCv(draft, setField), {
      wrapper,
    });

    await waitFor(() => expect(result.current.canFill).toBe(true));
    expect(result.current.storedName).toBe("gulse-cv.pdf");
    act(() => result.current.fillFromStored());

    await waitFor(() => expect(result.current.filled).toBe(true));
    expect(readCv).toHaveBeenCalledWith({ documentId: "cv-1" });
    expect(setField).toHaveBeenCalledWith("jobTitle", "Product Manager");
    expect(setField).toHaveBeenCalledWith(
      "bio",
      "Ürün geliştiren bir yönetici.",
    );
    expect(setField).toHaveBeenCalledWith("expertise", ["UX", "Figma"]);
  });

  it("stores a newly chosen CV and then reads it", async () => {
    vi.mocked(listDocuments).mockResolvedValue([]);
    vi.mocked(uploadDocument).mockResolvedValue(storedCv("yeni.pdf"));
    vi.mocked(readCv).mockResolvedValue(parsedProfile);
    const setField = vi.fn();
    const file = new File(["%PDF-"], "yeni.pdf", { type: "application/pdf" });
    const { result } = renderHook(() => usePersonalCv(draft, setField), {
      wrapper,
    });

    act(() => result.current.choose({ name: "yeni.pdf", size: 5, file }));

    await waitFor(() => expect(result.current.filled).toBe(true));
    expect(uploadDocument).toHaveBeenCalledWith(file, "cv");
    expect(readCv).toHaveBeenCalledWith(file);
    expect(setField).toHaveBeenCalledWith("jobTitle", "Product Manager");
  });

  it("does not offer to read a CV that is not a PDF", async () => {
    vi.mocked(listDocuments).mockResolvedValue([storedCv("gulse-cv.docx")]);
    const { result } = renderHook(() => usePersonalCv(draft, vi.fn()), {
      wrapper,
    });

    await waitFor(() =>
      expect(result.current.storedName).toBe("gulse-cv.docx"),
    );
    expect(result.current.storedIsPdf).toBe(false);
    expect(result.current.canFill).toBe(false);
  });

  it("says why reading failed and leaves the draft alone", async () => {
    vi.mocked(listDocuments).mockResolvedValue([storedCv("gulse-cv.pdf")]);
    vi.mocked(readCv).mockRejectedValue(new Error("CV okunamadı."));
    const setField = vi.fn();
    const { result } = renderHook(() => usePersonalCv(draft, setField), {
      wrapper,
    });

    await waitFor(() => expect(result.current.canFill).toBe(true));
    act(() => result.current.fillFromStored());

    await waitFor(() => expect(result.current.error).toBe("CV okunamadı."));
    expect(setField).not.toHaveBeenCalled();
    expect(result.current.filled).toBe(false);
  });
});
