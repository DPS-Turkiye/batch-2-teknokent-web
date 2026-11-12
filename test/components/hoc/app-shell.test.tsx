import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/hoc/app-shell";
import { UserRole, type AppSession } from "@/interfaces/session";
import { AppArea } from "@/types/app-area";
import { InLocale } from "@test/test-utils";

const mockuseAppSession = vi.fn<() => AppSession | null>();
const mockLogout = vi.fn().mockResolvedValue(undefined);

const mockIndividualProgram = vi.fn();

vi.mock("@/hooks/use-individual-program", () => ({
  useIndividualProgram: () => mockIndividualProgram(),
}));

beforeEach(() =>
  mockIndividualProgram.mockReturnValue({
    individual: false,
    isLoading: false,
  }),
);

vi.mock("@/hooks/use-dashboard-notifications", () => ({
  useDashboardNotifications: () => ({
    deleteNotification: vi.fn(),
    error: null,
    isLoading: false,
    markRead: vi.fn(),
    notifications: [],
    unreadCount: 0,
  }),
}));

vi.mock("@/hooks/use-startup-access", async () => {
  const { StartupAccess } = await import("@/lib/startup-access");
  return {
    useStartupAccess: () => ({ access: StartupAccess.Ready, isLoading: false }),
  };
});

vi.mock("@/hooks/use-profile-photo", () => ({
  useProfilePhoto: () => ({
    photoUrl: null,
    isUploading: false,
    upload: vi.fn(),
  }),
}));

vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => mockuseAppSession(),
  useSession: () => ({
    isLoading: false,
    login: vi.fn(),
    logout: mockLogout,
    session: mockuseAppSession(),
  }),
}));

function mentorSession(): AppSession {
  return {
    userId: "mentor-1",
    email: "leyla.aksoy@teknokent.demo",
    fullName: "Leyla Aksoy",
    jobTitle: "Mentor",
    role: UserRole.Mentor,
  };
}

function menteeSession(): AppSession {
  return {
    userId: "mentee-1",
    email: "ayse.kaya@novamed.demo",
    fullName: "Ayşe Kaya",
    jobTitle: "Kurucu & CEO",
    organizationId: "org-1",
    organizationName: "NovaMed AI",
    role: UserRole.Mentee,
  };
}

function adminSession(): AppSession {
  return {
    userId: "admin-1",
    email: "admin@teknokent.demo",
    fullName: "Demo Administrator",
    jobTitle: "Koordinatör",
    role: UserRole.Admin,
  };
}

