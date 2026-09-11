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
    expect(screen.getByRole("link", { name: "Süreç" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("selects Toplantılar on the meetings page", () => {
    mockPathname.mockReturnValue("/startup/meetings");

    render(<StartupTabs />);

    expect(screen.getByRole("link", { name: "Toplantılar" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("selects Dosyalar on the files page", () => {
    mockPathname.mockReturnValue("/startup/files");

    render(<StartupTabs />);

    expect(screen.getByRole("link", { name: "Dosyalar" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("selects Süreç on the process page", () => {
    mockPathname.mockReturnValue("/startup/process");

    render(<StartupTabs />);

    expect(screen.getByRole("link", { name: "Süreç" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: "Startup Profilim" }),
    ).not.toHaveAttribute("aria-current");
  });
});
