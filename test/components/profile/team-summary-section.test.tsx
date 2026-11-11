import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TeamSummarySection } from "@/components/profile/team-summary-section";
import type { OrganizationMember } from "@/interfaces/organization-member";
import { memberFixture } from "@test/fixtures/startup-team";
import { InLocale } from "@test/test-utils";

const mockUseOrganizationMembers = vi.fn();

vi.mock("@/hooks/use-organization-members", () => ({
  useOrganizationMembers: () => mockUseOrganizationMembers(),
}));

function member(
  overrides: Partial<OrganizationMember> = {},
): OrganizationMember {
  return memberFixture("member-1", {
    fullName: "Gülse Buran",
    email: "gulse@dongu.co",
    jobTitle: "CTO",
    ...overrides,
  });
}

function membersResult(overrides: Record<string, unknown> = {}) {
  return {
    data: [] as OrganizationMember[],
    isLoading: false,
    error: null,
    ...overrides,
  };
}

beforeEach(() => mockUseOrganizationMembers.mockReset());

describe("TeamSummarySection", () => {
  it("reads in English", () => {
    mockUseOrganizationMembers.mockReturnValue(
      membersResult({
        data: [1, 2, 3, 4, 5, 6].map((index) =>
          member({ id: `member-${index}` }),
        ),
      }),
    );

    render(
      <InLocale locale="en">
        <TeamSummarySection />
      </InLocale>,
    );

    expect(
      screen.getByRole("heading", { name: "My team" }),
    ).toBeInTheDocument();
    expect(screen.getByText("and 2 more")).toBeInTheDocument();
  });

  // Ekibim lives inside Startup'ım, so this link is the route to /team.
  it("links to /team so the page is reachable without the Diğer menu", () => {
    mockUseOrganizationMembers.mockReturnValue(membersResult());

    render(<TeamSummarySection />);

    expect(screen.getByRole("link", { name: /Ekibi yönet/ })).toHaveAttribute(
      "href",
      "/startup/team",
    );
  });

  it("invites the founder to add members when the team is empty", () => {
    mockUseOrganizationMembers.mockReturnValue(membersResult());

    render(<TeamSummarySection />);

    expect(
      screen.getByText("Henüz eklenmiş bir ekip üyesi yok."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Ekip üyesi davet et/ }),
    ).toHaveAttribute("href", "/startup/team");
  });

  it("lists members with their role and does not show an empty state", () => {
    mockUseOrganizationMembers.mockReturnValue(
      membersResult({ data: [member()] }),
    );

    render(<TeamSummarySection />);

    expect(screen.getByText("Gülse Buran")).toBeInTheDocument();
    expect(screen.getByText(/gulse@dongu.co · CTO/)).toBeInTheDocument();
    expect(
      screen.queryByText("Henüz eklenmiş bir ekip üyesi yok."),
    ).not.toBeInTheDocument();
  });

  it("previews the first four members and counts the rest", () => {
    mockUseOrganizationMembers.mockReturnValue(
      membersResult({
        data: Array.from({ length: 6 }, (_, index) =>
          member({ id: `member-${index}`, fullName: `Üye ${index}` }),
        ),
      }),
    );

    render(<TeamSummarySection />);

    expect(screen.getByText("Üye 0")).toBeInTheDocument();
    expect(screen.getByText("Üye 3")).toBeInTheDocument();
    expect(screen.queryByText("Üye 4")).not.toBeInTheDocument();
    expect(screen.getByText(/ve 2 kişi daha/)).toBeInTheDocument();
  });

  it("surfaces the backend error instead of an empty team", () => {
    mockUseOrganizationMembers.mockReturnValue(
      membersResult({ data: undefined, error: new Error("Ekip yüklenemedi.") }),
    );

    render(<TeamSummarySection />);

    expect(screen.getByText("Ekip yüklenemedi.")).toBeInTheDocument();
    expect(
      screen.queryByText("Henüz eklenmiş bir ekip üyesi yok."),
    ).not.toBeInTheDocument();
  });
});
