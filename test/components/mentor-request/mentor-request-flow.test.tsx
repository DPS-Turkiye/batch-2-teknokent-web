import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MentorRequestFlow } from "@/components/mentor-request/mentor-request-flow";
import { useOrganizationMembers } from "@/hooks/use-organization-members";
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

vi.mock("@/hooks/use-organization-members", () => ({
  useOrganizationMembers: vi.fn(),
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

describe("MentorRequestFlow team members", () => {
  beforeEach(() => {
    vi.mocked(useOrganizationMembers).mockReturnValue({
      data: [
        {
          id: "user-1",
          email: "sudenaz@example.com",
          fullName: "Sudenaz Yılmaz",
          role: "MENTEE",
          jobTitle: "Mentee",
        },
        {
          id: "user-2",
          email: "ali@example.com",
          fullName: "Ali Veli",
          role: "MENTEE",
          jobTitle: "CTO",
        },
      ],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useOrganizationMembers>);
  });

  it("shows every organization member on the Bilgiler step", () => {
    renderWithQueryClient(<MentorRequestFlow mentors={[]} startup={startup} />);

    const teamSection = screen.getByText("Ekip Üyeleri").closest("section");
    expect(teamSection).not.toBeNull();
    expect(
      within(teamSection!).getByText("Sudenaz Yılmaz"),
    ).toBeInTheDocument();
    expect(within(teamSection!).getByText("Ali Veli")).toBeInTheDocument();
    expect(within(teamSection!).getByText("CTO")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Düzenle" })).toHaveAttribute(
      "href",
      "/team",
    );
  });
});