describe("AppShell navigation", () => {
  it("shows feedback on the dashboard and keeps other pages clear", () => {
    mockuseAppSession.mockReturnValue(menteeSession());
    const { rerender } = render(
      <AppShell active={AppArea.Home}>
        <p>Dashboard</p>
      </AppShell>,
    );
    expect(
      screen.getByRole("button", { name: "Geri bildirim" }),
    ).toBeInTheDocument();
    rerender(
      <AppShell active={AppArea.Calendar}>
        <p>Calendar</p>
      </AppShell>,
    );
    expect(
      screen.queryByRole("button", { name: "Geri bildirim" }),
    ).not.toBeInTheDocument();
  });
  it("uses the revised blue mentor navbar on the mentor home", async () => {
    mockuseAppSession.mockReturnValue(mentorSession());
    const user = userEvent.setup();
    render(
      <AppShell active={AppArea.MentorDashboard} mentorHome>
        <p>Mentor home</p>
      </AppShell>,
    );
    const nav = within(screen.getByRole("navigation", { name: "Ana menü" }));
    expect(screen.getByRole("banner").closest(".mentor-home")).toBeNull();
    expect(screen.getByRole("main")).toHaveClass("mentor-home");
    expect(screen.getByRole("banner")).not.toHaveClass("border-b");
    expect(nav.getAllByRole("link")).toHaveLength(5);
    expect(nav.getByRole("link", { name: "Asistan" })).toHaveAttribute(
      "href",
      "/assistant",
    );
    expect(nav.getByRole("link", { name: "Asistan" })).toHaveAttribute(
      "data-tour",
      "nav-assistant",
    );
    expect(nav.getByRole("link", { name: "Anasayfa" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(nav.getByRole("link", { name: "Mentorlüklerim" })).toHaveAttribute(
      "href",
      "/mentorships",
    );
    expect(nav.getByRole("link", { name: "Anasayfa" })).toHaveClass(
      "bg-[#26a4ff]",
      "text-white",
    );
    await user.click(screen.getByRole("button", { name: "Bildirimler" }));
    expect(
      screen.getByRole("dialog", { name: "Bildirimler" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Bildirimleri kapat" }),
    );
    await user.click(screen.getByRole("button", { name: /Hesap menüsünü aç/ }));
    expect(screen.getByRole("menuitem", { name: "Profilim" })).toHaveAttribute(
      "href",
      "/mentor-profile",
    );
  });

  it("marks Asistan as the mentor's current page on the meeting assistant", () => {
    mockuseAppSession.mockReturnValue(mentorSession());
    render(
      <AppShell active={AppArea.Assistant}>
        <p>Assistant</p>
      </AppShell>,
    );

    const nav = within(screen.getByRole("navigation", { name: "Ana menü" }));
    const assistant = nav.getByRole("link", { name: "Asistan" });
    expect(assistant).toHaveAttribute("aria-current", "page");
    expect(assistant).toHaveClass("bg-[#26a4ff]", "text-white");
  });

  it("gives the meeting assistant a top-bar item to mentors only", () => {
    for (const role of [
      UserRole.Mentee,
      UserRole.Coordinator,
      UserRole.Admin,
    ]) {
      mockuseAppSession.mockReturnValue({ ...mentorSession(), role });
      const { unmount } = render(
        <AppShell active={AppArea.Assistant} menteeHome={false}>
          <p>Assistant</p>
        </AppShell>,
      );
      expect(
        within(
          screen.getByRole("navigation", { name: "Ana menü" }),
        ).queryByRole("link", { name: "Asistan" }),
      ).toBeNull();
      unmount();
    }
  });

  it("uses the revised active pill on the mentor messages page", () => {
    mockuseAppSession.mockReturnValue(mentorSession());
    render(
      <AppShell active={AppArea.Meetings} mentorHome>
        <p>Mentor messages</p>
      </AppShell>,
    );

    const messages = screen.getByRole("link", { name: "Mesajlar" });
    expect(messages).toHaveClass("bg-[#26a4ff]", "text-white");
    expect(messages).not.toHaveClass("min-[1440px]:absolute");
    expect(messages).toHaveAttribute("aria-current", "page");
  });

  beforeEach(() => {
    mockLogout.mockClear();
  });

  it("keeps logout inside the account menu and asks for confirmation", async () => {
    const user = userEvent.setup();
    mockuseAppSession.mockReturnValue(menteeSession());

    render(
      <AppShell active={AppArea.Home}>
        <p>content</p>
      </AppShell>,
    );

    expect(
      screen.queryByRole("button", { name: "Çıkış yap" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Hesap menüsünü aç/ }));
    await user.click(screen.getByRole("menuitem", { name: "Çıkış yap" }));

    expect(
      screen.getByRole("dialog", { name: "Çıkış yapmak istiyor musunuz?" }),
    ).toBeInTheDocument();
    expect(mockLogout).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Vazgeç" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it("opens the account dropdown with the person and their personal profile", async () => {
    const user = userEvent.setup();
    mockuseAppSession.mockReturnValue(menteeSession());

    render(
      <AppShell menteeHome>
        <p>content</p>
      </AppShell>,
    );

    await user.click(screen.getByRole("button", { name: /Hesap menüsünü aç/ }));
    const menu = within(screen.getByRole("menu", { name: "Hesap menüsü" }));

    expect(menu.getByText("ayse.kaya@novamed.demo")).toBeInTheDocument();
    expect(menu.getByRole("menuitem", { name: "Profilim" })).toHaveAttribute(
      "href",
      "/profile/personal",
    );
    await user.click(menu.getByRole("menuitem", { name: "Hesap ayarları" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    const settings = within(
      screen.getByRole("dialog", { name: "Hesap ayarları" }),
    );
    expect(settings.getByText("ayse.kaya@novamed.demo")).toBeInTheDocument();

    await user.click(settings.getByRole("button", { name: "Kapat" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("gives an admin only the applications inbox", () => {
    mockuseAppSession.mockReturnValue(adminSession());

    render(
      <AppShell active={AppArea.Admin}>
        <p>content</p>
      </AppShell>,
    );

    const primaryNav = screen.getByRole("navigation", { name: "Ana menü" });
    expect(
      within(primaryNav).getByRole("link", { name: /Başvurular/ }),
    ).toHaveAttribute("href", "/admin");
    expect(screen.queryByText("Ekibim")).not.toBeInTheDocument();
    expect(screen.queryByText("Startup’ım")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Mentörler/ }),
    ).not.toBeInTheDocument();
  });

  it("gives a coordinator programs and the mentor directory", () => {
    mockuseAppSession.mockReturnValue({
      userId: "coord-1",
      email: "coordinator@teknokent.demo",
      fullName: "Demo Coordinator",
      jobTitle: "Koordinatör",
      role: UserRole.Coordinator,
    });

    render(
      <AppShell active={AppArea.Programs}>
        <p>content</p>
      </AppShell>,
    );

    const primaryNav = screen.getByRole("navigation", { name: "Ana menü" });
    expect(
      within(primaryNav).getByRole("link", { name: /Programlar/ }),
    ).toHaveAttribute("href", "/coordinator/programs");
    expect(
      within(primaryNav).getByRole("link", { name: /Mentörler/ }),
    ).toHaveAttribute("href", "/mentors");
    expect(screen.queryByText("Başvurular")).not.toBeInTheDocument();
    expect(screen.queryByText("Ekibim")).not.toBeInTheDocument();
  });

  it("sends a mentor's core navigation to the redesigned mentor surfaces", () => {
    mockuseAppSession.mockReturnValue(mentorSession());

    render(
      <AppShell active={AppArea.MentorDashboard}>
        <p>content</p>
      </AppShell>,
    );

    const homeLinks = screen.getAllByRole("link", { name: /Anasayfa/ });
    expect(homeLinks[0]).toHaveAttribute("href", "/mentor-dashboard");
    expect(screen.queryByText("Mentor Paneli")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Mentorlüklerim/ }),
    ).toHaveAttribute("href", "/mentorships");
    expect(screen.getByRole("link", { name: /Takvim/ })).toHaveAttribute(
      "href",
      "/mentor-dashboard/calendar",
    );
    // Messaging is its own screen now, not an anchor to the request list.
    expect(screen.getByRole("link", { name: /Mesajlar/ })).toHaveAttribute(
      "href",
      "/mentor-dashboard/messages",
    );
    expect(screen.getByRole("button", { name: "Bildirimler" })).toHaveAttribute(
      "aria-haspopup",
      "dialog",
    );
    const mentorNav = screen.getByRole("navigation", { name: "Ana menü" });
    expect(within(mentorNav).getAllByRole("link")).toHaveLength(5);
    expect(
      screen.queryByRole("link", { name: /Not Defterlerim/ }),
    ).not.toBeInTheDocument();
  });

  it("gives a mentee the revised frame on a page that does not opt in", () => {
    mockuseAppSession.mockReturnValue(menteeSession());

    render(
      <AppShell active={AppArea.Home}>
        <p>content</p>
      </AppShell>,
    );

    const homeLinks = screen.getAllByRole("link", { name: /Anasayfa/ });
    expect(homeLinks[0]).toHaveAttribute("href", "/dashboard");
    expect(screen.queryByText("Mentor Paneli")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Mentorluklarım/ }),
    ).toHaveAttribute("href", "/mentorships");
    expect(screen.getByRole("link", { name: /Takvim/ })).toHaveAttribute(
      "href",
      "/calendar",
    );

    const menteeNav = screen.getByRole("navigation", { name: "Ana menü" });
    expect(
      within(menteeNav)
        .getAllByRole("link")
        .map((link) => link.getAttribute("href")),
    ).toEqual([
      "/dashboard",
      "/mentorships",
      "/calendar",
      "/startup",
      "/messages",
      "/notes",
    ]);
    expect(
      within(menteeNav).queryByRole("link", { name: /Mentörler/ }),
    ).not.toBeInTheDocument();
    expect(
      within(menteeNav).queryByRole("link", { name: /Toplantı Asistanı/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "menton ana sayfa" }),
    ).toHaveAttribute("href", "/dashboard");
  });

  it("lets a page opt out of the revised frame for a mentee", () => {
    mockuseAppSession.mockReturnValue(menteeSession());

    render(
      <AppShell active={AppArea.Home} menteeHome={false}>
        <p>content</p>
      </AppShell>,
    );

    const menteeNav = screen.getByRole("navigation", { name: "Ana menü" });
    expect(
      within(menteeNav).queryByRole("link", { name: /Mentörler/ }),
    ).not.toBeInTheDocument();
    expect(
      within(menteeNav).getByRole("link", { name: /Ana Sayfa/ }),
    ).toHaveAttribute("href", "/dashboard");
    expect(screen.queryByText("metual")).not.toBeInTheDocument();
    expect(screen.getByText("menton")).toBeInTheDocument();
  });

  it("leaves a mentor on a page that does not opt in unchanged", () => {
    mockuseAppSession.mockReturnValue(mentorSession());

    render(
      <AppShell active={AppArea.MentorDashboard}>
        <p>content</p>
      </AppShell>,
    );

    const mentorNav = screen.getByRole("navigation", { name: "Ana menü" });
    expect(within(mentorNav).getAllByRole("link")).toHaveLength(5);
    expect(
      within(mentorNav).getByRole("link", { name: /Mentorlüklerim/ }),
    ).toHaveAttribute("href", "/mentorships");
  });

  it("puts Toplantı Notlarım last on the revised mentee navbar", () => {
    mockuseAppSession.mockReturnValue(menteeSession());

    render(
      <AppShell active={AppArea.Notes} menteeHome>
        <p>content</p>
      </AppShell>,
    );

    const menteeNav = screen.getByRole("navigation", { name: "Ana menü" });
    const menteeLinks = within(menteeNav).getAllByRole("link");
    expect(menteeLinks.map((link) => link.getAttribute("href"))).toEqual([
      "/dashboard",
      "/mentorships",
      "/calendar",
      "/startup",
      "/messages",
      "/notes",
    ]);
    expect(menteeLinks[menteeLinks.length - 1]).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.queryByRole("menuitem", { name: "Toplantı Notlarım" }),
    ).not.toBeInTheDocument();
  });

  it("opens notifications in place instead of linking to another page", () => {
    mockuseAppSession.mockReturnValue(menteeSession());

    render(
      <AppShell active={AppArea.Home}>
        <p>content</p>
      </AppShell>,
    );

    const bell = screen.getByRole("button", { name: "Bildirimler" });
    expect(bell.querySelector("span")).toBeNull();
    expect(bell).not.toHaveAttribute("href");
  });

  it("falls back to the mentee home when there is no active session", () => {
    mockuseAppSession.mockReturnValue(null);

    render(
      <AppShell active={AppArea.Home}>
        <p>content</p>
      </AppShell>,
    );

    const homeLinks = screen.getAllByRole("link", { name: /Ana Sayfa/ });
    expect(homeLinks[0]).toHaveAttribute("href", "/dashboard");
  });

  it("gives a student of an individual program Projem instead of Startup'ım", () => {
    mockuseAppSession.mockReturnValue(menteeSession());
    mockIndividualProgram.mockReturnValue({
      individual: true,
      isLoading: false,
    });
    render(
      <AppShell active={AppArea.Startup}>
        <p>content</p>
      </AppShell>,
    );

    const primaryNav = screen.getByRole("navigation", { name: "Ana menü" });
    expect(
      within(primaryNav).getByRole("link", { name: /Projem/ }),
    ).toHaveAttribute("href", "/startup/process");
    expect(
      within(primaryNav).queryByRole("link", { name: /Startup’ım/ }),
    ).not.toBeInTheDocument();
  });

  it("calls a student a student, not their team of one, on a page with the old frame", () => {
    mockuseAppSession.mockReturnValue(menteeSession());
    mockIndividualProgram.mockReturnValue({
      individual: true,
      isLoading: false,
    });
    render(
      <AppShell menteeHome={false}>
        <p>content</p>
      </AppShell>,
    );

    const account = screen.getByRole("button", { name: /Hesap menüsünü aç/ });
    expect(within(account).getByText("Öğrenci")).toBeInTheDocument();
    expect(within(account).queryByText("NovaMed AI")).not.toBeInTheDocument();
  });

  it("holds the startup entry back until the mentee's program is known", () => {
    mockuseAppSession.mockReturnValue(menteeSession());
    mockIndividualProgram.mockReturnValue({
      individual: false,
      isLoading: true,
    });
    render(
      <AppShell active={AppArea.Home}>
        <p>content</p>
      </AppShell>,
    );

    const primaryNav = screen.getByRole("navigation", { name: "Ana menü" });
    expect(
      within(primaryNav).queryByRole("link", { name: /Startup’ım|Projem/ }),
    ).not.toBeInTheDocument();
    expect(
      within(primaryNav).getByRole("link", { name: /Takvim/ }),
    ).toBeInTheDocument();
  });

  it("gives mentees a Startup'ım entry and withholds it from mentors", () => {
    mockuseAppSession.mockReturnValue(menteeSession());
    const { unmount } = render(
      <AppShell active={AppArea.Home}>
        <p>content</p>
      </AppShell>,
    );

    const primaryNav = screen.getByRole("navigation", { name: "Ana menü" });
    expect(
      within(primaryNav).getByRole("link", { name: /Startup’ım/ }),
    ).toHaveAttribute("href", "/startup");

    unmount();
    mockuseAppSession.mockReturnValue(mentorSession());
    render(
      <AppShell active={AppArea.MentorDashboard}>
        <p>content</p>
      </AppShell>,
    );

    const mentorNav = screen.getByRole("navigation", { name: "Ana menü" });
    expect(
      within(mentorNav).queryByRole("link", { name: /Startup’ım/ }),
    ).not.toBeInTheDocument();
  });

  it("no longer carries a Diğer menu of utility destinations", () => {
    mockuseAppSession.mockReturnValue(menteeSession());

    render(
      <AppShell active={AppArea.Home}>
        <p>content</p>
      </AppShell>,
    );

    // Ekibim moved into Startup'ım and the three meeting entries were already
    // covered by Takvim and Mesajlar, so the dropdown has nothing left to hold.
    // /team stays reachable from the profile page — see the profile view test.
    expect(screen.queryByText("Diğer")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Ekibim/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Aksiyonlar/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Dosyalar/ }),
    ).not.toBeInTheDocument();
  });

  it("marks Startup'ım as active without a competing Ekibim area", () => {
    mockuseAppSession.mockReturnValue(menteeSession());

    render(
      <AppShell active={AppArea.Startup}>
        <p>content</p>
      </AppShell>,
    );

    const primaryNav = screen.getByRole("navigation", { name: "Ana menü" });
    const startup = within(primaryNav).getByRole("link", {
      name: /Startup’ım/,
    });
    const mentorships = within(primaryNav).getByRole("link", {
      name: /Mentorluklarım/,
    });

    expect(startup.className).toContain("bg-[#e5701d]");
    expect(mentorships.className).not.toContain("bg-[#e5701d]");
  });

  it("points the account menu at the role-appropriate profile", async () => {
    const user = userEvent.setup();
    mockuseAppSession.mockReturnValue(menteeSession());
    const { unmount } = render(
      <AppShell active={AppArea.Home}>
        <p>content</p>
      </AppShell>,
    );

    await user.click(screen.getByRole("button", { name: /Ayşe Kaya/ }));
    expect(screen.getByRole("menuitem", { name: "Profilim" })).toHaveAttribute(
      "href",
      "/profile/personal",
    );
    expect(
      screen.queryByRole("menuitem", { name: "Toplantı Notlarım" }),
    ).not.toBeInTheDocument();

    unmount();
    mockuseAppSession.mockReturnValue(mentorSession());
    render(
      <AppShell active={AppArea.MentorDashboard}>
        <p>content</p>
      </AppShell>,
    );

    await user.click(screen.getByRole("button", { name: /Leyla Aksoy/ }));
    expect(screen.getByRole("menuitem", { name: "Profilim" })).toHaveAttribute(
      "href",
      "/mentor-profile",
    );
    expect(
      screen.queryByRole("menuitem", { name: "Toplantı Notlarım" }),
    ).not.toBeInTheDocument();
  });
});

describe("AppShell mobile drawer", () => {
  it("stays closed until the menu button is pressed", () => {
    mockuseAppSession.mockReturnValue(menteeSession());

    render(
      <AppShell active={AppArea.Home}>
        <p>content</p>
      </AppShell>,
    );

    expect(
      screen.queryByRole("button", { name: "Menüyü kapat" }),
    ).not.toBeInTheDocument();
  });

  it("opens with the primary destinations, then closes again", async () => {
    const user = userEvent.setup();
    mockuseAppSession.mockReturnValue(menteeSession());

    render(
      <AppShell active={AppArea.Home}>
        <p>content</p>
      </AppShell>,
    );

    await user.click(screen.getByRole("button", { name: "Menüyü aç" }));

    const closeButton = screen.getByRole("button", { name: "Menüyü kapat" });
    expect(closeButton).toBeInTheDocument();

    const drawer = closeButton.closest("aside");
    expect(drawer).not.toBeNull();
    const drawerNav = within(drawer!).getByRole("navigation");

    expect(
      within(drawerNav).getByRole("link", { name: /Anasayfa/ }),
    ).toHaveAttribute("href", "/dashboard");
    expect(
      within(drawerNav).getByRole("link", { name: /Startup’ım/ }),
    ).toHaveAttribute("href", "/startup");
    expect(
      within(drawerNav).queryByRole("link", { name: /Not Defterlerim/ }),
    ).not.toBeInTheDocument();
    expect(
      within(drawerNav).queryByRole("link", { name: /Mentörler/ }),
    ).not.toBeInTheDocument();
    expect(
      within(drawerNav).queryByRole("link", { name: /Toplantı Asistanı/ }),
    ).not.toBeInTheDocument();
    const drawerLinks = within(drawerNav).getAllByRole("link");
    expect(drawerLinks[drawerLinks.length - 1]).toHaveAttribute(
      "href",
      "/notes",
    );
    expect(drawerLinks[drawerLinks.length - 1]).toHaveTextContent(
      "Toplantı Notlarım",
    );

    await user.click(closeButton);
    expect(
      screen.queryByRole("button", { name: "Menüyü kapat" }),
    ).not.toBeInTheDocument();
  });

  it("closes when a destination inside the drawer is chosen", async () => {
    const user = userEvent.setup();
    mockuseAppSession.mockReturnValue(menteeSession());

    render(
      <AppShell active={AppArea.Home}>
        <p>content</p>
      </AppShell>,
    );

    await user.click(screen.getByRole("button", { name: "Menüyü aç" }));
    const drawer = screen
      .getByRole("button", { name: "Menüyü kapat" })
      .closest("aside")!;

    await user.click(within(drawer).getByRole("link", { name: /Takvim/ }));

    expect(
      screen.queryByRole("button", { name: "Menüyü kapat" }),
    ).not.toBeInTheDocument();
  });

  it("uses the five revised mentor destinations in the drawer", async () => {
    const user = userEvent.setup();
    mockuseAppSession.mockReturnValue(mentorSession());

    render(
      <AppShell active={AppArea.MentorDashboard}>
        <p>content</p>
      </AppShell>,
    );

    await user.click(screen.getByRole("button", { name: "Menüyü aç" }));
    const drawer = screen
      .getByRole("button", { name: "Menüyü kapat" })
      .closest("aside")!;
    const drawerNav = within(drawer).getByRole("navigation");

    expect(within(drawerNav).getAllByRole("link")).toHaveLength(5);
    expect(
      within(drawerNav).getByRole("link", { name: /Mentorlüklerim/ }),
    ).toHaveAttribute("href", "/mentorships");
    expect(
      within(drawerNav).getByRole("link", { name: /Asistan/ }),
    ).toHaveAttribute("href", "/assistant");
    expect(
      within(drawerNav).queryByRole("link", { name: /Not Defterlerim/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Toplantı Notlarım/ }),
    ).not.toBeInTheDocument();
  });
});

describe("AppShell in English", () => {
  it("names the navigation, account menu and logout in English", async () => {
    mockuseAppSession.mockReturnValue(menteeSession());
    const user = userEvent.setup();
    render(
      <InLocale locale="en">
        <AppShell active={AppArea.Mentorships}>
          <p>Mentee page</p>
        </AppShell>
      </InLocale>,
    );

    const nav = screen.getByRole("navigation", { name: "Main menu" });
    expect(
      within(nav).getByRole("link", { name: "Mentorships" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(nav).getByRole("link", { name: "Startup" }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Ayşe Kaya · Open account menu" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "Sign out" }));
    expect(
      screen.getByRole("dialog", { name: "Do you want to sign out?" }),
    ).toBeInTheDocument();
  });
});
