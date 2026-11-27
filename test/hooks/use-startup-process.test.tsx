import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Toaster } from "@/components/common/toaster";
import { useStartupProcess } from "@/hooks/use-startup-process";
import { ActionItemStatus } from "@/interfaces/action-item";
import { DocumentKind } from "@/interfaces/startup-document";
import {
  StartupStageState,
  type StartupProcess,
} from "@/interfaces/startup-process";
import {
  uploadCanceledError,
  uploadDocumentWithProgress,
} from "@/lib/client/documents";
import {
  getStartupProcess,
  submitAssignment,
  withdrawSubmission,
} from "@/lib/client/startup-process";
import { processAssignment } from "@test/fixtures/process-assignments";
import { processPhase, startupProcess } from "@test/fixtures/startup-process";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/startup-process", () => ({
  getStartupProcess: vi.fn(),
  submitAssignment: vi.fn(),
  withdrawSubmission: vi.fn(),
}));

vi.mock("@/lib/client/documents", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/client/documents")>()),
  uploadDocumentWithProgress: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <>
        {children}
        <Toaster />
      </>
    </QueryClientProvider>
  );
}

function assignment(
  id: string,
  phaseId: string | null,
  status = ActionItemStatus.Open,
) {
  return processAssignment({ id, phaseId, status });
}

const round = {
  id: "round-1",
  title: "Value proposition & onboarding",
  name: "MVP test turu",
  phaseId: "mvp",
  startsOn: "2026-08-02",
  endsOn: "2026-08-31",
};

const problemRound = {
  id: "round-0",
  title: "Problem keşfi",
  name: "Problem turu",
  phaseId: "problem",
  startsOn: "2026-06-12",
  endsOn: "2026-07-08",
};

function process(overrides: Partial<StartupProcess> = {}): StartupProcess {
  return startupProcess({
    currentPhaseId: "mvp",
    phases: [
      processPhase("problem", "Problemi Keşfet", {
        state: StartupStageState.Completed,
      }),
      processPhase("mvp", "MVP", { state: StartupStageState.Current }),
      processPhase("market", "Pazar"),
    ],
    currentRound: round,
    rounds: [round, problemRound],
    assignments: [
      assignment("mvp", "mvp"),
      assignment("problem", "problem", ActionItemStatus.Completed),
      assignment("loose", null),
    ],
    ...overrides,
  });
}

