import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useMinuteClock } from "@/hooks/use-minute-clock";

afterEach(() => {
  vi.useRealTimers();
});

describe("useMinuteClock", () => {
  it("re-reads the time every minute and stops when unmounted", () => {
    vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
    vi.setSystemTime(new Date("2026-11-13T14:59:00Z"));
    const { result, unmount } = renderHook(() => useMinuteClock());
    expect(result.current.toISOString()).toBe("2026-11-13T14:59:00.000Z");

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(result.current.toISOString()).toBe("2026-11-13T15:00:00.000Z");

    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
