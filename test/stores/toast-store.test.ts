import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useToast, useToastStore } from "@/stores/toast-store";

describe("toast store", () => {
  afterEach(() => vi.useRealTimers());

  it("keeps the four newest toasts and drops each after five seconds", () => {
    vi.useFakeTimers();
    const { showToast } = useToastStore.getState().actions;

    act(() => {
      for (const message of ["1", "2", "3", "4", "5"]) showToast({ message });
    });
    expect(
      useToastStore.getState().toasts.map((toast) => toast.message),
    ).toEqual(["2", "3", "4", "5"]);
    expect(useToastStore.getState().toasts[0].tone).toBe("info");

    act(() => vi.advanceTimersByTime(5_000));
    expect(useToastStore.getState().toasts).toEqual([]);
  });

  it("hands every render the same actions, so callers can depend on them", () => {
    const { result, rerender } = renderHook(() => useToast());
    const first = result.current;

    act(() => result.current.showToast({ message: "Kaydedildi." }));
    rerender();

    expect(result.current).toBe(first);
  });
});
