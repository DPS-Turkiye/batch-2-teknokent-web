import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Home from "@/app/(public)/page";
import { UserRole } from "@/interfaces/session";

vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({
    isLoading: false,
    session: {
      userId: "mentee-1",
      email: "ayse@example.com",
      fullName: "Ayşe Kaya",
      organizationId: "org-1",
      organizationName: "NovaMed",
      role: UserRole.Mentee,
    },
  }),
}));

describe("Landing page", () => {
  it("takes a signed-in visitor back to their workspace", () => {
    render(<Home />);

    const continueLinks = screen.getAllByRole("link", {
      name: "Ayşe olarak devam et",
    });
    expect(continueLinks).toHaveLength(2);
    continueLinks.forEach((link) =>
      expect(link).toHaveAttribute("href", "/dashboard"),
    );
    expect(
      screen.queryByRole("link", { name: "Giriş Yap" }),
    ).not.toBeInTheDocument();
  });
});
