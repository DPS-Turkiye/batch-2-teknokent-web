import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  MobileEmptyState,
  MobileErrorState,
  MobileOfflineBanner,
} from "@/components/mobile/mobile-states";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { InLocale } from "@test/test-utils";

describe("mobile states", () => {
  it("renders an empty state", () => {
    render(
      <MobileEmptyState
        title="Yaklaşan bir görüşmen bulunmuyor."
        description="Yeni görüşmeler planlandığında burada görünür."
      />,
    );

    expect(
      screen.getByText("Yaklaşan bir görüşmen bulunmuyor."),
    ).toBeInTheDocument();
  });

  it("retries from the error state", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(<MobileErrorState title="Takvim yüklenemedi" onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Bir sorun oluştu. Tekrar dener misin?",
    );
    await user.click(screen.getByRole("button", { name: "Tekrar dene" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("refreshes from the offline banner", async () => {
    const onRefresh = vi.fn();
    const user = userEvent.setup();
    render(<MobileOfflineBanner onRefresh={onRefresh} />);

    expect(screen.getByRole("status")).toHaveTextContent("Bağlantı yok");
    await user.click(screen.getByRole("button", { name: "Yenile" }));
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it("shows the error and offline defaults in English", () => {
    render(
      <InLocale locale="en">
        <MobileErrorState title="Calendar couldn't load" onRetry={vi.fn()} />
        <MobileOfflineBanner onRefresh={vi.fn()} />
      </InLocale>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Something went wrong. Could you try again?",
    );
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("No connection");
    expect(screen.getByRole("button", { name: "Refresh" })).toBeVisible();
  });
});

describe("useOnlineStatus", () => {
  it("follows the browser's online and offline events", () => {
    const online = vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);

    online.mockReturnValue(false);
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current).toBe(false);

    online.mockRestore();
  });
});
