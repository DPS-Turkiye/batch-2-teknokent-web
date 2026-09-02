import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TeamSummarySection } from "@/components/profile/team-summary-section";
import type { OrganizationMember } from "@/interfaces/organization-member";

const mockUseOrganizationMembers = vi.fn();

vi.mock("@/hooks/use-organization-members", () => ({
  useOrganizationMembers: () => mockUseOrganizationMembers(),
}));

function member(overrides: Partial<OrganizationMember> = {}) {
  return {
    id: "member-1",
    fullName: "Gülse Buran",
    email: "gulse@dongu.co",
    jobTitle: "CTO",
    ...overrides,
  } as OrganizationMember;
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
  // The Diğer menu used to be the only route to /team. Now that Ekibim lives
  // inside Startup'ım, this is what keeps /team from becoming orphaned.
  it("links to /team so the page is reachable without the Diğer menu", () => {
    mockUseOrganizationMembers.mockReturnValue(membersResult());

    render(<TeamSummarySection />);

    expect(screen.getByRole("link", { name: /Ekibi yönet/ })).toHaveAttribute(
      "href",
      "/team",
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
    ).toHaveAttribute("href", "/team");
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
