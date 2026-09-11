import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StartupTabs } from "@/components/startup/startup-tabs";

const mockPathname = vi.fn<() => string>();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

describe("StartupTabs", () => {
  it("marks the tab for the current page", () => {
    mockPathname.mockReturnValue("/startup");

    render(<StartupTabs />);

    const profile = screen.getByRole("link", { name: "Startup Profilim" });
    expect(profile).toHaveAttribute("href", "/startup");
    expect(profile).toHaveAttribute("aria-current", "page");
    expect(profile).toHaveClass("text-[#e86f22]");
  });

  it("leaves every tab unselected on another page", () => {
    mockPathname.mockReturnValue("/startup/elsewhere");

    render(<StartupTabs />);

    expect(
      screen.getByRole("link", { name: "Startup Profilim" }),
    ).not.toHaveAttribute("aria-current");
  });
});
