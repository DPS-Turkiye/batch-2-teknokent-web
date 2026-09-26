import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MobileNotificationsView } from "@/components/mobile/mobile-notifications-view";
import type { useMobileNotifications } from "@/hooks/use-mobile-notifications";
import { NotificationCategory } from "@/interfaces/notification";

type Notifications = ReturnType<typeof useMobileNotifications>;

const open = vi.fn();
const markAllRead = vi.fn();
let state: Notifications;

vi.mock("@/hooks/use-mobile-notifications", () => ({
  useMobileNotifications: () => state,
}));

const UNREAD = {
  id: "n1",
  title: "Nihan Öztürk mesaj gönderdi",
  body: "Yeni dosyayı inceledim",
  category: NotificationCategory.Message,
  readAt: null,
  createdAt: new Date().toISOString(),
};
const READ = {
  id: "n2",
  title: "Görüşme hatırlatması",
  body: "Ürün Stratejisi · yarın 14:00",
  category: NotificationCategory.MeetingReminder,
  readAt: "2026-09-20T10:00:00Z",
  createdAt: "2026-09-20T09:00:00Z",
};

function notificationsState(
  overrides: Partial<Notifications> = {},
): Notifications {
  return {
    backHref: "/m",
    groups: [
      { label: "Bugün", items: [UNREAD] },
      { label: "Önceki", items: [READ] },
    ],
    hasUnread: true,
    isError: false,
    isLoading: false,
    isMarkingAll: false,
    markAllRead,
    open,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  state = notificationsState();
});

describe("MobileNotificationsView", () => {
  it("groups notifications and marks the unread ones", () => {
    render(<MobileNotificationsView />);

    const today = screen.getByRole("region", { name: "Bugün" });
    expect(within(today).getByText(UNREAD.title)).toBeInTheDocument();
    expect(within(today).getByLabelText("Okunmadı")).toBeInTheDocument();
    const earlier = screen.getByRole("region", { name: "Önceki" });
    expect(within(earlier).queryByLabelText("Okunmadı")).toBeNull();
  });

  it("opens a notification when tapped", async () => {
    render(<MobileNotificationsView />);

    await userEvent.click(
      screen.getByRole("button", { name: /mesaj gönderdi/ }),
    );

    expect(open).toHaveBeenCalledWith(UNREAD);
  });

  it("marks everything read from the top bar", async () => {
    render(<MobileNotificationsView />);

    await userEvent.click(screen.getByRole("button", { name: "Tümü okundu" }));

    expect(markAllRead).toHaveBeenCalled();
  });

  it("hides Tümü okundu when nothing is unread", () => {
    state = notificationsState({ hasUnread: false });
    render(<MobileNotificationsView />);

    expect(screen.queryByRole("button", { name: "Tümü okundu" })).toBeNull();
  });

  it("explains an empty list", () => {
    state = notificationsState({ groups: [], hasUnread: false });
    render(<MobileNotificationsView />);

    expect(screen.getByText("Bildirim yok")).toBeInTheDocument();
  });

  it("goes back home", () => {
    render(<MobileNotificationsView />);

    expect(
      screen.getByRole("link", { name: "Ana sayfaya dön" }),
    ).toHaveAttribute("href", "/m");
  });
});
