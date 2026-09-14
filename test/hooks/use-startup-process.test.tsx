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
  roundId: string | null,
  status = ActionItemStatus.Open,
): ProcessAssignment {
  return {
    id,
    roundId,
    stage: StartupStage.Finance,
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

function process(overrides: Partial<StartupProcess> = {}): StartupProcess {
  return {
    organizationId: "org-1",
    currentStage: StartupStage.Mvp,
    stages: [{ stage: StartupStage.Mvp, state: StartupStageState.Current }],
    currentRound: round,
    rounds: [round],
    assignments: [
      assignment("in-round", "round-1"),
      assignment("other-round", "round-0"),
    ],
    ...overrides,
  };
}

describe("useStartupProcess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the list to the focus round's Ödevler", async () => {
    vi.mocked(getStartupProcess).mockResolvedValue(process());

    const { result } = renderHook(() => useStartupProcess(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.assignments.map((item) => item.id)).toEqual([
      "in-round",
    ]);
    expect(result.current.currentRound?.name).toBe("MVP test turu");
  });

  it("shows every Ödev when no round is planned", async () => {
    vi.mocked(getStartupProcess).mockResolvedValue(
      process({ currentRound: null, rounds: [] }),
    );

    const { result } = renderHook(() => useStartupProcess(), { wrapper });

    await waitFor(() => expect(result.current.assignments).toHaveLength(2));
  });

  it("uploads the file as homework, links it and shows the new process", async () => {
    const file = new File(["%PDF-1.4"], "model.pdf", {
      type: "application/pdf",
    });
    const done = process({
      assignments: [
        assignment("in-round", "round-1", ActionItemStatus.Completed),
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

    act(() => result.current.uploadAssignment("in-round", file));

    await waitFor(() =>
      expect(result.current.assignments[0].status).toBe(
        ActionItemStatus.Completed,
      ),
    );
    expect(uploadDocument).toHaveBeenCalledWith(file, DocumentKind.Homework);
    expect(submitAssignment).toHaveBeenCalledWith("in-round", "doc-1");
    expect(result.current.uploadingAssignmentId).toBeNull();
  });
});
