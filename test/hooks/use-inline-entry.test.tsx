import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useInlineEntry } from "@/hooks/use-inline-entry";

describe("useInlineEntry", () => {
  it("starts closed and empty, and opens in place", () => {
    const { result } = renderHook(() => useInlineEntry(vi.fn()));

    expect(result.current.open).toBe(false);
    expect(result.current.value).toBe("");

    act(() => result.current.openEntry());
    expect(result.current.open).toBe(true);
  });

  it("hands the trimmed text to onAdd, then closes and clears", () => {
    const onAdd = vi.fn();
    const { result } = renderHook(() => useInlineEntry(onAdd));
    act(() => {
      result.current.openEntry();
      result.current.setValue("  Pazar araştırması ");
    });

    act(() => result.current.submit());

    expect(onAdd).toHaveBeenCalledWith("Pazar araştırması");
    expect(result.current.open).toBe(false);
    expect(result.current.value).toBe("");
  });

  it("adds nothing and stays open for blank text", () => {
    const onAdd = vi.fn();
    const { result } = renderHook(() => useInlineEntry(onAdd));
    act(() => {
      result.current.openEntry();
      result.current.setValue("   ");
    });

    act(() => result.current.submit());

    expect(onAdd).not.toHaveBeenCalled();
    expect(result.current.open).toBe(true);
  });

  it("drops the typed text on cancel", () => {
    const onAdd = vi.fn();
    const { result } = renderHook(() => useInlineEntry(onAdd));
    act(() => {
      result.current.openEntry();
      result.current.setValue("Taslak");
    });

    act(() => result.current.cancel());

    expect(result.current.open).toBe(false);
    expect(result.current.value).toBe("");
    expect(onAdd).not.toHaveBeenCalled();
  });
});
