import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { type AppSession, UserRole } from "@/interfaces/session";
import { InLocale } from "@test/test-utils";

const replace = vi.fn();
let pathname = "/m";
let sessionState: { session: AppSession | null; isLoading: boolean } = {
  session: null,
  isLoading: false,
};

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ replace }),
}));

vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => sessionState,
}));

let unreadTotal = 0;
vi.mock("@/hooks/use-mobile-messages", () => ({
  useMobileConversations: () => ({ unreadTotal }),
}));

function sessionFor(role: AppSession["role"]): AppSession {
  return {
    userId: "user-1",
    email: "gamze@atlasai.co",
    fullName: "Gamze Kozak",
    jobTitle: "Kurucu",
    role,
  };
}

function renderShell() {
  return render(
    <MobileAppShell>
      <p>Ekran içeriği</p>
    </MobileAppShell>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  pathname = "/m";
  unreadTotal = 0;
  sessionState = { session: sessionFor(UserRole.Mentee), isLoading: false };
});

describe("MobileAppShell", () => {
  it("gives a mentee Görevler in the tab bar and highlights the current tab", () => {
    pathname = "/m/tasks";
    renderShell();

    const nav = screen.getByRole("navigation", { name: "Ana menü" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      "Ana Sayfa",
      "Takvim",
      "Görevler",
      "Mesajlar",
    ]);
    expect(within(nav).getByRole("link", { name: "Görevler" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByText("Ekran içeriği")).toBeInTheDocument();
  });

  it("names the tabs in English", () => {
    render(
      <InLocale locale="en">
        <MobileAppShell>
          <p>Screen</p>
        </MobileAppShell>
      </InLocale>,
    );

    const nav = screen.getByRole("navigation", { name: "Main menu" });
    expect(
      within(nav)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(["Home", "Calendar", "Tasks", "Messages"]);
  });

  it("gives a mentor Startuplar instead of Görevler", () => {
    sessionState = { session: sessionFor(UserRole.Mentor), isLoading: false };
    renderShell();

    const nav = screen.getByRole("navigation", { name: "Ana menü" });
    expect(
      within(nav).getByRole("link", { name: "Startuplar" }),
    ).toHaveAttribute("href", "/m/startups");
    expect(within(nav).queryByRole("link", { name: "Görevler" })).toBeNull();
  });

  it("colours the frame with the role accent", () => {
    sessionState = { session: sessionFor(UserRole.Mentor), isLoading: false };
    const { container } = renderShell();

    expect(container.firstElementChild).toHaveStyle({
      "--mobile-accent": "#26a4ff",
    });
  });

  it("sends a mentee who opens the mentor's Startuplar tab home", () => {
    pathname = "/m/startups";
    renderShell();

    expect(replace).toHaveBeenCalledWith("/m");
    expect(screen.queryByText("Ekran içeriği")).not.toBeInTheDocument();
  });

  it("sends a coordinator back to the web pages", () => {
    sessionState = {
      session: sessionFor(UserRole.Coordinator),
      isLoading: false,
    };
    renderShell();

    expect(replace).toHaveBeenCalledWith("/workspace?web=1");
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("shows a skeleton while the session loads", () => {
    sessionState = { session: null, isLoading: true };
    renderShell();

    expect(
      screen.getByRole("status", { name: "Yükleniyor" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Ekran içeriği")).not.toBeInTheDocument();
  });

  it("counts unread messages on the Mesajlar tab", () => {
    unreadTotal = 3;
    renderShell();

    const tab = within(
      screen.getByRole("navigation", { name: "Ana menü" }),
    ).getByRole("link", { name: /Mesajlar/ });
    expect(tab).toHaveTextContent("3");
  });

  it("leaves the tab bar out of a bare screen such as a chat", () => {
    render(
      <MobileAppShell bare>
        <p>Sohbet</p>
      </MobileAppShell>,
    );

    expect(screen.getByText("Sohbet")).toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});
