import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  MobileHomeScreen,
  MobileHomeView,
} from "@/components/mobile/mobile-home-view";
import type { useMobileHome } from "@/hooks/use-mobile-home";
import { UserRole } from "@/interfaces/session";
import { DueTone } from "@/types/mentee-home";

type Home = ReturnType<typeof useMobileHome>;

const retry = vi.fn();
let home: Home;
let role = UserRole.Mentee;

vi.mock("@/hooks/use-mobile-home", () => ({
  useMobileHome: () => home,
}));

vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({ session: { role }, isLoading: false }),
}));

function homeState(overrides: Partial<Home> = {}): Home {
  return {
    firstName: "Gamze",
    hasUnreadNotifications: false,
    isOnline: true,
    isError: false,
    isLoading: false,
    isLoadingTasks: false,
    messages: [
      {
        id: "r1",
        name: "Nihan Öztürk",
        initials: "NÖ",
        preview: "Yeni dosyayı inceledim, iki önerim var",
        time: "Dün",
        href: "/m/messages?conversation=r1",
      },
    ],
    nextMeeting: {
      id: "m1",
      title: "Ürün Stratejisi Görüşmesi",
      whenChip: "Yarın · 14:00",
      mentorName: "Nihan Öztürk",
      mentorInitials: "NÖ",
      mentorDetail: "5. görüşme",
      timeLine: "Perşembe 24 Eylül · 14:00–15:00 · Online",
      href: "/m/calendar?meeting=m1",
    },
    retry,
    tasks: [
      {
        id: "action-1",
        title: "Pitch deck geri bildirimlerini güncelle",
        subtitle: "Nihan Öztürk",
        dueLabel: "Bugün",
        dueTone: DueTone.Today,
        href: "/m/tasks",
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  role = UserRole.Mentee;
  home = homeState();
});

describe("MobileHomeView", () => {
  it("greets the mentee and shows the next meeting with a link to its details", () => {
    render(<MobileHomeView />);

    expect(
      screen.getByRole("heading", { name: "Merhaba, Gamze" }),
    ).toBeInTheDocument();
    const card = screen.getByRole("article", { name: "Sıradaki görüşme" });
    expect(within(card).getByText("Yarın · 14:00")).toBeInTheDocument();
    expect(
      within(card).getByText("Perşembe 24 Eylül · 14:00–15:00 · Online"),
    ).toBeInTheDocument();
    expect(
      within(card).getByRole("link", { name: "Görüşme detayları" }),
    ).toHaveAttribute("href", "/m/calendar?meeting=m1");
  });

  it("lists the tasks and messages with links to their tabs", () => {
    render(<MobileHomeView />);

    const tasks = screen.getByRole("region", { name: "Yapılacaklar" });
    expect(
      within(tasks).getByRole("link", { name: /Pitch deck/ }),
    ).toHaveAttribute("href", "/m/tasks");
    expect(
      within(tasks).getByRole("link", { name: "Tüm yapılacaklar" }),
    ).toHaveAttribute("href", "/m/tasks");
    const messages = screen.getByRole("region", { name: "Mesajlar" });
    expect(
      within(messages).getByRole("link", { name: /Nihan Öztürk/ }),
    ).toHaveAttribute("href", "/m/messages?conversation=r1");
  });

  it("marks the bell when there are unread notifications", () => {
    home = homeState({ hasUnreadNotifications: true });
    render(<MobileHomeView />);

    expect(
      screen.getByRole("link", {
        name: "Bildirimler, okunmamış bildirim var",
      }),
    ).toHaveAttribute("href", "/m/notifications");
  });

  it("says so when nothing is planned, due or written yet", () => {
    home = homeState({ nextMeeting: null, tasks: [], messages: [] });
    render(<MobileHomeView />);

    expect(screen.getByText("Planlanmış görüşmen yok.")).toBeInTheDocument();
    expect(
      screen.getByText("Şu an yapılacak bir şey yok."),
    ).toBeInTheDocument();
    expect(screen.getByText("Henüz mesaj yok.")).toBeInTheDocument();
  });

  it("shows a skeleton while loading", () => {
    home = homeState({ isLoading: true });
    render(<MobileHomeView />);

    expect(
      screen.getByRole("status", { name: "Yükleniyor" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("offers a retry instead of demo data when loading fails", async () => {
    home = homeState({ isError: true });
    render(<MobileHomeView />);

    await userEvent.click(screen.getByRole("button", { name: "Tekrar dene" }));

    expect(retry).toHaveBeenCalled();
    expect(
      screen.queryByRole("article", { name: "Sıradaki görüşme" }),
    ).not.toBeInTheDocument();
  });

  it("warns when the phone is offline", () => {
    home = homeState({ isOnline: false });
    render(<MobileHomeView />);

    expect(screen.getByText("Bağlantı yok")).toBeInTheDocument();
  });
});

describe("MobileHomeScreen", () => {
  it("keeps the placeholder for mentors until their home lands", () => {
    role = UserRole.Mentor;
    render(<MobileHomeScreen />);

    expect(screen.getByText("Ana sayfa hazırlanıyor.")).toBeInTheDocument();
    expect(screen.queryByText("Merhaba, Gamze")).not.toBeInTheDocument();
  });
});
