import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useClientPagination } from "@/hooks/use-client-pagination";

describe("useClientPagination", () => {
  it("slices items into pages", () => {
    const items = [1, 2, 3, 4, 5, 6, 7];
    const { result } = renderHook(() => useClientPagination(items, 5));

    expect(result.current.totalPages).toBe(2);
    expect(result.current.pageItems).toEqual([1, 2, 3, 4, 5]);

    act(() => result.current.setPage(2));
    expect(result.current.page).toBe(2);
    expect(result.current.pageItems).toEqual([6, 7]);
  });

  it("clamps to the last page when the list shrinks", () => {
    const { result, rerender } = renderHook(
      ({ list }) => useClientPagination(list, 5),
      { initialProps: { list: [1, 2, 3, 4, 5, 6] } },
    );

    act(() => result.current.setPage(2));
    expect(result.current.page).toBe(2);

    rerender({ list: [1, 2] });
    expect(result.current.page).toBe(1);
    expect(result.current.pageItems).toEqual([1, 2]);
  });
});
