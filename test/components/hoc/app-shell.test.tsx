import { render, screen } from "@testing-library/react";
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
});
