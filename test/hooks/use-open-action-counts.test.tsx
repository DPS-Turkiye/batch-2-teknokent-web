import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useOpenActionCounts } from "@/hooks/use-open-action-counts";
import { getActionItems } from "@/lib/client/action-items";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/action-items", () => ({
  getActionItems: vi.fn(),
  addActionItem: vi.fn(),
  changeActionItemStatus: vi.fn(),
}));

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

function item(id: string, status: string) {
  return { id, status } as Awaited<ReturnType<typeof getActionItems>>[number];
}

describe("useOpenActionCounts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("counts only open and in-progress items per request", async () => {
    vi.mocked(getActionItems).mockImplementation(async (requestId) =>
      requestId === "r1"
        ? [item("a", "OPEN"), item("b", "IN_PROGRESS"), item("c", "DONE")]
        : [item("d", "DONE")],
    );

    const { result } = renderHook(() => useOpenActionCounts(["r1", "r2"]), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current).toEqual({ r1: 2, r2: 0 }));
    expect(getActionItems).toHaveBeenCalledTimes(2);
  });

  it("counts zero while a request's items are still loading", () => {
    vi.mocked(getActionItems).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useOpenActionCounts(["r1"]), {
      wrapper: Wrapper,
    });

    expect(result.current).toEqual({ r1: 0 });
  });

  it("asks for nothing without requests", () => {
    const { result } = renderHook(() => useOpenActionCounts([]), {
      wrapper: Wrapper,
    });

    expect(result.current).toEqual({});
    expect(getActionItems).not.toHaveBeenCalled();
  });

  it("keeps the same result for a new array with the same ids", async () => {
    vi.mocked(getActionItems).mockResolvedValue([item("a", "OPEN")]);
    const { result, rerender } = renderHook(
      ({ ids }) => useOpenActionCounts(ids),
      { wrapper: Wrapper, initialProps: { ids: ["r1"] } },
    );
    await waitFor(() => expect(result.current).toEqual({ r1: 1 }));
    const first = result.current;

    rerender({ ids: ["r1"] });

    expect(result.current).toBe(first);
  });
});
