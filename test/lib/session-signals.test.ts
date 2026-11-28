import { afterEach, describe, expect, it, vi } from "vitest";

import {
  isMarkedSignedOut,
  markSignedIn,
  markSignedOut,
  SIGNED_IN_KEY,
  SIGNED_OUT_KEY,
  subscribeToSessionSignals,
} from "@/lib/session-signals";

afterEach(() => {
  markSignedIn();
  localStorage.clear();
  vi.restoreAllMocks();
});

/** What another tab writing `key` looks like from here. */
function fromAnotherTab(key: string | null, newValue: string | null) {
  window.dispatchEvent(new StorageEvent("storage", { key, newValue }));
}

describe("the signed-out mark", () => {
  it("is set at sign-out and lifted by the next sign-in", () => {
    expect(isMarkedSignedOut()).toBe(false);

    markSignedOut();
    expect(isMarkedSignedOut()).toBe(true);
    expect(localStorage.getItem(SIGNED_OUT_KEY)).not.toBeNull();

    markSignedIn();
    expect(isMarkedSignedOut()).toBe(false);
    expect(localStorage.getItem(SIGNED_IN_KEY)).not.toBeNull();
  });

  it("is seen by every tab, since another tab's sign-out lands in the shared storage", () => {
    localStorage.setItem(SIGNED_OUT_KEY, "1700000000000");

    expect(isMarkedSignedOut()).toBe(true);
  });

  it("still holds in this tab when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    markSignedOut();

    expect(isMarkedSignedOut()).toBe(true);
  });
});

describe("subscribeToSessionSignals", () => {
  it("hears another tab sign out and sign in, and nothing else", () => {
    const onSignedOut = vi.fn();
    const onSignedIn = vi.fn();
    const stop = subscribeToSessionSignals({ onSignedOut, onSignedIn });

    fromAnotherTab(SIGNED_OUT_KEY, "1");
    fromAnotherTab(SIGNED_IN_KEY, "2");
    // The mark lifted at sign-in, someone else's key, and localStorage.clear() are not signals.
    fromAnotherTab(SIGNED_OUT_KEY, null);
    fromAnotherTab("menton_last_workspace", "mentor");
    fromAnotherTab(null, null);

    expect(onSignedOut).toHaveBeenCalledTimes(1);
    expect(onSignedIn).toHaveBeenCalledTimes(1);

    stop();
    fromAnotherTab(SIGNED_OUT_KEY, "3");
    expect(onSignedOut).toHaveBeenCalledTimes(1);
  });
});
