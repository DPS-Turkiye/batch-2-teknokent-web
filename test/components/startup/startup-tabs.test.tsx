import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StartupTabs } from "@/components/startup/startup-tabs";
import { InLocale } from "@test/test-utils";

const mockPathname = vi.fn<() => string>();

const mockIndividualProgram = vi.fn();

vi.mock("@/hooks/use-individual-program", () => ({
  useIndividualProgram: () => mockIndividualProgram(),
}));

beforeEach(() =>
  mockIndividualProgram.mockReturnValue({
    individual: false,
    isLoading: false,
  }),
);

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

  it("keeps only Süreç and Dosyalar for a student of an individual program", () => {
    mockPathname.mockReturnValue("/startup/process");
    mockIndividualProgram.mockReturnValue({
      individual: true,
      isLoading: false,
    });

    render(<StartupTabs />);

    expect(
      screen.getByRole("navigation", { name: "Proje sekmeleri" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(
      ["Süreç", "Dosyalar"],
    );
  });

  it("shows no tabs until the mentee's program is known", () => {
    mockPathname.mockReturnValue("/startup/process");
    mockIndividualProgram.mockReturnValue({
      individual: false,
      isLoading: true,
    });

    render(<StartupTabs />);

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("reads in English", () => {
    mockPathname.mockReturnValue("/startup/team");

    render(
      <InLocale locale="en">
        <StartupTabs />
      </InLocale>,
    );

    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(
      ["Profile", "Process", "Files", "Team"],
    );
    expect(screen.getByRole("link", { name: "Team" })).toHaveAttribute(
      "aria-current",
      "page",
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
