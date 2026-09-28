import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "@/components/providers/toast-provider";
import { useStartupProcess } from "@/hooks/use-startup-process";
import { ActionItemStatus } from "@/interfaces/action-item";
import { DocumentKind } from "@/interfaces/startup-document";
import {
  StartupStage,
  StartupStageState,
  type ProcessAssignment,
  type StartupProcess,
} from "@/interfaces/startup-process";
import { uploadDocument } from "@/lib/client/documents";
import {
  getStartupProcess,
  submitAssignment,
} from "@/lib/client/startup-process";
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
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}

function assignment(
  id: string,
  stage: StartupStage,
  status = ActionItemStatus.Open,
): ProcessAssignment {
  return {
    id,
    roundId: null,
    stage,
    title: "Finansal model",
    description: null,
    status,
    dueDate: null,
    submissionDocumentId: null,
    submissionFilename: null,
    createdAt: "2026-08-10T09:00:00Z",
  };
}

const round = {
  id: "round-1",
  title: "Value proposition & onboarding",
  name: "MVP test turu",
  stage: StartupStage.Mvp,
  startsOn: "2026-08-02",
  endsOn: "2026-08-31",
};

const problemRound = {
  id: "round-0",
  title: "Problem keşfi",
  name: "Problem turu",
  stage: StartupStage.Problem,
  startsOn: "2026-06-12",
  endsOn: "2026-07-08",
};

function process(overrides: Partial<StartupProcess> = {}): StartupProcess {
  return {
    organizationId: "org-1",
    currentStage: StartupStage.Mvp,
    stages: [
      { stage: StartupStage.Problem, state: StartupStageState.Completed },
      { stage: StartupStage.Mvp, state: StartupStageState.Current },
      { stage: StartupStage.Market, state: StartupStageState.Upcoming },
    ],
    currentRound: round,
    rounds: [round, problemRound],
    assignments: [
      assignment("mvp", StartupStage.Mvp),
      assignment("problem", StartupStage.Problem, ActionItemStatus.Completed),
    ],
    ...overrides,
  };
}

describe("useStartupProcess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens on the current stage with its round and Ödevler", async () => {
    vi.mocked(getStartupProcess).mockResolvedValue(process());

    const { result } = renderHook(() => useStartupProcess(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.selectedStage).toBe(StartupStage.Mvp);
    expect(result.current.selectedRound?.name).toBe("MVP test turu");
    expect(result.current.assignments.map((item) => item.id)).toEqual(["mvp"]);
    expect(result.current.stageCards.map((card) => card.percent)).toEqual([
      100, 0, 0,
    ]);
  });

  it("switches the round and Ödevler to a picked stage and leaves Tümü", async () => {
    vi.mocked(getStartupProcess).mockResolvedValue(process());
    const { result } = renderHook(() => useStartupProcess(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.toggleShowAll());
    expect(result.current.assignments).toHaveLength(2);
    act(() => result.current.selectStage(StartupStage.Problem));

    expect(result.current.showAll).toBe(false);
    expect(result.current.selectedRound?.name).toBe("Problem turu");
    expect(result.current.assignments.map((item) => item.id)).toEqual([
      "problem",
    ]);
  });

  it("starts on the first stage when none is current", async () => {
    vi.mocked(getStartupProcess).mockResolvedValue(
      process({ currentStage: null, currentRound: null }),
    );

    const { result } = renderHook(() => useStartupProcess(), { wrapper });

    await waitFor(() =>
      expect(result.current.selectedStage).toBe(StartupStage.Problem),
    );
  });

  it("uploads the file as homework, links it and shows the new process", async () => {
    const file = new File(["%PDF-1.4"], "model.pdf", {
      type: "application/pdf",
    });
    const done = process({
      assignments: [
        assignment("mvp", StartupStage.Mvp, ActionItemStatus.Completed),
      ],
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
      expect(result.current.assignments[0].status).toBe(
        ActionItemStatus.Completed,
      ),
    );
    expect(uploadDocument).toHaveBeenCalledWith(file, DocumentKind.Homework);
    expect(submitAssignment).toHaveBeenCalledWith("mvp", "doc-1");
    expect(result.current.uploadingAssignmentId).toBeNull();
  });
});
