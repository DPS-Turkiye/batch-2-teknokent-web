import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MentorDashboardView } from "@/components/mentor-dashboard-view";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe("MentorDashboardView", () => {
  it("renders the revised static mentor dashboard", () => {
    renderWithQueryClient(<MentorDashboardView />);

    expect(screen.getByText("Günaydın, Nihan")).toBeInTheDocument();
    expect(screen.getByText("Bugün aksiyon bekleyen")).toBeInTheDocument();
    expect(screen.getByText("Yaklaşan görüşmeler")).toBeInTheDocument();
    expect(screen.getByText("Startup çalışmaları")).toBeInTheDocument();
    expect(screen.getByText("Mentorluk talepleri")).toBeInTheDocument();
    expect(
      screen.getByText("Değerlendirme bekleyen görüşmeler"),
    ).toBeInTheDocument();
  });

  it("expands and collapses the Döngü progress card", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MentorDashboardView />);

    const toggle = screen.getByRole("button", { name: /Döngü.*%68/s });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Atanan işler")).toBeInTheDocument();
    expect(screen.getByText("onboarding-v4.fig")).toBeInTheDocument();

    await user.click(toggle);
    expect(screen.queryByText("Atanan işler")).not.toBeInTheDocument();
  });

  it("opens and closes the mentorship request detail", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MentorDashboardView />);

    await user.click(
      screen.getAllByRole("button", { name: "Talebi incele" })[0],
    );
    expect(
      screen.getByRole("dialog", { name: "Mentorluk talebi" }),
    ).toBeInTheDocument();
    expect(screen.getByText("kavun-metrikler.pdf")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Talep detayını kapat" }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps the quick actions linked to existing mentor routes", () => {
    renderWithQueryClient(<MentorDashboardView />);

    expect(
      screen.getByRole("link", { name: /Toplantı planla.*Mentee/s }),
    ).toHaveAttribute("href", "/mentor-dashboard/calendar");
    expect(
      screen.getByRole("link", { name: /Mesaj gönder.*Aktif/s }),
    ).toHaveAttribute("href", "/mentor-dashboard/messages");
  });
});
