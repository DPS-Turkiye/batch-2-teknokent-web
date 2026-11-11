import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useOpenActionCounts } from "@/hooks/use-open-action-counts";
import { ActionItemStatus } from "@/interfaces/action-item";
import {
  getActionItems,
  getActionItemsForRequests,
} from "@/lib/client/action-items";
import { menteeActionItemFixture } from "@test/fixtures/mentee-home";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/action-items", () => {
  const getActionItems = vi.fn();
  return {
    getActionItems,
    // The hooks batch through getActionItemsForRequests; it answers from the per-request fixtures,
    // tagging each item with its request so the hooks can group them.
    getActionItemsForRequests: vi.fn(async (ids: string[]) =>
      (
        await Promise.all(
          ids.map(async (id) =>
            ((await getActionItems(id)) ?? []).map((item: object) => ({
              ...item,
              mentorshipRequestId: id,
            })),
          ),
        )
      ).flat(),
    ),
    changeActionItemStatus: vi.fn(),
  };
});

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

function item(id: string, status: ActionItemStatus) {
  return menteeActionItemFixture({ id, status });
}

describe("useOpenActionCounts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("counts only open and in-progress items per request", async () => {
    vi.mocked(getActionItems).mockImplementation(async (requestId) =>
      requestId === "r1"
        ? [
            item("a", ActionItemStatus.Open),
            item("b", ActionItemStatus.InProgress),
            item("c", ActionItemStatus.Completed),
          ]
        : [item("d", ActionItemStatus.Completed)],
    );

    const { result } = renderHook(() => useOpenActionCounts(["r1", "r2"]), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current).toEqual({ r1: 2, r2: 0 }));
    expect(getActionItemsForRequests).toHaveBeenCalledTimes(1);
    expect(getActionItemsForRequests).toHaveBeenCalledWith(["r1", "r2"]);
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
    expect(getActionItemsForRequests).not.toHaveBeenCalled();
  });

  it("keeps the same result for a new array with the same ids", async () => {
    vi.mocked(getActionItems).mockResolvedValue([
      item("a", ActionItemStatus.Open),
    ]);
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
