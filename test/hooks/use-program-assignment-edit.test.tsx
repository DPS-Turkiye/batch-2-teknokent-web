import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Toaster } from "@/components/common/toaster";
import { useProgramAssignmentEdit } from "@/hooks/use-program-assignment-edit";
import { updateProgramAssignment } from "@/lib/client/program-assignments";
import { AssignmentDraftProblem } from "@/lib/program-assignments";
import { programAssignment } from "@test/fixtures/program-assignments";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/program-assignments", () => ({
  updateProgramAssignment: vi.fn(),
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

function renderEdit() {
  return renderHook(() => useProgramAssignmentEdit("program-1"), { wrapper });
}

describe("useProgramAssignmentEdit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateProgramAssignment).mockResolvedValue(programAssignment());
  });

  it("opens on an Ödev with its current text and date, and holds the save until something changes", () => {
    const { result } = renderEdit();
    expect(result.current.editing).toBeNull();
    expect(result.current.canSave).toBe(false);

    act(() => result.current.start(programAssignment({ dueDate: FAR_FUTURE })));
    expect(result.current.draft).toEqual({
      title: "Pazar araştırması",
      description: "Hedef pazarı anlat.",
      dueDate: FAR_FUTURE,
    });
    expect(result.current.canSave).toBe(false);
    act(() => result.current.save());
    expect(updateProgramAssignment).not.toHaveBeenCalled();
  });

  it("saves the trimmed text and a cleared date for every team, then closes and says so", async () => {
    const { result } = renderEdit();
    act(() => result.current.start(programAssignment({ dueDate: FAR_FUTURE })));
    act(() => result.current.setField("title", "  Pazar analizi "));
    act(() => result.current.setField("dueDate", ""));
    expect(result.current.canSave).toBe(true);
    act(() => result.current.save());

    await waitFor(() => expect(result.current.editing).toBeNull());
    expect(updateProgramAssignment).toHaveBeenCalledWith(
      "program-1",
      "odev-1",
      {
        title: "Pazar analizi",
        description: "Hedef pazarı anlat.",
        dueDate: null,
      },
    );
    expect(await screen.findByText("Ödev güncellendi.")).toBeInTheDocument();
  });

  it("keeps an overdue Ödev's own date, refuses another past day, and lets the picker start there", () => {
    const { result } = renderEdit();
    act(() =>
      result.current.start(programAssignment({ dueDate: "2000-01-10" })),
    );
    expect(result.current.minDueDate).toBe("2000-01-10");

    act(() => result.current.setField("title", "Pazar analizi"));
    expect(result.current.problem).toBeNull();
    expect(result.current.canSave).toBe(true);

    act(() => result.current.setField("dueDate", "2000-01-11"));
    expect(result.current.problem).toBe(AssignmentDraftProblem.DuePassed);
    expect(result.current.canSave).toBe(false);
  });

  it("starts the picker today for an Ödev due later, and keeps the title within the backend's limit", () => {
    const { result } = renderEdit();
    act(() => result.current.start(programAssignment({ dueDate: FAR_FUTURE })));
    expect(result.current.minDueDate).not.toBe(FAR_FUTURE);
    expect(result.current.minDueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    act(() => result.current.setField("title", "a".repeat(300)));
    expect(result.current.draft?.title).toHaveLength(255);

    act(() => result.current.cancel());
    expect(result.current.editing).toBeNull();
    expect(result.current.draft).toBeNull();
  });

  it("refreshes the program's Ödevler after a save and holds a blank title", async () => {
    const client = createTestQueryClient();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useProgramAssignmentEdit("program-1"), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    });
    act(() => result.current.start(programAssignment({ dueDate: FAR_FUTURE })));
    act(() => result.current.setField("title", "  "));
    expect(result.current.problem).toBe(AssignmentDraftProblem.TitleRequired);
    expect(result.current.canSave).toBe(false);

    act(() => result.current.setField("title", "Pazar analizi"));
    act(() => result.current.save());
    await waitFor(() => expect(result.current.editing).toBeNull());
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["program-assignments", "program-1"],
    });
  });

  it("neither closes nor saves twice while a save is on its way", async () => {
    let finish: (
      value: ReturnType<typeof programAssignment>,
    ) => void = () => {};
    vi.mocked(updateProgramAssignment).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const { result } = renderEdit();
    act(() => result.current.start(programAssignment({ dueDate: FAR_FUTURE })));
    act(() => result.current.setField("title", "Pazar analizi"));
    act(() => result.current.save());
    await waitFor(() => expect(result.current.saving).toBe(true));

    act(() => result.current.cancel());
    act(() => result.current.save());
    expect(result.current.editing).not.toBeNull();
    expect(updateProgramAssignment).toHaveBeenCalledTimes(1);

    act(() => finish(programAssignment()));
    await waitFor(() => expect(result.current.editing).toBeNull());
  });

  it("stays open and shows the backend's refusal when the edit fails", async () => {
    vi.mocked(updateProgramAssignment).mockRejectedValue(
      new Error("Arşivlenmiş bir programın ödevi düzenlenemez."),
    );
    const { result } = renderEdit();
    act(() => result.current.start(programAssignment({ dueDate: FAR_FUTURE })));
    act(() => result.current.setField("title", "Pazar analizi"));
    act(() => result.current.save());

    expect(
      await screen.findByText("Arşivlenmiş bir programın ödevi düzenlenemez."),
    ).toBeInTheDocument();
    expect(result.current.editing).not.toBeNull();
  });
});
