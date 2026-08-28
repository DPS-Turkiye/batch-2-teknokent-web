import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/hoc/app-shell";
import { UserRole, type DemoSession } from "@/interfaces/session";
import { DASHBOARD_NOTIFICATIONS } from "@/lib/const";
import { AppArea } from "@/types/app-area";

const mockUseDemoSession = vi.fn<() => DemoSession | null>();

vi.mock("@/components/providers/session-provider", () => ({
  useDemoSession: () => mockUseDemoSession(),
}));

function mentorSession(): DemoSession {
  return {
    userId: "mentor-1",
    email: "leyla.aksoy@teknokent.demo",
    fullName: "Leyla Aksoy",
    jobTitle: "Mentor",
    role: UserRole.Mentor,
  };
}

function menteeSession(): DemoSession {
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

describe("AppShell navigation", () => {
  it("sends a mentor's core navigation to the redesigned mentor surfaces", () => {
    mockUseDemoSession.mockReturnValue(mentorSession());

    render(
      <AppShell active={AppArea.MentorDashboard}>
        <p>content</p>
      </AppShell>,
    );

    const homeLinks = screen.getAllByRole("link", { name: /Ana Sayfa/ });
    expect(homeLinks[0]).toHaveAttribute("href", "/mentor-dashboard");
    expect(screen.queryByText("Mentor Paneli")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Mentorluklarım/ }),
    ).toHaveAttribute("href", "/mentor-dashboard#mentorships");
    expect(screen.getByRole("link", { name: /Takvim/ })).toHaveAttribute(
      "href",
      "/calendar",
    );
    expect(screen.getByRole("link", { name: /Duyurular/ })).toHaveAttribute(
      "href",
      "/mentor-dashboard#notifications",
    );
  });

  it("sends a mentee's home link to /dashboard and hides the mentor panel", () => {
    mockUseDemoSession.mockReturnValue(menteeSession());

    render(
      <AppShell active={AppArea.Home}>
        <p>content</p>
      </AppShell>,
    );

    const homeLinks = screen.getAllByRole("link", { name: /Ana Sayfa/ });
    expect(homeLinks[0]).toHaveAttribute("href", "/dashboard");
    expect(screen.queryByText("Mentor Paneli")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Mentorluklarım/ }),
    ).toHaveAttribute("href", "/mentorships");
    expect(screen.getByRole("link", { name: /Takvim/ })).toHaveAttribute(
      "href",
      "/calendar",
    );
  });

  it("shows the real notification count on the Duyurular badge, not a hardcoded number", () => {
    mockUseDemoSession.mockReturnValue(menteeSession());

    render(
      <AppShell active={AppArea.Home}>
        <p>content</p>
      </AppShell>,
    );

    expect(
      screen.getByText(String(DASHBOARD_NOTIFICATIONS.length)),
    ).toBeInTheDocument();
  });

  it("falls back to the mentee home when there is no active session", () => {
    mockUseDemoSession.mockReturnValue(null);

    render(
      <AppShell active={AppArea.Home}>
        <p>content</p>
      </AppShell>,
    );

    const homeLinks = screen.getAllByRole("link", { name: /Ana Sayfa/ });
    expect(homeLinks[0]).toHaveAttribute("href", "/dashboard");
  });

  it("gives mentees a Startup'ım entry and withholds it from mentors", () => {
    mockUseDemoSession.mockReturnValue(menteeSession());
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
    mockUseDemoSession.mockReturnValue(mentorSession());
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

  it("keeps /team reachable from the utility menu so it is never orphaned", () => {
    // Regression guard: the "Ekibim" entry was once repurposed into
    // "Startup'ım" and repointed at /profile, leaving /team with no
    // navigation entry at all.
    mockUseDemoSession.mockReturnValue(menteeSession());

    render(
      <AppShell active={AppArea.Home}>
        <p>content</p>
      </AppShell>,
    );

    const teamLinks = screen
      .getAllByRole("link", { name: /Ekibim/ })
      .map((link) => link.getAttribute("href"));

    expect(teamLinks.length).toBeGreaterThan(0);
    expect(teamLinks).toContain("/team");
  });

  it("marks Startup'ım and Ekibim as separate areas so only one highlights", () => {
    mockUseDemoSession.mockReturnValue(menteeSession());

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
    mockUseDemoSession.mockReturnValue(menteeSession());
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
    mockUseDemoSession.mockReturnValue(mentorSession());
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
    mockUseDemoSession.mockReturnValue(menteeSession());

    render(
      <AppShell active={AppArea.Home}>
        <p>content</p>
      </AppShell>,
    );

    expect(
      screen.queryByRole("button", { name: "Menüyü kapat" }),
    ).not.toBeInTheDocument();
  });

  it("opens with both primary and utility destinations, then closes again", async () => {
    const user = userEvent.setup();
    mockUseDemoSession.mockReturnValue(menteeSession());

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

    // primary destinations
    expect(
      within(drawerNav).getByRole("link", { name: /Ana Sayfa/ }),
    ).toHaveAttribute("href", "/dashboard");
    expect(
      within(drawerNav).getByRole("link", { name: /Startup’ım/ }),
    ).toHaveAttribute("href", "/profile");
    // utility destinations that are not in the top bar
    expect(
      within(drawerNav).getByRole("link", { name: /Ekibim/ }),
    ).toHaveAttribute("href", "/team");
    expect(
      within(drawerNav).getByRole("link", { name: /Not Defterleri/ }),
    ).toHaveAttribute("href", "/notes");

    await user.click(closeButton);
    expect(
      screen.queryByRole("button", { name: "Menüyü kapat" }),
    ).not.toBeInTheDocument();
  });

  it("closes when a destination inside the drawer is chosen", async () => {
    const user = userEvent.setup();
    mockUseDemoSession.mockReturnValue(menteeSession());

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
});
