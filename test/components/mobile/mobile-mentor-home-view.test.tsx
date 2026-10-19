import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MobileMentorHomeView } from "@/components/mobile/mobile-mentor-home-view";
import type { useMobileMentorHome } from "@/hooks/use-mobile-mentor-home";
import { InLocale } from "@test/test-utils";

type Home = ReturnType<typeof useMobileMentorHome>;

let home: Home;

vi.mock("@/hooks/use-mobile-mentor-home", () => ({
  useMobileMentorHome: () => home,
}));
vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({ session: { fullName: "Nihan Öztürk" } }),
}));

function homeState(overrides: Partial<Home> = {}): Home {
  return {
    firstName: "Nihan",
    hasUnreadNotifications: true,
    isError: false,
    isLoading: false,
    isOnline: true,
    messages: [
      {
        message: {
          id: "r1",
          name: "Atlas AI",
          initials: "AA",
          preview: "Toplantıyı perşembeye alabilir miyiz?",
          time: "10:24",
          href: "/m/messages/mentorship/r1",
        },
        unreadCount: 1,
      },
    ],
    nextMeeting: {
      id: "m1",
      startupName: "Döngü",
      startupInitials: "DÖ",
      detail: "Positioning · 4. görüşme",
      timeLine: "Bugün · 16:30–17:15 · Google Meet",
      href: "/m/calendar?meeting=m1",
    },
    retry: vi.fn(),
    startups: [
      {
        id: "atlas",
        name: "Atlas AI",
        initials: "AA",
        program: "METU Stars 2026",
        next: "Sonraki: Yarın 14:00",
        planned: true,
        href: "/m/startups",
      },
      {
        id: "lumen",
        name: "Lumen",
        initials: "LU",
        program: "BİGG 2026",
        next: "Sonraki görüşme planlanmadı",
        planned: false,
        href: "/m/startups",
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  home = homeState();
});

describe("MobileMentorHomeView in English", () => {
  it("names the card, the sections and the unread badge in English", () => {
    render(
      <InLocale locale="en">
        <MobileMentorHomeView />
      </InLocale>,
    );

    expect(screen.getByRole("heading", { name: "Hi, Nihan" })).toBeVisible();
    const card = screen.getByRole("article", { name: "Next meeting" });
    expect(within(card).getByText("Next Meeting")).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: "Details" })).toBeVisible();
    expect(screen.getByRole("region", { name: "My startups" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Messages" })).toBeVisible();
  });
});

describe("MobileMentorHomeView", () => {
  it("greets the mentor and shows the next meeting's startup with its details link", () => {
    render(<MobileMentorHomeView />);

    expect(
      screen.getByRole("heading", { name: "Merhaba, Nihan" }),
    ).toBeInTheDocument();
    const card = screen.getByRole("article", { name: "Sıradaki görüşme" });
    expect(within(card).getByText("Döngü")).toBeInTheDocument();
    expect(
      within(card).getByText("Bugün · 16:30–17:15 · Google Meet"),
    ).toBeInTheDocument();
    expect(
      within(card).getByRole("link", { name: "Detaylar" }),
    ).toHaveAttribute("href", "/m/calendar?meeting=m1");
  });

  it("lists startups with their program and flags the unplanned one", () => {
    render(<MobileMentorHomeView />);

    const startups = screen.getByRole("region", { name: "Startuplarım" });
    expect(within(startups).getByText("METU Stars 2026")).toBeInTheDocument();
    expect(
      within(startups).getByText("Sonraki görüşme planlanmadı"),
    ).toHaveClass("text-[#b7791f]");
  });

  it("shows startup conversations with unread counts", () => {
    render(<MobileMentorHomeView />);

    const messages = screen.getByRole("region", { name: "Mesajlar" });
    expect(
      within(messages).getByLabelText("1 okunmamış mesaj"),
    ).toBeInTheDocument();
  });

  it("says so when there is no meeting or startup yet", () => {
    home = homeState({ nextMeeting: null, startups: [], messages: [] });
    render(<MobileMentorHomeView />);

    expect(screen.getByText("Planlanmış görüşmen yok.")).toBeInTheDocument();
    expect(
      screen.getByText("Henüz mentorluk yaptığın bir startup yok."),
    ).toBeInTheDocument();
  });

  it("offers a retry when loading fails", () => {
    home = homeState({ isError: true });
    render(<MobileMentorHomeView />);

    expect(
      screen.getByRole("button", { name: "Tekrar dene" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("region")).toBeNull();
  });
});
