import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAiFeatureRefusal, useAiFeatures } from "@/hooks/use-ai-features";
import { usePersonalCv } from "@/hooks/use-personal-cv";
import { BackendErrorCode } from "@/interfaces/ai-features";
import { DocumentKind } from "@/interfaces/startup-document";
import { isAiFeatureDisabledError } from "@/lib/ai-features";
import { ClientApiError } from "@/lib/client/api";
import { listDocuments, uploadDocument } from "@/lib/client/documents";
import { readCv } from "@/lib/client/profile-analysis";
import { aiFeatures } from "@test/fixtures/ai-features";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/documents", () => ({
  listDocuments: vi.fn(),
  uploadDocument: vi.fn(),
}));
vi.mock("@/lib/client/profile-analysis", () => ({ readCv: vi.fn() }));
vi.mock("@/hooks/use-ai-features", () => ({
  useAiFeatures: vi.fn(),
  useAiFeatureRefusal: vi.fn(),
}));

/** What a screen does with a failure; a switched-off refusal answers true. */
const refused = vi.fn((error: unknown) => isAiFeatureDisabledError(error));
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
  return {
    id: "cv-1",
    kind: DocumentKind.Cv,
    originalFilename,
    sizeBytes: 1024,
  };
}

describe("usePersonalCv", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAiFeatures).mockReturnValue(aiFeatures());
    vi.mocked(useAiFeatureRefusal).mockReturnValue(refused);
  });

  it("only stores a chosen CV, and never offers to read one, when profile parsing is switched off", async () => {
    vi.mocked(useAiFeatures).mockReturnValue(
      aiFeatures({ profileParsing: false }),
    );
    vi.mocked(listDocuments).mockResolvedValue([storedCv("gulse-cv.pdf")]);
    vi.mocked(uploadDocument).mockResolvedValue(storedCv("yeni.pdf"));
    const setField = vi.fn();
    const { result } = renderHook(() => usePersonalCv(draft, setField), {
      wrapper,
    });

    await waitFor(() => expect(result.current.storedName).toBe("gulse-cv.pdf"));
    expect(result.current.canRead).toBe(false);
    expect(result.current.canFill).toBe(false);
    act(() => result.current.fillFromStored());
    const file = new File(["%PDF"], "yeni.pdf", { type: "application/pdf" });
    act(() => result.current.choose({ name: file.name, size: 4, file }));

    await waitFor(() =>
      expect(uploadDocument).toHaveBeenCalledWith(file, DocumentKind.Cv),
    );
    await waitFor(() => expect(result.current.isUploading).toBe(false));
    expect(readCv).not.toHaveBeenCalled();
    expect(setField).not.toHaveBeenCalled();
  });

  it("stores a chosen CV but reads nothing, and offers no reading, until the person agrees", async () => {
    vi.mocked(listDocuments).mockResolvedValue([storedCv("gulse-cv.pdf")]);
    vi.mocked(uploadDocument).mockResolvedValue(storedCv("yeni.pdf"));
    const setField = vi.fn();
    const { result } = renderHook(() => usePersonalCv(draft, setField), {
      wrapper,
    });

    await waitFor(() => expect(result.current.storedName).toBe("gulse-cv.pdf"));
    expect(result.current.consent).toBe(false);
    expect(result.current.canRead).toBe(true);
    expect(result.current.canFill).toBe(false);
    act(() => result.current.fillFromStored());
    const file = new File(["%PDF"], "yeni.pdf", { type: "application/pdf" });
    act(() => result.current.choose({ name: file.name, size: 4, file }));

    await waitFor(() =>
      expect(uploadDocument).toHaveBeenCalledWith(file, DocumentKind.Cv),
    );
    await waitFor(() => expect(result.current.isUploading).toBe(false));
    expect(readCv).not.toHaveBeenCalled();
    expect(setField).not.toHaveBeenCalled();
  });

  it("keeps reading on offer after a CV is stored unread, and reads it once the person agrees", async () => {
    vi.mocked(listDocuments).mockResolvedValue([storedCv("yeni.pdf")]);
    vi.mocked(uploadDocument).mockResolvedValue(storedCv("yeni.pdf"));
    vi.mocked(readCv).mockResolvedValue(parsedProfile);
    const setField = vi.fn();
    const file = new File(["%PDF-"], "yeni.pdf", { type: "application/pdf" });
    const { result } = renderHook(() => usePersonalCv(draft, setField), {
      wrapper,
    });

    await waitFor(() => expect(result.current.storedName).toBe("yeni.pdf"));
    act(() => result.current.choose({ name: "yeni.pdf", size: 5, file }));
    await waitFor(() => expect(result.current.isUploading).toBe(false));
    expect(readCv).not.toHaveBeenCalled();
    expect(result.current.offerFill).toBe(true);
    expect(result.current.canFill).toBe(false);
    act(() => result.current.setConsent(true));
    expect(result.current.canFill).toBe(true);
    act(() => result.current.fillFromStored());

    await waitFor(() => expect(result.current.filled).toBe(true));
    expect(readCv).toHaveBeenCalledTimes(1);
    expect(readCv).toHaveBeenCalledWith({ documentId: "cv-1" }, true);
    expect(result.current.offerFill).toBe(false);
  });

  it("does not read a CV whose upload finished after the consent was taken back", async () => {
    let finish!: (value: ReturnType<typeof storedCv>) => void;
    vi.mocked(listDocuments).mockResolvedValue([]);
    vi.mocked(uploadDocument).mockReturnValue(
      new Promise((done) => {
        finish = done;
      }),
    );
    const file = new File(["%PDF-"], "yeni.pdf", { type: "application/pdf" });
    const { result } = renderHook(() => usePersonalCv(draft, vi.fn()), {
      wrapper,
    });

    act(() => result.current.setConsent(true));
    act(() => result.current.choose({ name: "yeni.pdf", size: 5, file }));
    await waitFor(() => expect(uploadDocument).toHaveBeenCalled());
    act(() => result.current.setConsent(false));
    await act(async () => {
      finish(storedCv("yeni.pdf"));
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.isUploading).toBe(false));
    expect(readCv).not.toHaveBeenCalled();
  });

  it("fills the draft from the CV already on file", async () => {
    vi.mocked(listDocuments).mockResolvedValue([storedCv("gulse-cv.pdf")]);
    vi.mocked(readCv).mockResolvedValue(parsedProfile);
    const setField = vi.fn();
    const { result } = renderHook(() => usePersonalCv(draft, setField), {
      wrapper,
    });
    act(() => result.current.setConsent(true));

    await waitFor(() => expect(result.current.canFill).toBe(true));
    expect(result.current.storedName).toBe("gulse-cv.pdf");
    act(() => result.current.fillFromStored());

    await waitFor(() => expect(result.current.filled).toBe(true));
    expect(readCv).toHaveBeenCalledWith({ documentId: "cv-1" }, true);
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
    act(() => result.current.setConsent(true));

    act(() => result.current.choose({ name: "yeni.pdf", size: 5, file }));

    await waitFor(() => expect(result.current.filled).toBe(true));
    expect(uploadDocument).toHaveBeenCalledWith(file, "cv");
    expect(readCv).toHaveBeenCalledWith(file, true);
    expect(setField).toHaveBeenCalledWith("jobTitle", "Product Manager");
  });

  it("hands a switched-off refusal on so the switches are read again", async () => {
    const refusal = new ClientApiError(
      "off",
      403,
      BackendErrorCode.AiFeatureDisabled,
    );
    vi.mocked(listDocuments).mockResolvedValue([]);
    vi.mocked(uploadDocument).mockResolvedValue(storedCv("yeni.pdf"));
    vi.mocked(readCv).mockRejectedValue(refusal);
    const file = new File(["%PDF-"], "yeni.pdf", { type: "application/pdf" });
    const { result } = renderHook(() => usePersonalCv(draft, vi.fn()), {
      wrapper,
    });
    act(() => result.current.setConsent(true));

    act(() => result.current.choose({ name: "yeni.pdf", size: 5, file }));

    await waitFor(() => expect(refused).toHaveBeenCalledWith(refusal));
    expect(result.current.filled).toBe(false);
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
    act(() => result.current.setConsent(true));

    await waitFor(() => expect(result.current.canFill).toBe(true));
    act(() => result.current.fillFromStored());

    await waitFor(() => expect(result.current.error).toBe("CV okunamadı."));
    expect(setField).not.toHaveBeenCalled();
    expect(result.current.filled).toBe(false);
  });
});
