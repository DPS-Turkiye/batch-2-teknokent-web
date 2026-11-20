import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useAccountDeletedNotice } from "@/hooks/use-account-deleted-notice";
import { ToastTone } from "@/interfaces/toast";
import { accountDeletedHref } from "@/lib/self-deletion";
import { useToastStore } from "@/stores/toast-store";

describe("useAccountDeletedNotice", () => {
  beforeEach(() => useToastStore.setState({ toasts: [] }));
  afterEach(() => window.history.replaceState(null, "", "/"));

  it("says the account was deleted once, and drops the word from the address", () => {
    window.history.replaceState(null, "", accountDeletedHref());

    const { rerender } = renderHook(() => useAccountDeletedNotice());
    rerender();

    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toMatchObject({
      message: "Hesabın silindi. Menton'u kullandığın için teşekkürler.",
      tone: ToastTone.Success,
    });
    expect(window.location.search).toBe("");
  });

  it("says nothing on an ordinary visit", () => {
    window.history.replaceState(null, "", "/?ref=newsletter");

    renderHook(() => useAccountDeletedNotice());

    expect(useToastStore.getState().toasts).toHaveLength(0);
    expect(window.location.search).toBe("?ref=newsletter");
  });
});
