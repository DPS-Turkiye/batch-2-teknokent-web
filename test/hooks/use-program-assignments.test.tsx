import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Toaster } from "@/components/common/toaster";
import { useProgramAssignments } from "@/hooks/use-program-assignments";
import { useOpenDocument } from "@/hooks/use-startup-documents";
import {
  createProgramAssignment,
  getProgramAssignments,
} from "@/lib/client/program-assignments";
import { AssignmentDraftProblem } from "@/lib/program-assignments";
import { programAssignment } from "@test/fixtures/program-assignments";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/program-assignments", () => ({
  createProgramAssignment: vi.fn(),
  getProgramAssignments: vi.fn(),
}));
const openDocument = vi.fn();
vi.mock("@/hooks/use-startup-documents", () => ({
  useOpenDocument: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}

const FAR_FUTURE = "2999-12-31";

describe("useProgramAssignments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useOpenDocument).mockReturnValue(openDocument);
    vi.mocked(getProgramAssignments).mockResolvedValue([programAssignment()]);
    vi.mocked(createProgramAssignment).mockResolvedValue(
      programAssignment({ id: "odev-2" }),
    );
  });

  it("lists the program's Ödevler and opens one team's file", async () => {
    const { result } = renderHook(() => useProgramAssignments("program-1"), {
      wrapper,
    });
    await waitFor(() => expect(result.current.assignments).toHaveLength(1));
    expect(getProgramAssignments).toHaveBeenCalledWith("program-1");

    act(() => result.current.toggle("odev-1"));
    expect(result.current.expandedId).toBe("odev-1");
    act(() => result.current.toggle("odev-1"));
    expect(result.current.expandedId).toBeNull();

    result.current.openSubmission("doc-1");
    expect(openDocument).toHaveBeenCalledWith("doc-1");
  });

  it("sends the trimmed draft to every team, then closes and opens the new Ödev", async () => {
    const { result } = renderHook(() => useProgramAssignments("program-1"), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.openForm());
    expect(result.current.canSubmit).toBe(false);
    act(() => result.current.setField("title", "  Pazar araştırması "));
    act(() => result.current.setField("dueDate", FAR_FUTURE));
    act(() => result.current.setField("phaseId", "phase-1"));
    act(() => result.current.setField("fileRequired", true));
    expect(result.current.canSubmit).toBe(true);
    act(() => result.current.submit());

    await waitFor(() => expect(result.current.formOpen).toBe(false));
    expect(createProgramAssignment).toHaveBeenCalledWith("program-1", {
      title: "Pazar araştırması",
      description: null,
      dueDate: FAR_FUTURE,
      phaseId: "phase-1",
      fileRequired: true,
    });
    expect(result.current.expandedId).toBe("odev-2");
    expect(result.current.draft.title).toBe("");
    expect(
      await screen.findByText("Ödev 2 takıma gönderildi."),
    ).toBeInTheDocument();
  });

  it("holds back a draft due before today and says why", async () => {
    const { result } = renderHook(() => useProgramAssignments("program-1"), {
      wrapper,
    });
    act(() => result.current.setField("title", "Pazar"));
    act(() => result.current.setField("dueDate", "2000-01-01"));

    expect(result.current.problem).toBe(AssignmentDraftProblem.DuePassed);
    expect(result.current.canSubmit).toBe(false);
    act(() => result.current.submit());
    expect(createProgramAssignment).not.toHaveBeenCalled();
  });

  it("keeps the title within the backend's limit and forgets the draft on cancel", () => {
    const { result } = renderHook(() => useProgramAssignments("program-1"), {
      wrapper,
    });
    act(() => result.current.openForm());
    act(() => result.current.setField("title", "a".repeat(300)));
    expect(result.current.draft.title).toHaveLength(255);

    act(() => result.current.closeForm());
    expect(result.current.formOpen).toBe(false);
    expect(result.current.draft.title).toBe("");
  });

  it("shows the backend's refusal when the Ödev could not be sent", async () => {
    vi.mocked(createProgramAssignment).mockRejectedValue(
      new Error("Arşivlenmiş bir programa ödev verilemez."),
    );
    const { result } = renderHook(() => useProgramAssignments("program-1"), {
      wrapper,
    });
    act(() => result.current.setField("title", "Pazar"));
    act(() => result.current.submit());

    expect(
      await screen.findByText("Arşivlenmiş bir programa ödev verilemez."),
    ).toBeInTheDocument();
  });
});
