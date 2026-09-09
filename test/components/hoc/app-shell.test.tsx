import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/hoc/app-shell";
import { UserRole, type AppSession } from "@/interfaces/session";
import { AppArea } from "@/types/app-area";

const mockuseAppSession = vi.fn<() => AppSession | null>();

vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => mockuseAppSession(),
  useSession: () => ({
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
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
  it("offers a logout control so the session cookie can be replaced", () => {
    mockuseAppSession.mockReturnValue(menteeSession());

    render(
      <AppShell active={AppArea.Home}>
        <p>content</p>
      </AppShell>,
    );

    expect(screen.getByRole("button", { name: "Çıkış" })).toBeInTheDocument();
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
    ).toHaveAttribute("href", "/programs");
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

    const homeLinks = screen.getAllByRole("link", { name: /Ana Sayfa/ });
    expect(homeLinks[0]).toHaveAttribute("href", "/mentor-dashboard");
    expect(screen.queryByText("Mentor Paneli")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Mentörler/ })).toHaveAttribute(
      "href",
      "/mentors",
    );
    expect(
      screen.getByRole("link", { name: /Mentorluklarım/ }),
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
    expect(screen.getByRole("link", { name: /Duyurular/ })).toHaveAttribute(
      "href",
      "/mentor-dashboard#notifications",
    );
    const mentorNav = screen.getByRole("navigation", { name: "Ana menü" });
    expect(
      within(mentorNav).getByRole("link", { name: /Toplantı Asistanı/ }),
    ).toHaveAttribute("href", "/assistant");
    expect(
      screen.queryByRole("link", { name: /Not Defterlerim/ }),
    ).not.toBeInTheDocument();
  });

  it("sends a mentee's home link to /dashboard and hides the mentor panel", () => {
    mockuseAppSession.mockReturnValue(menteeSession());

    render(
      <AppShell active={AppArea.Home}>
        <p>content</p>
      </AppShell>,
    );

    const homeLinks = screen.getAllByRole("link", { name: /Ana Sayfa/ });
    expect(homeLinks[0]).toHaveAttribute("href", "/dashboard");
    expect(screen.queryByText("Mentor Paneli")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Mentörler/ })).toHaveAttribute(
      "href",
      "/mentors",
    );
    expect(
      screen.getByRole("link", { name: /Mentorluklarım/ }),
    ).toHaveAttribute("href", "/mentorships");
    expect(screen.getByRole("link", { name: /Takvim/ })).toHaveAttribute(
      "href",
      "/calendar",
    );
    const menteeNav = screen.getByRole("navigation", { name: "Ana menü" });
    expect(
      within(menteeNav).getByRole("link", { name: /Not Defterlerim/ }),
    ).toHaveAttribute("href", "/notes");
    expect(
      screen.queryByRole("link", { name: /Toplantı Asistanı/ }),
    ).not.toBeInTheDocument();
  });

  it("hides the Duyurular badge when there are no notifications", () => {
    mockuseAppSession.mockReturnValue(menteeSession());

    render(
      <AppShell active={AppArea.Home}>
        <p>content</p>
      </AppShell>,
    );

    const bell = screen.getByRole("link", { name: "Duyurular" });
    expect(bell.querySelector("span")).toBeNull();
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
    ).toHaveAttribute("href", "/profile");

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

    expect(startup.className).toContain("bg-[#fdebdd]");
    expect(mentorships.className).not.toContain("bg-[#fdebdd]");
  });

  it("points the account control at the role-appropriate profile", () => {
    mockuseAppSession.mockReturnValue(menteeSession());
    const { unmount } = render(
      <AppShell active={AppArea.Home}>
        <p>content</p>
      </AppShell>,
    );

    expect(screen.getByRole("link", { name: /Ayşe Kaya/ })).toHaveAttribute(
      "href",
      "/profile",
    );

    unmount();
    mockuseAppSession.mockReturnValue(mentorSession());
    render(
      <AppShell active={AppArea.MentorDashboard}>
        <p>content</p>
      </AppShell>,
    );

    expect(screen.getByRole("link", { name: /Leyla Aksoy/ })).toHaveAttribute(
      "href",
      "/mentor-profile",
    );
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
    const drawerNav = within(drawer as HTMLElement).getByRole("navigation");

    expect(
      within(drawerNav).getByRole("link", { name: /Ana Sayfa/ }),
    ).toHaveAttribute("href", "/dashboard");
    expect(
      within(drawerNav).getByRole("link", { name: /Mentörler/ }),
    ).toHaveAttribute("href", "/mentors");
    expect(
      within(drawerNav).getByRole("link", { name: /Startup’ım/ }),
    ).toHaveAttribute("href", "/profile");
    expect(
      within(drawerNav).getByRole("link", { name: /Not Defterlerim/ }),
    ).toHaveAttribute("href", "/notes");
    expect(
      within(drawerNav).queryByRole("link", { name: /Toplantı Asistanı/ }),
    ).not.toBeInTheDocument();

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
      .closest("aside") as HTMLElement;

    await user.click(within(drawer).getByRole("link", { name: /Takvim/ }));

    expect(
      screen.queryByRole("button", { name: "Menüyü kapat" }),
    ).not.toBeInTheDocument();
  });

  it("gives mentors the meeting assistant in the drawer", async () => {
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
      .closest("aside") as HTMLElement;
    const drawerNav = within(drawer).getByRole("navigation");

    expect(
      within(drawerNav).getByRole("link", { name: /Toplantı Asistanı/ }),
    ).toHaveAttribute("href", "/assistant");
    expect(
      within(drawerNav).getByRole("link", { name: /Mentörler/ }),
    ).toHaveAttribute("href", "/mentors");
    expect(
      within(drawerNav).queryByRole("link", { name: /Not Defterlerim/ }),
    ).not.toBeInTheDocument();
  });
});