describe("useStartupProcess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens on the current phase with its round and Ödevler", async () => {
    vi.mocked(getStartupProcess).mockResolvedValue(process());

    const { result } = renderHook(() => useStartupProcess(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.selectedPhaseId).toBe("mvp");
    expect(result.current.selectedRound?.name).toBe("MVP test turu");
    expect(result.current.assignments.map((item) => item.id)).toEqual(["mvp"]);
    expect(result.current.phaseCards.map((card) => card.percent)).toEqual([
      100, 0, 0,
    ]);
    expect(result.current.assignmentsTitle).toBe("Bu fazdaki ödevlerin");
    expect(result.current.unphasedCount).toBe(1);
  });

  it("switches the round and Ödevler to a picked phase and leaves Tümü", async () => {
    vi.mocked(getStartupProcess).mockResolvedValue(process());
    const { result } = renderHook(() => useStartupProcess(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.toggleShowAll());
    expect(result.current.assignments).toHaveLength(3);
    act(() => result.current.selectPhase("problem"));

    expect(result.current.showAll).toBe(false);
    expect(result.current.selectedRound?.name).toBe("Problem turu");
    expect(result.current.assignments.map((item) => item.id)).toEqual([
      "problem",
    ]);
  });

  it("opens on a linked Ödev's phase until another view is picked", async () => {
    vi.mocked(getStartupProcess).mockResolvedValue(process());
    const { result } = renderHook(() => useStartupProcess("problem"), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.selectedPhaseId).toBe("problem");
    expect(result.current.focusedAssignmentId).toBe("problem");
    expect(result.current.assignments.map((item) => item.id)).toEqual([
      "problem",
    ]);

    act(() => result.current.selectPhase("market"));
    expect(result.current.selectedPhaseId).toBe("market");
    expect(result.current.focusedAssignmentId).toBeNull();
  });

  it("opens Fazsız görevler for a linked Ödev no phase covers", async () => {
    vi.mocked(getStartupProcess).mockResolvedValue(process());
    const { result } = renderHook(() => useStartupProcess("loose"), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.showUnphased).toBe(true);
    expect(result.current.selectedPhaseId).toBeNull();
    expect(result.current.assignments.map((item) => item.id)).toEqual([
      "loose",
    ]);

    act(() => result.current.toggleShowAll());
    expect(result.current.showUnphased).toBe(false);
    expect(result.current.assignments).toHaveLength(3);
  });

  it("ignores a link to an Ödev the team does not have", async () => {
    vi.mocked(getStartupProcess).mockResolvedValue(process());
    const { result } = renderHook(() => useStartupProcess("not-ours"), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.selectedPhaseId).toBe("mvp");
    expect(result.current.focusedAssignmentId).toBeNull();
  });

  it("starts on the first phase when today falls in none", async () => {
    vi.mocked(getStartupProcess).mockResolvedValue(
      process({ currentPhaseId: null, currentRound: null }),
    );

    const { result } = renderHook(() => useStartupProcess(), { wrapper });

    await waitFor(() => expect(result.current.selectedPhaseId).toBe("problem"));
  });

  it("falls back to the current phase when the picked one is gone", async () => {
    vi.mocked(getStartupProcess).mockResolvedValue(process());
    const { result } = renderHook(() => useStartupProcess(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.selectPhase("removed-phase"));

    expect(result.current.selectedPhaseId).toBe("mvp");
    expect(result.current.assignments.map((item) => item.id)).toEqual(["mvp"]);
  });

  it("lists the Ödevler no phase covers on their own", async () => {
    vi.mocked(getStartupProcess).mockResolvedValue(process());
    const { result } = renderHook(() => useStartupProcess(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.selectUnphased());

    expect(result.current.assignments.map((item) => item.id)).toEqual([
      "loose",
    ]);
    expect(result.current.selectedPhaseId).toBeNull();
    expect(result.current.selectedRound).toBeNull();
    expect(result.current.assignmentsTitle).toBe("Fazsız görevler");
  });

  it("shows every Ödev in one list when the program has no phases", async () => {
    vi.mocked(getStartupProcess).mockResolvedValue(
      process({ phases: [], currentPhaseId: null }),
    );
    const { result } = renderHook(() => useStartupProcess(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasPhases).toBe(false);
    expect(result.current.assignments).toHaveLength(3);
    expect(result.current.unphasedCount).toBe(0);
    expect(result.current.assignmentsTitle).toBe("Ödevlerin");
  });

  it("uploads the file as homework, links it and shows the new process", async () => {
    const file = new File(["%PDF-1.4"], "model.pdf", {
      type: "application/pdf",
    });
    const done = process({
      assignments: [assignment("mvp", "mvp", ActionItemStatus.Completed)],
    });
    vi.mocked(getStartupProcess).mockResolvedValue(process());
    vi.mocked(uploadDocumentWithProgress).mockResolvedValue({
      id: "doc-1",
      kind: DocumentKind.Homework,
      originalFilename: "model.pdf",
      sizeBytes: 8,
    });
    vi.mocked(submitAssignment).mockResolvedValue(done);
    const { result } = renderHook(() => useStartupProcess(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.uploadAssignment("mvp", file));

    await waitFor(() =>
      expect(result.current.assignments[0]?.status).toBe(
        ActionItemStatus.Completed,
      ),
    );
    expect(uploadDocumentWithProgress).toHaveBeenCalledWith(
      file,
      DocumentKind.Homework,
      expect.objectContaining({ onProgress: expect.any(Function) }),
    );
    expect(submitAssignment).toHaveBeenCalledWith("mvp", "doc-1");
    expect(result.current.uploadingAssignmentId).toBeNull();
  });

  it("reports how much of the file has gone out while it uploads", async () => {
    let report: (sent: number) => void = () => undefined;
    let finish: (
      stored: Awaited<ReturnType<typeof uploadDocumentWithProgress>>,
    ) => void = () => undefined;
    vi.mocked(getStartupProcess).mockResolvedValue(process());
    vi.mocked(uploadDocumentWithProgress).mockImplementation(
      (_file, _kind, { onProgress }) => {
        report = onProgress ?? report;
        return new Promise((resolve) => {
          finish = resolve;
        });
      },
    );
    vi.mocked(submitAssignment).mockResolvedValue(process());
    const { result } = renderHook(() => useStartupProcess(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() =>
      result.current.uploadAssignment(
        "mvp",
        new File(["%PDF-1.4"], "model.pdf", { type: "application/pdf" }),
      ),
    );
    await waitFor(() => expect(result.current.uploadPercent).toBe(0));
    act(() => report(0.426));
    expect(result.current.uploadPercent).toBe(43);

    act(() =>
      finish({
        id: "doc-1",
        kind: DocumentKind.Homework,
        originalFilename: "model.pdf",
        sizeBytes: 8,
      }),
    );
    await waitFor(() => expect(result.current.uploadPercent).toBeNull());
  });

  it("stops a running upload on İptal without handing anything in", async () => {
    vi.mocked(getStartupProcess).mockResolvedValue(process());
    vi.mocked(uploadDocumentWithProgress).mockImplementation(
      (_file, _kind, { signal }) =>
        new Promise((_resolve, reject) => {
          signal?.addEventListener("abort", () =>
            reject(uploadCanceledError()),
          );
        }),
    );
    const { result } = renderHook(() => useStartupProcess(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() =>
      result.current.uploadAssignment(
        "mvp",
        new File(["%PDF-1.4"], "model.pdf", { type: "application/pdf" }),
      ),
    );
    await waitFor(() => expect(result.current.uploadPercent).toBe(0));

    act(() => result.current.cancelUpload());

    expect(
      await screen.findByText("Yükleme iptal edildi."),
    ).toBeInTheDocument();
    expect(submitAssignment).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.uploadPercent).toBeNull());
  });

  it("does not hand in a file whose upload was stopped just as it finished", async () => {
    let finish: (
      stored: Awaited<ReturnType<typeof uploadDocumentWithProgress>>,
    ) => void = () => undefined;
    vi.mocked(getStartupProcess).mockResolvedValue(process());
    vi.mocked(uploadDocumentWithProgress).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const { result } = renderHook(() => useStartupProcess(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() =>
      result.current.uploadAssignment(
        "mvp",
        new File(["%PDF-1.4"], "model.pdf", { type: "application/pdf" }),
      ),
    );
    await waitFor(() => expect(uploadDocumentWithProgress).toHaveBeenCalled());

    act(() => {
      result.current.cancelUpload();
      finish({
        id: "doc-1",
        kind: DocumentKind.Homework,
        originalFilename: "model.pdf",
        sizeBytes: 8,
      });
    });

    expect(
      await screen.findByText("Yükleme iptal edildi."),
    ).toBeInTheDocument();
    expect(submitAssignment).not.toHaveBeenCalled();
  });

  it("clears the upload progress when the upload fails", async () => {
    vi.mocked(getStartupProcess).mockResolvedValue(process());
    vi.mocked(uploadDocumentWithProgress).mockImplementation(
      async (_file, _kind, { onProgress }) => {
        onProgress?.(0.5);
        throw new Error("Yükleme ilerlemiyor.");
      },
    );
    const { result } = renderHook(() => useStartupProcess(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() =>
      result.current.uploadAssignment(
        "mvp",
        new File(["%PDF-1.4"], "model.pdf", { type: "application/pdf" }),
      ),
    );

    expect(await screen.findByText("Yükleme ilerlemiyor.")).toBeInTheDocument();
    expect(result.current.uploadPercent).toBeNull();
  });

  it("asks before Kaldır and reopens the Ödev once confirmed", async () => {
    const handedIn = process({
      assignments: [
        processAssignment({
          id: "mvp",
          phaseId: "mvp",
          status: ActionItemStatus.Completed,
          submissionDocumentId: "doc-1",
          submissionFilename: "model.pdf",
          replaceable: true,
        }),
      ],
    });
    vi.mocked(getStartupProcess).mockResolvedValue(handedIn);
    vi.mocked(withdrawSubmission).mockResolvedValue(process());
    const { result } = renderHook(() => useStartupProcess(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.askWithdraw("mvp"));
    expect(result.current.withdrawTarget?.submissionFilename).toBe("model.pdf");
    expect(withdrawSubmission).not.toHaveBeenCalled();
    act(() => result.current.confirmWithdraw());

    expect(
      await screen.findByText("Dosya kaldırıldı; ödev yeniden açık."),
    ).toBeInTheDocument();
    expect(withdrawSubmission).toHaveBeenCalledWith("mvp");
    expect(result.current.withdrawTarget).toBeNull();
    expect(result.current.assignments[0]?.status).toBe(ActionItemStatus.Open);
  });

  it("closes the Kaldır question without removing anything on Vazgeç", async () => {
    vi.mocked(getStartupProcess).mockResolvedValue(process());
    const { result } = renderHook(() => useStartupProcess(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.askWithdraw("mvp"));
    act(() => result.current.cancelWithdraw());

    expect(result.current.withdrawTarget).toBeNull();
    expect(withdrawSubmission).not.toHaveBeenCalled();
  });

  it("shows the backend's reason when Kaldır comes after the due day, and reloads", async () => {
    vi.mocked(getStartupProcess).mockResolvedValue(process());
    vi.mocked(withdrawSubmission).mockRejectedValue(
      new Error(
        "Teslim tarihi geçtiği için bu ödevin dosyası artık değiştirilemez.",
      ),
    );
    const { result } = renderHook(() => useStartupProcess(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.askWithdraw("mvp"));
    act(() => result.current.confirmWithdraw());

    expect(
      await screen.findByText(
        "Teslim tarihi geçtiği için bu ödevin dosyası artık değiştirilemez.",
      ),
    ).toBeInTheDocument();
    await waitFor(() => expect(getStartupProcess).toHaveBeenCalledTimes(2));
    expect(result.current.withdrawTarget).toBeNull();
  });

  it("swaps a handed-in file and says it was replaced", async () => {
    const file = new File(["%PDF-1.4"], "model-v2.pdf", {
      type: "application/pdf",
    });
    vi.mocked(getStartupProcess).mockResolvedValue(process());
    vi.mocked(uploadDocumentWithProgress).mockResolvedValue({
      id: "doc-2",
      kind: DocumentKind.Homework,
      originalFilename: "model-v2.pdf",
      sizeBytes: 8,
    });
    vi.mocked(submitAssignment).mockResolvedValue(process());
    const { result } = renderHook(() => useStartupProcess(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.replaceSubmission("mvp", file));

    expect(
      await screen.findByText("Ödev dosyası değiştirildi."),
    ).toBeInTheDocument();
    expect(uploadDocumentWithProgress).toHaveBeenCalledWith(
      file,
      DocumentKind.Homework,
      expect.objectContaining({ onProgress: expect.any(Function) }),
    );
    expect(submitAssignment).toHaveBeenCalledWith("mvp", "doc-2");
  });

  it("shows the backend's reason when a replace comes after the due day", async () => {
    vi.mocked(getStartupProcess).mockResolvedValue(process());
    vi.mocked(uploadDocumentWithProgress).mockResolvedValue({
      id: "doc-2",
      kind: DocumentKind.Homework,
      originalFilename: "model-v2.pdf",
      sizeBytes: 8,
    });
    vi.mocked(submitAssignment).mockRejectedValue(
      new Error(
        "Teslim tarihi geçtiği için bu ödevin dosyası artık değiştirilemez.",
      ),
    );
    const { result } = renderHook(() => useStartupProcess(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() =>
      result.current.replaceSubmission(
        "mvp",
        new File(["%PDF-1.4"], "late.pdf", { type: "application/pdf" }),
      ),
    );

    expect(
      await screen.findByText(
        "Teslim tarihi geçtiği için bu ödevin dosyası artık değiştirilemez.",
      ),
    ).toBeInTheDocument();
    // The refusal reloads Süreç so the stale "Değiştir" goes away.
    await waitFor(() => expect(getStartupProcess).toHaveBeenCalledTimes(2));
  });

  it("marks a program Ödev that asks for no file done without uploading", async () => {
    const done = process({
      assignments: [assignment("mvp", "mvp", ActionItemStatus.Completed)],
    });
    vi.mocked(getStartupProcess).mockResolvedValue(process());
    vi.mocked(submitAssignment).mockResolvedValue(done);
    const { result } = renderHook(() => useStartupProcess(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.markDone("mvp"));

    await waitFor(() =>
      expect(result.current.assignments[0]?.status).toBe(
        ActionItemStatus.Completed,
      ),
    );
    expect(submitAssignment).toHaveBeenCalledWith("mvp", null);
    expect(uploadDocumentWithProgress).not.toHaveBeenCalled();
    expect(result.current.markingAssignmentId).toBeNull();
    expect(await screen.findByText("Ödev teslim edildi.")).toBeInTheDocument();
  });

  it("says why a hand-in failed", async () => {
    vi.mocked(getStartupProcess).mockResolvedValue(process());
    vi.mocked(submitAssignment).mockRejectedValue(
      new Error("Bu ödev bir dosya yüklenerek teslim edilir."),
    );
    const { result } = renderHook(() => useStartupProcess(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.markDone("mvp"));

    expect(
      await screen.findByText("Bu ödev bir dosya yüklenerek teslim edilir."),
    ).toBeInTheDocument();
  });
});
