import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
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
import { uploadDocument } from "@/lib/client/documents";
import {
  getStartupProcess,
  submitAssignment,
} from "@/lib/client/startup-process";
import { processAssignment } from "@test/fixtures/process-assignments";
import { processPhase, startupProcess } from "@test/fixtures/startup-process";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/startup-process", () => ({
  getStartupProcess: vi.fn(),
  submitAssignment: vi.fn(),
}));

vi.mock("@/lib/client/documents", () => ({
  uploadDocument: vi.fn(),
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
    vi.mocked(uploadDocument).mockResolvedValue({
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
    expect(uploadDocument).toHaveBeenCalledWith(file, DocumentKind.Homework);
    expect(submitAssignment).toHaveBeenCalledWith("mvp", "doc-1");
    expect(result.current.uploadingAssignmentId).toBeNull();
  });
});
