import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProfileLink } from "@/components/people/profile-link";

const navigation = vi.hoisted(() => ({ pathname: "/admin/users/teams" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

describe("ProfileLink", () => {
  it("reads 'Profili gör', names the person for screen readers, and stays in the admin frame", () => {
    navigation.pathname = "/admin/users/teams";
    render(<ProfileLink userId="u1" name="Ece Kaya" />);

    const link = screen.getByRole("link", { name: "Profili gör: Ece Kaya" });
    expect(link).toHaveTextContent("Profili gör");
    expect(link).toHaveAttribute("href", "/admin/users/u1");
  });

  it("leads coordinators to their own profile page", () => {
    navigation.pathname = "/coordinator/programs/p1/teams";
    render(<ProfileLink userId="u1" name="Ece Kaya" />);

    expect(
      screen.getByRole("link", { name: "Profili gör: Ece Kaya" }),
    ).toHaveAttribute("href", "/coordinator/people/u1");
  });
});
