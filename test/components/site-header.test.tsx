import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SiteHeader } from "@/components/site-header";
import { UserRole, type AppSession } from "@/interfaces/session";
import { SITE_NAV_ITEMS } from "@/lib/const";

let session: AppSession | null = null;

vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({ isLoading: false, session }),
}));

describe("SiteHeader", () => {
  beforeEach(() => {
    session = null;
  });

  it("renders navigation items and action links", () => {
    render(<SiteHeader />);

    SITE_NAV_ITEMS.forEach((item) => {
      const el = screen.getAllByText(item.label)[0];
      expect(el).toBeInTheDocument();
      const anchor = el.closest("a");
      expect(anchor).toHaveAttribute("href", item.href);
    });

    const signIn = screen.getAllByText("Giriş Yap");
    expect(signIn.length).toBeGreaterThanOrEqual(1);
    expect(signIn[0].closest("a")).toHaveAttribute("href", "/login");

    const signUp = screen.getAllByText("Kayıt Ol");
    expect(signUp.length).toBeGreaterThanOrEqual(1);
    // Reported: this pointed at /login, so the landing page offered no route
    // into signup at all. Previously asserted as /login.
    expect(signUp[0].closest("a")).toHaveAttribute("href", "/signup");
  });

  it("offers signed-in visitors their own workspace", () => {
    session = {
      userId: "mentor-1",
      email: "leyla@example.com",
      fullName: "Leyla Aksoy",
      jobTitle: "Mentor",
      role: UserRole.Mentor,
    };

    render(<SiteHeader />);

    const continueLinks = screen.getAllByRole("link", {
      name: "Leyla olarak devam et",
    });
    expect(continueLinks[0]).toHaveAttribute("href", "/mentor-dashboard");
    expect(
      screen.queryByRole("link", { name: "Giriş Yap" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Kayıt Ol" }),
    ).not.toBeInTheDocument();
  });
});
