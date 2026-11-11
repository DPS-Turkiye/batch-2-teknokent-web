import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { programWeekPlanQueryKey } from "@/hooks/use-program-week-plan";
import { useWeeklyProgramImport } from "@/hooks/use-weekly-program-import";
import { DocumentKind } from "@/interfaces/startup-document";
import { ToastTone } from "@/interfaces/toast";
import { ClientApiError } from "@/lib/client/api";
import { uploadDocument } from "@/lib/client/documents";
import {
  readWeeklyProgram,
  saveWeeklyProgram,
} from "@/lib/client/weekly-program";
import type { ToastInput } from "@/stores/toast-store";
import { coordinatorProgramDetail } from "@test/fixtures/coordinator-programs";
import { weeklyProgramProposal } from "@test/fixtures/weekly-program";
import { createTestQueryClient, InLocale } from "@test/test-utils";

vi.mock("@/lib/client/weekly-program", () => ({
  readWeeklyProgram: vi.fn(),
  saveWeeklyProgram: vi.fn(),
}));
vi.mock("@/lib/client/documents", () => ({ uploadDocument: vi.fn() }));

const showToast = vi.fn<(toast: ToastInput) => void>();
vi.mock("@/stores/toast-store", () => ({
  useToast: () => ({ showToast, dismiss: vi.fn() }),
}));

function wrapperFor(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <InLocale locale="tr">{children}</InLocale>
      </QueryClientProvider>
    );
  };
}

