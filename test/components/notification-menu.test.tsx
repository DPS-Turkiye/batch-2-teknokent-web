import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotificationMenu } from "@/components/common/notification-menu";

const markRead = vi.fn().mockResolvedValue(undefined);
const deleteNotification = vi.fn().mockResolvedValue(undefined);
const useNotifications = vi.fn();

vi.mock("@/hooks/use-dashboard-notifications", () => ({
  useDashboardNotifications: () => useNotifications(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  useNotifications.mockReturnValue({
    deleteNotification,
    error: null,
    isLoading: false,
    markRead,
    notifications: [
      {
        id: "notification-1",
        title: "Yeni mesaj",
        body: "Mentorunuz bir mesaj gönderdi.",
        href: "/mentor-request/status?request=1",
        readAt: null,
        createdAt: "2026-09-08T12:00:00Z",
      },
    ],
    unreadCount: 1,
  });
});

describe("NotificationMenu", () => {
  it("opens in place without navigating away", async () => {
    const user = userEvent.setup();
    render(<NotificationMenu />);

    await user.click(screen.getByRole("button", { name: "Bildirimler" }));

    expect(
      screen.getByRole("dialog", { name: "Bildirimler" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Yeni mesaj")).toBeInTheDocument();
  });

  it("marks one notification read and can delete it", async () => {
    const user = userEvent.setup();
    render(<NotificationMenu />);
    await user.click(screen.getByRole("button", { name: "Bildirimler" }));

    await user.click(
      screen.getByRole("button", {
        name: "Okundu olarak işaretle: Yeni mesaj",
      }),
    );
    await user.click(
      screen.getByRole("button", { name: "Bildirimi sil: Yeni mesaj" }),
    );

    expect(markRead).toHaveBeenCalledWith("notification-1");
    expect(deleteNotification).toHaveBeenCalledWith("notification-1");
  });
});
