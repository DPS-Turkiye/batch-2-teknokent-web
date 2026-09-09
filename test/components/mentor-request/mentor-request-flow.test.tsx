import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MentorRequestFlow } from "@/components/mentor-request/mentor-request-flow";
import { UserRole } from "@/interfaces/session";
import type { StartupContext } from "@/interfaces/startup";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams("step=3"),
}));

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => ({
    userId: "user-1",
    email: "sudenaz@example.com",
    fullName: "Sudenaz Yılmaz",
    jobTitle: "Mentee",
    role: UserRole.Mentee,
    organizationId: "org-1",
    organizationName: "Team TNT",
  }),
}));

const startup: StartupContext = {
  organizationId: "org-1",
  name: "Team TNT",
  summary: "B2B, SaaS Mentör-Mentee Platformu",
  sector: "",
  stage: "",
  technologies: [],
  confirmedProfile: false,
};

describe("MentorRequestFlow — Hedef step", () => {
  it("opens the Figma İhtiyacını Belirle Hedef step at step 3", () => {
    renderWithQueryClient(<MentorRequestFlow mentors={[]} startup={startup} />);

    expect(
      screen.getByRole("heading", {
        name: "Bu görüşmenin sonunda neyin netleşmesini istersin?",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Ekip Üyeleri")).not.toBeInTheDocument();
    expect(screen.queryByText("Startup Bilgileri")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Bir sonraki adımları belirlemek" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Devam et" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Taslak Olarak Kaydet" }),
    ).toBeInTheDocument();
  });
});
