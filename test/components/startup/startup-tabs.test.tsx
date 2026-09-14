import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StartupTabs } from "@/components/startup/startup-tabs";

const mockPathname = vi.fn<() => string>();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

describe("StartupTabs", () => {
  it("shows the four tabs in order and marks the current page", () => {
    mockPathname.mockReturnValue("/startup");

    render(<StartupTabs />);

    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(
      ["Profil", "Süreç", "Dosyalar", "Ekip"],
    );
    const profile = screen.getByRole("link", { name: "Profil" });
    expect(profile).toHaveAttribute("href", "/startup");
    expect(profile).toHaveAttribute("aria-current", "page");
    expect(profile).toHaveClass("text-[#9e4400]");
    expect(screen.getByRole("link", { name: "Süreç" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("leaves Toplantılar out of the bar", () => {
    mockPathname.mockReturnValue("/startup/meetings");

    render(<StartupTabs />);

    expect(
      screen.queryByRole("link", { name: "Toplantılar" }),
    ).not.toBeInTheDocument();
    for (const link of screen.getAllByRole("link")) {
      expect(link).not.toHaveAttribute("aria-current");
    }
  });

  it.each([
    ["/startup/process", "Süreç"],
    ["/startup/files", "Dosyalar"],
    ["/startup/team", "Ekip"],
  ])("selects the tab for %s", (pathname, label) => {
    mockPathname.mockReturnValue(pathname);

    render(<StartupTabs />);

    expect(screen.getByRole("link", { name: label })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Profil" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
