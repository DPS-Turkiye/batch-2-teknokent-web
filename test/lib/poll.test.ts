import { afterEach, describe, expect, it, vi } from "vitest";

import {
  isIdle,
  isPolledQuery,
  POLL_INTERVAL,
  polling,
  recordActivity,
  whenVisible,
} from "@/lib/poll";

const MINUTE = 60_000;

function setHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", {
    configurable: true,
    get: () => hidden,
  });
}

afterEach(() => {
  recordActivity();
  setHidden(false);
});

describe("polling", () => {
  it("polls at the given interval while the user is active", () => {
    recordActivity();
    expect(polling(POLL_INTERVAL.messages).refetchInterval()).toBe(15_000);
  });

  it("slows down four times after two idle minutes", () => {
    recordActivity(Date.now() - 3 * MINUTE);
    expect(isIdle()).toBe(true);
    expect(polling(POLL_INTERVAL.chat).refetchInterval()).toBe(40_000);
  });

  it("tags the query so a return from idle can refresh it", () => {
    expect(isPolledQuery(polling(POLL_INTERVAL.background))).toBe(true);
    expect(isPolledQuery({ meta: undefined })).toBe(false);
  });
});

describe("recordActivity", () => {
  it("reports the end of an idle stretch only once", () => {
    recordActivity(Date.now() - 3 * MINUTE);
    expect(recordActivity()).toBe(true);
    expect(recordActivity()).toBe(false);
  });
});

describe("whenVisible", () => {
  it("skips ticks while the tab is hidden", () => {
    const tick = vi.fn();
    const guarded = whenVisible(tick);

    setHidden(true);
    guarded();
    expect(tick).not.toHaveBeenCalled();

    setHidden(false);
    guarded();
    expect(tick).toHaveBeenCalledTimes(1);
  });
});
