import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMobileNotifications } from "@/hooks/use-mobile-notifications";
import { NotificationCategory } from "@/interfaces/notification";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/client/notifications";
import { createTestQueryClient } from "@test/test-utils";

const push = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/client/notifications", () => ({
  deleteNotification: vi.fn(),
  getNotifications: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
}));

const UNREAD = {
  id: "n1",
  title: "Yeni görev",
  body: "Rakip analizi",
  category: NotificationCategory.TaskAssigned,
  readAt: null,
  createdAt: new Date().toISOString(),
};

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getNotifications).mockResolvedValue([UNREAD]);
  vi.mocked(markNotificationRead).mockResolvedValue({
    ...UNREAD,
    readAt: new Date().toISOString(),
  });
});

describe("useMobileNotifications", () => {
  it("groups the list and knows when something is unread", async () => {
    const { result } = renderHook(() => useMobileNotifications(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.groups[0]?.label).toBe("Bugün");
    expect(result.current.hasUnread).toBe(true);
  });

  it("marks a tapped notification read and opens its phone screen", async () => {
    const { result } = renderHook(() => useMobileNotifications(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.open(UNREAD));

    expect(push).toHaveBeenCalledWith("/m/tasks");
    await waitFor(() =>
      expect(vi.mocked(markNotificationRead).mock.calls[0]?.[0]).toBe("n1"),
    );
  });

  it("marks everything read and reloads the list", async () => {
    vi.mocked(markAllNotificationsRead).mockResolvedValue(undefined);
    const { result } = renderHook(() => useMobileNotifications(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.markAllRead());

    await waitFor(() => expect(markAllNotificationsRead).toHaveBeenCalled());
    await waitFor(() => expect(getNotifications).toHaveBeenCalledTimes(2));
  });
});
