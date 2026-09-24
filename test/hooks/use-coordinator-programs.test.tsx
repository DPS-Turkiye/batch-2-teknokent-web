import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCoordinatorProgramList } from "@/hooks/use-coordinator-programs";
import { ProgramLifecycle } from "@/interfaces/coordinator-program";
import { getCoordinatorPrograms } from "@/lib/client/coordinator-programs";
import { ProgramListFilter } from "@/lib/coordinator-programs";
import { coordinatorProgram } from "@test/fixtures/coordinator-programs";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/coordinator-programs", () => ({
  getCoordinatorPrograms: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

describe("useCoordinatorProgramList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCoordinatorPrograms).mockResolvedValue([
      coordinatorProgram({ id: "a", name: "METU Stars 2026" }),
      coordinatorProgram({
        id: "u",
        name: "METU BİGG 2026",
        lifecycle: ProgramLifecycle.Upcoming,
      }),
    ]);
  });

  it("loads the programs without passing the query context along", async () => {
    const { result } = renderHook(() => useCoordinatorProgramList(), {
      wrapper,
    });

    await waitFor(() => expect(result.current.visible).toHaveLength(2));
    expect(getCoordinatorPrograms).toHaveBeenCalledWith();
  });

  it("narrows the list by lifecycle and search", async () => {
    const { result } = renderHook(() => useCoordinatorProgramList(), {
      wrapper,
    });
    await waitFor(() => expect(result.current.visible).toHaveLength(2));

    act(() => result.current.setFilter(ProgramListFilter.Upcoming));
    expect(result.current.visible.map((program) => program.id)).toEqual(["u"]);

    act(() => {
      result.current.setFilter(ProgramListFilter.All);
      result.current.setSearch("stars");
    });
    expect(result.current.visible.map((program) => program.id)).toEqual(["a"]);
  });
});
