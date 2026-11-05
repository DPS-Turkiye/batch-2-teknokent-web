import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { ToastProvider } from "@/components/providers/toast-provider";
import { useMenteeProgramSelector } from "@/hooks/use-mentee-program-selector";
import {
  getOrganizationPrograms,
  setActiveProgram,
} from "@/lib/client/programs";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/lib/client/programs", () => ({
  getOrganizationPrograms: vi.fn(),
  setActiveProgram: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}

describe("useMenteeProgramSelector", () => {
  it("does not save when the current program is picked again", async () => {
    vi.mocked(getOrganizationPrograms).mockResolvedValue({
      programs: [
        { id: "p-1", name: "Alpha", coordinatorName: "Elif" },
        { id: "p-2", name: "Beta", coordinatorName: "Burcu" },
      ],
      activeProgramId: "p-1",
    });
    const { result } = renderHook(() => useMenteeProgramSelector(), {
      wrapper,
    });
    await waitFor(() => expect(result.current.visible).toBe(true));

    act(() => result.current.select("p-1"));

    expect(result.current.currentId).toBe("p-1");
    expect(setActiveProgram).not.toHaveBeenCalled();
  });
});