function render(
  detail = coordinatorProgramDetail(),
  client = createTestQueryClient(),
) {
  return renderHook(() => useWeeklyProgramImport("program-1", detail), {
    wrapper: wrapperFor(client),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(readWeeklyProgram).mockResolvedValue(weeklyProgramProposal());
});

describe("useWeeklyProgramImport", () => {
  it("refuses a file that is not a PDF before uploading it", () => {
    const { result } = render();

    act(() => result.current.chooseFile(new File(["x"], "plan.docx")));

    expect(uploadDocument).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith({
      message: "Yalnızca PDF yükleyebilirsin.",
      tone: ToastTone.Error,
    });
  });

  it("uploads the PDF as a weekly program, reads it and opens the review", async () => {
    vi.mocked(uploadDocument).mockResolvedValue({
      id: "doc-new",
      kind: DocumentKind.WeeklyProgram,
      originalFilename: "haftalik.pdf",
      sizeBytes: 1,
    });
    const { result } = render();

    act(() => result.current.chooseFile(new File(["x"], "haftalik.pdf")));

    await waitFor(() => expect(result.current.reviewing).toBe(true));
    expect(uploadDocument).toHaveBeenCalledWith(
      expect.any(File),
      DocumentKind.WeeklyProgram,
    );
    expect(readWeeklyProgram).toHaveBeenCalledWith("program-1", "doc-new");
    expect(result.current.weeks).toHaveLength(10);
    expect(result.current.phases).toHaveLength(4);
    expect(result.current.keepPast).toBe(false);
  });

  it("reads the just uploaded file again when the first read failed", async () => {
    vi.mocked(uploadDocument).mockResolvedValue({
      id: "doc-new",
      kind: DocumentKind.WeeklyProgram,
      originalFilename: "haftalik.pdf",
      sizeBytes: 1,
    });
    vi.mocked(readWeeklyProgram)
      .mockRejectedValueOnce(new Error("AI zaman aşımı"))
      .mockResolvedValueOnce(weeklyProgramProposal());
    const { result } = render();

    act(() => result.current.chooseFile(new File(["x"], "haftalik.pdf")));
    await waitFor(() => expect(result.current.reading).toBe(false));
    expect(result.current.reviewing).toBe(false);
    expect(result.current.canReread).toBe(true);

    act(() => result.current.reread());

    await waitFor(() => expect(result.current.reviewing).toBe(true));
    expect(readWeeklyProgram).toHaveBeenLastCalledWith("program-1", "doc-new");
  });

  it("keeps both of two edits made in the same tick", async () => {
    const detail = coordinatorProgramDetail({
      syllabus: {
        id: "doc-weekly",
        filename: "haftalik.pdf",
        sizeBytes: 1,
        uploadedAt: "2026-06-01T09:00:00Z",
        kind: DocumentKind.WeeklyProgram,
      },
    });
    const { result } = render(detail);
    act(() => result.current.reread());
    await waitFor(() => expect(result.current.reviewing).toBe(true));

    act(() => {
      result.current.renamePhase(0, "Problem");
      result.current.setPhaseOutput(1, "");
      result.current.updateWeek(0, { title: "Başlangıç" });
    });

    expect(result.current.phases[0]?.name).toBe("Problem");
    expect(result.current.phases[1]?.expectedOutput).toBeNull();
    expect(result.current.weeks[0]?.title).toBe("Başlangıç");
  });

  it("needs program dates before a file can be read", () => {
    const detail = coordinatorProgramDetail();
    const { result } = render({
      ...detail,
      program: { ...detail.program, endDate: null },
    });

    expect(result.current.needsDates).toBe(true);
    expect(result.current.canReread).toBe(false);
  });

  it("puts the saved plan into both caches and closes the review", async () => {
    const detail = coordinatorProgramDetail({
      syllabus: {
        id: "doc-weekly",
        filename: "haftalik.pdf",
        sizeBytes: 1,
        uploadedAt: "2026-06-01T09:00:00Z",
        kind: DocumentKind.WeeklyProgram,
      },
    });
    const plan = { totalWeeks: 11, weeks: [] };
    vi.mocked(saveWeeklyProgram).mockResolvedValue({ program: detail, plan });
    const client = createTestQueryClient();
    const { result } = render(detail, client);

    act(() => result.current.reread());
    await waitFor(() => expect(result.current.reviewing).toBe(true));
    act(() => result.current.save());

    await waitFor(() => expect(result.current.reviewing).toBe(false));
    expect(client.getQueryData(programWeekPlanQueryKey("program-1"))).toEqual(
      plan,
    );
    expect(showToast).toHaveBeenCalledWith({
      message: "Haftalık program ve fazlar kaydedildi.",
      tone: ToastTone.Success,
    });
  });

  it("says the plan changed when the save is refused as stale", async () => {
    const detail = coordinatorProgramDetail({
      syllabus: {
        id: "doc-weekly",
        filename: "haftalik.pdf",
        sizeBytes: 1,
        uploadedAt: "2026-06-01T09:00:00Z",
        kind: DocumentKind.WeeklyProgram,
      },
    });
    vi.mocked(saveWeeklyProgram).mockRejectedValue(
      new ClientApiError("conflict", 409),
    );
    const { result } = render(detail);

    act(() => result.current.reread());
    await waitFor(() => expect(result.current.reviewing).toBe(true));
    act(() => result.current.save());

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith({
        message:
          "Program planı sen dosyayı okurken değişti. Dosyayı yeniden oku.",
        tone: ToastTone.Error,
      }),
    );
    expect(result.current.reviewing).toBe(true);
  });

  it("refuses to save a week without a title or with phases out of order", async () => {
    const detail = coordinatorProgramDetail({
      syllabus: {
        id: "doc-weekly",
        filename: "haftalik.pdf",
        sizeBytes: 1,
        uploadedAt: "2026-06-01T09:00:00Z",
        kind: DocumentKind.WeeklyProgram,
      },
    });
    const { result } = render(detail);
    act(() => result.current.reread());
    await waitFor(() => expect(result.current.reviewing).toBe(true));

    act(() => result.current.updateWeek(0, { title: " " }));
    act(() => result.current.save());
    expect(result.current.problem).toBe("Her haftaya bir başlık yaz.");

    act(() => result.current.updateWeek(0, { title: "Yola Çık" }));
    act(() => result.current.renamePhase(1, ""));
    act(() => result.current.save());
    expect(result.current.problem).toBe("Her faza bir ad yaz.");
    expect(saveWeeklyProgram).not.toHaveBeenCalled();
  });
});
