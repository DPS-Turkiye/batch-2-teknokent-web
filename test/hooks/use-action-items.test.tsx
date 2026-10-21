import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useActionItemsForRequests } from "@/hooks/use-action-items";
import type { ActionItem } from "@/interfaces/action-item";
import { getActionItemsForRequests } from "@/lib/client/action-items";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/action-items", () => ({
  getActionItems: vi.fn(),
  getActionItemsForRequests: vi.fn(),
  changeActionItemStatus: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

function item(id: string, requestId: string) {
  return { id, mentorshipRequestId: requestId } as ActionItem;
}

describe("useActionItemsForRequests", () => {
  beforeEach(() => vi.clearAllMocks());

  it("asks once for every request and groups the items in the order of the ids", async () => {
    vi.mocked(getActionItemsForRequests).mockResolvedValue([
      item("a", "r2"),
      item("b", "r1"),
      item("c", "r2"),
    ]);

    const { result } = renderHook(
      () => useActionItemsForRequests(["r1", "r2", "r3"]),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(
      result.current.byRequest.map((items) => items.map((i) => i.id)),
    ).toEqual([["b"], ["a", "c"], []]);
    expect(getActionItemsForRequests).toHaveBeenCalledTimes(1);
    expect(getActionItemsForRequests).toHaveBeenCalledWith(["r1", "r2", "r3"]);
  });

  it("asks nothing without requests", () => {
    const { result } = renderHook(() => useActionItemsForRequests([]), {
      wrapper,
    });

    expect(result.current.byRequest).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(getActionItemsForRequests).not.toHaveBeenCalled();
  });
});
