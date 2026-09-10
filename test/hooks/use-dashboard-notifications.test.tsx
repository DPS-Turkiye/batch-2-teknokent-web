import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDashboardNotifications } from "@/hooks/use-dashboard-notifications";
import {
  deleteNotification,
  getNotifications,
  markNotificationRead,
} from "@/lib/client/notifications";

vi.mock("@/lib/client/notifications", () => ({
  deleteNotification: vi.fn(),
  getNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
}));

const unread = {
  id: "notification-1",
  title: "Yeni mesaj",
  body: "Mentorunuz bir mesaj gönderdi.",
  href: "/mentor-request/status?request=1",
  readAt: null,
  createdAt: "2026-09-08T12:00:00Z",
};

function wrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getNotifications).mockResolvedValue([unread]);
});

describe("useDashboardNotifications", () => {
  it("loads the real feed and derives the unread badge", async () => {
    const { result } = renderHook(() => useDashboardNotifications(), {
      wrapper: wrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.notifications).toEqual([unread]);
    expect(result.current.unreadCount).toBe(1);
  });

  it("updates the cached item after marking it read", async () => {
    vi.mocked(markNotificationRead).mockResolvedValue({
      ...unread,
      readAt: "2026-09-08T12:05:00Z",
    });
    const { result } = renderHook(() => useDashboardNotifications(), {
      wrapper: wrapper(),
    });
    await waitFor(() => expect(result.current.unreadCount).toBe(1));

    await act(() => result.current.markRead(unread.id));

    await waitFor(() => expect(result.current.unreadCount).toBe(0));
  });

  it("removes a deleted notification from the cache", async () => {
    vi.mocked(deleteNotification).mockResolvedValue(undefined);
    const { result } = renderHook(() => useDashboardNotifications(), {
      wrapper: wrapper(),
    });
    await waitFor(() => expect(result.current.notifications).toHaveLength(1));

    await act(() => result.current.deleteNotification(unread.id));

    await waitFor(() => expect(result.current.notifications).toEqual([]));
  });
});
