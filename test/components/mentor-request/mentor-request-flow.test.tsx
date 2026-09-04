import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MentorRequestFlow } from "@/components/mentor-request/mentor-request-flow";
import type { StartupContext } from "@/interfaces/startup";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams("step=3"),
}));

vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => ({
    fullName: "Gülse Buran",
    jobTitle: "Kurucu",
  }),
}));

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

const startup: StartupContext = {
  organizationId: "org-1",
  name: "Döngü",
  summary: "Geri dönüşüm platformu",
  sector: "SaaS",
  stage: "MVP",
  teamSize: 3,
  technologies: [],
  confirmedProfile: true,
};

describe("MentorRequestFlow — Info step edit links", () => {
  // Reported: the two Düzenle buttons on the info-review step had no href or
  // handler, so a mentee could not fix outdated startup/team info mid-request.
  it("links Startup Bilgileri's Düzenle to the profile page, opened in a new tab", () => {
    renderWithQueryClient(<MentorRequestFlow mentors={[]} startup={startup} />);

    const links = screen.getAllByRole("link", { name: "Düzenle" });
    expect(links[0]).toHaveAttribute("href", "/profile");
    expect(links[0]).toHaveAttribute("target", "_blank");
  });

  it("links Ekip Üyeleri's Düzenle to the team page, opened in a new tab", () => {
    renderWithQueryClient(<MentorRequestFlow mentors={[]} startup={startup} />);

    const links = screen.getAllByRole("link", { name: "Düzenle" });
    expect(links[1]).toHaveAttribute("href", "/team");
    expect(links[1]).toHaveAttribute("target", "_blank");
  });
});
