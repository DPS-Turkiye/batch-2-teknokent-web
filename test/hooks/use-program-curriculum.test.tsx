import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useProgramCurriculum } from "@/hooks/use-program-curriculum";
import { replaceCoordinatorProgramPhases } from "@/lib/client/coordinator-programs";
import {
  coordinatorProgramDetail,
  phase,
} from "@test/fixtures/coordinator-programs";
import { createTestQueryClient, freezeDate, InLocale } from "@test/test-utils";

vi.mock("@/lib/client/coordinator-programs", () => ({
  replaceCoordinatorProgramPhases: vi.fn(),
}));

function renderCurriculum(detail = coordinatorProgramDetail()) {
  const client = createTestQueryClient();
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <InLocale locale="tr">{children}</InLocale>
      </QueryClientProvider>
    );
  }
  return renderHook(() => useProgramCurriculum("program-1", detail), {
    wrapper: Wrapper,
  });
}

it("keeps manual phase entry available without the retired syllabus importer", () => {
  const { result } = renderCurriculum();
  expect(result.current.canAdd).toBe(true);
});

describe("removing a phase", () => {
  const finished = {
    ...phase("phase-1", "Başvuru", 0),
    startDate: "2026-10-01",
    endDate: "2026-10-31",
  };
  const running = {
    ...phase("phase-2", "test", 1),
    startDate: "2026-11-12",
    endDate: "2026-11-19",
  };
  const planned = {
    ...phase("phase-3", "Demo Day", 2),
    startDate: "2026-12-12",
    endDate: "2026-12-12",
  };
  const input = ({ id, name, startDate, endDate }: typeof finished) => ({
    id,
    name,
    startDate,
    endDate,
    expectedOutput: null,
  });

  function renderPhases() {
    const detail = coordinatorProgramDetail();
    detail.program.phases = [finished, running, planned];
    vi.mocked(replaceCoordinatorProgramPhases).mockResolvedValue(detail);
    return renderCurriculum(detail);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    freezeDate("2026-11-17T12:00:00");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("asks before removing the running phase and then saves the list without it", async () => {
    const { result } = renderPhases();
    act(() => result.current.openPhase(1));
    expect(result.current.canRemove).toBe(true);

    act(() => result.current.removeEditing());
    act(() => result.current.removeEditing());
    expect(result.current.confirmingRemoval).toBe(true);
    expect(replaceCoordinatorProgramPhases).not.toHaveBeenCalled();

    act(() => result.current.confirmRemoval());
    await waitFor(() => expect(result.current.editing).toBeNull());
    expect(replaceCoordinatorProgramPhases).toHaveBeenCalledExactlyOnceWith(
      "program-1",
      [input(finished), input(planned)],
      null,
    );
    expect(result.current.confirmingRemoval).toBe(false);
  });

  it("drops the question when the coordinator steps back or opens another phase", () => {
    const { result } = renderPhases();
    act(() => result.current.openPhase(1));
    act(() => result.current.removeEditing());
    act(() => result.current.cancelRemoval());
    expect(result.current.confirmingRemoval).toBe(false);

    act(() => result.current.removeEditing());
    act(() => result.current.openPhase(2));
    expect(result.current.confirmingRemoval).toBe(false);

    act(() => result.current.openPhase(1));
    act(() => result.current.removeEditing());
    act(() => result.current.close());
    act(() => result.current.openPhase(1));
    expect(result.current.confirmingRemoval).toBe(false);
    expect(replaceCoordinatorProgramPhases).not.toHaveBeenCalled();
  });

  it("does not delete without the question having been asked", () => {
    const { result } = renderPhases();
    act(() => result.current.openPhase(1));
    act(() => result.current.confirmRemoval());

    expect(replaceCoordinatorProgramPhases).not.toHaveBeenCalled();
  });

  it("keeps the question open when the save fails, so the coordinator can retry", async () => {
    const { result } = renderPhases();
    vi.mocked(replaceCoordinatorProgramPhases).mockRejectedValue(
      new Error("Sunucu yanıt vermedi"),
    );
    act(() => result.current.openPhase(1));
    act(() => result.current.removeEditing());
    act(() => result.current.confirmRemoval());

    await waitFor(() => expect(result.current.saving).toBe(false));
    expect(replaceCoordinatorProgramPhases).toHaveBeenCalledOnce();
    expect(result.current.editing).not.toBeNull();
    expect(result.current.confirmingRemoval).toBe(true);
  });

  it("never removes a finished phase", () => {
    const { result } = renderPhases();
    act(() => result.current.openPhase(0));
    expect(result.current.canRemove).toBe(false);

    act(() => result.current.removeEditing());
    expect(result.current.confirmingRemoval).toBe(false);
    expect(replaceCoordinatorProgramPhases).not.toHaveBeenCalled();
  });

  it("removes a planned phase without asking, as before", async () => {
    const { result } = renderPhases();
    act(() => result.current.openPhase(2));
    expect(result.current.canRemove).toBe(true);

    act(() => result.current.removeEditing());
    expect(result.current.confirmingRemoval).toBe(false);
    await waitFor(() => expect(result.current.editing).toBeNull());
    expect(replaceCoordinatorProgramPhases).toHaveBeenCalledExactlyOnceWith(
      "program-1",
      [input(finished), input(running)],
      null,
    );
  });

  it("drops the question when the running phase finishes before the answer", () => {
    const { result, rerender } = renderPhases();
    act(() => result.current.openPhase(1));
    act(() => result.current.removeEditing());
    expect(result.current.confirmingRemoval).toBe(true);

    freezeDate("2026-11-20T00:05:00");
    rerender();
    expect(result.current.canRemove).toBe(false);
    expect(result.current.confirmingRemoval).toBe(false);
    act(() => result.current.confirmRemoval());
    expect(replaceCoordinatorProgramPhases).not.toHaveBeenCalled();
  });

  it("has nothing to remove while a new phase is being written", () => {
    const { result } = renderPhases();
    act(() => result.current.openNew());
    expect(result.current.canRemove).toBe(false);

    act(() => result.current.removeEditing());
    expect(replaceCoordinatorProgramPhases).not.toHaveBeenCalled();
  });
});
