import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotificationMenu } from "@/components/common/notification-menu";
import { InLocale } from "@test/test-utils";

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

  it("reads in English, with the unread count and the date in that language", async () => {
    const user = userEvent.setup();
    render(
      <InLocale locale="en">
        <NotificationMenu />
      </InLocale>,
    );

    await user.click(screen.getByRole("button", { name: "Notifications" }));

    expect(screen.getByText("1 unread notification")).toBeInTheDocument();
    expect(screen.getByText(/Sep 8, 2026/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Mark as read: Yeni mesaj" }),
    ).toBeInTheDocument();
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
