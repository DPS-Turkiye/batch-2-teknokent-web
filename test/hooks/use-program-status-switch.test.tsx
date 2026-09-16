import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "@/components/providers/toast-provider";
import { useProgramStatusSwitch } from "@/hooks/use-programs";
import { type Program, ProgramStatus } from "@/interfaces/program";
import { setProgramStatus } from "@/lib/client/programs";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/programs", () => ({ setProgramStatus: vi.fn() }));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}

function program(status: ProgramStatus): Program {
  return {
    id: "prog-1",
    name: "Seed 2026",
    coordinatorId: "coord-1",
    coordinatorName: "Demo Coordinator",
    createdAt: "2026-09-01T08:00:00Z",
    status,
    startups: [],
    mentors: [],
  };
}

describe("useProgramStatusSwitch", () => {
  beforeEach(() => vi.clearAllMocks());

  it("marks an active program completed", async () => {
    vi.mocked(setProgramStatus).mockResolvedValue(
      program(ProgramStatus.Completed),
    );
    const { result } = renderHook(
      () => useProgramStatusSwitch(program(ProgramStatus.Active)),
      { wrapper },
    );

    expect(result.current.active).toBe(true);
    expect(result.current.label).toBe("Aktif");
    await act(() => result.current.toggle());

    expect(setProgramStatus).toHaveBeenCalledWith(
      "prog-1",
      ProgramStatus.Completed,
    );
    expect(
      await screen.findByText("Seed 2026: Tamamlandı"),
    ).toBeInTheDocument();
  });

  it("reopens a completed program", async () => {
    vi.mocked(setProgramStatus).mockResolvedValue(
      program(ProgramStatus.Active),
    );
    const { result } = renderHook(
      () => useProgramStatusSwitch(program(ProgramStatus.Completed)),
      { wrapper },
    );

    expect(result.current.active).toBe(false);
    expect(result.current.label).toBe("Tamamlandı");
    await act(() => result.current.toggle());

    expect(setProgramStatus).toHaveBeenCalledWith(
      "prog-1",
      ProgramStatus.Active,
    );
  });

  it("shows why the change was refused", async () => {
    vi.mocked(setProgramStatus).mockRejectedValue(
      new Error("Only the program coordinator can change this program."),
    );
    const { result } = renderHook(
      () => useProgramStatusSwitch(program(ProgramStatus.Active)),
      { wrapper },
    );

    await act(() => result.current.toggle());

    expect(
      await screen.findByText(
        "Only the program coordinator can change this program.",
      ),
    ).toBeInTheDocument();
  });
});
