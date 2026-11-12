import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAiFeatures } from "@/hooks/use-ai-features";
import { useProgramCurriculum } from "@/hooks/use-program-curriculum";
import { BackendErrorCode } from "@/interfaces/ai-features";
import type { ProgramSyllabus } from "@/interfaces/coordinator-program";
import { DocumentKind } from "@/interfaces/startup-document";
import { ClientApiError } from "@/lib/client/api";
import { extractSyllabusPhases } from "@/lib/client/coordinator-programs";
import { uploadDocument } from "@/lib/client/documents";
import { aiFeatures } from "@test/fixtures/ai-features";
import { coordinatorProgramDetail } from "@test/fixtures/coordinator-programs";
import { createTestQueryClient, InLocale } from "@test/test-utils";

vi.mock("@/hooks/use-ai-features", () => ({
  useAiFeatures: vi.fn(),
  useAiFeatureRefusal: () => refused,
}));

const refused = vi.fn();
vi.mock("@/lib/client/coordinator-programs", () => ({
  extractSyllabusPhases: vi.fn(),
  replaceCoordinatorProgramPhases: vi.fn(),
}));
vi.mock("@/lib/client/documents", () => ({ uploadDocument: vi.fn() }));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <InLocale locale="tr">{children}</InLocale>
    </QueryClientProvider>
  );
}

const syllabus: ProgramSyllabus = {
  id: "doc-1",
  filename: "mufredat.pdf",
  sizeBytes: 2048,
  uploadedAt: "2026-11-01T09:00:00Z",
  kind: DocumentKind.Syllabus,
};
const pdf = new File(["%PDF"], "mufredat.pdf", { type: "application/pdf" });

function renderCurriculum() {
  return renderHook(
    () =>
      useProgramCurriculum("program-1", coordinatorProgramDetail({ syllabus })),
    { wrapper },
  );
}

describe("useProgramCurriculum syllabus reading", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAiFeatures).mockReturnValue(aiFeatures());
  });

  it("uploads a chosen syllabus to read it", async () => {
    vi.mocked(uploadDocument).mockResolvedValue({
      id: "doc-2",
      kind: DocumentKind.Syllabus,
      originalFilename: pdf.name,
      sizeBytes: 4,
    });
    vi.mocked(extractSyllabusPhases).mockResolvedValue({
      phases: [],
      weeks: [],
      pageCount: 1,
    });
    const { result } = renderCurriculum();

    expect(result.current.canReadFile).toBe(true);
    act(() => result.current.chooseFile(pdf));

    await waitFor(() =>
      expect(uploadDocument).toHaveBeenCalledWith(pdf, DocumentKind.Syllabus),
    );
    await waitFor(() =>
      expect(extractSyllabusPhases).toHaveBeenCalledWith(
        expect.objectContaining({ documentId: "doc-2" }),
      ),
    );
  });

  it("hands a switched-off refusal of the read on so the switches are read again", async () => {
    const refusal = new ClientApiError(
      "off",
      403,
      BackendErrorCode.AiFeatureDisabled,
    );
    vi.mocked(extractSyllabusPhases).mockRejectedValue(refusal);
    const { result } = renderCurriculum();

    act(() => result.current.reread());

    await waitFor(() => expect(refused).toHaveBeenCalledWith(refusal));
  });

  it("neither uploads nor reads a syllabus when syllabus reading is switched off", () => {
    vi.mocked(useAiFeatures).mockReturnValue(aiFeatures({ syllabus: false }));
    const { result } = renderCurriculum();

    act(() => result.current.chooseFile(pdf));
    act(() => result.current.reread());

    expect(result.current.canReadFile).toBe(false);
    expect(uploadDocument).not.toHaveBeenCalled();
    expect(extractSyllabusPhases).not.toHaveBeenCalled();
    expect(result.current.canAdd).toBe(true);
  });
});
