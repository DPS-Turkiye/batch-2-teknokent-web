import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MoveMemberSection } from "@/components/admin/move-member-section";
import { UserAccountStatus, UserRole } from "@/interfaces/session";
import { getPersonSummary } from "@/lib/client/person-summary";
import { menteeSummary } from "@test/fixtures/person-summary";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/person-summary", () => ({
  getPersonSummary: vi.fn(),
}));

vi.mock("@/lib/client/team-moves", () => ({
  getTeamMoveOptions: vi.fn(),
  moveMemberToTeam: vi.fn(),
}));

describe("MoveMemberSection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("offers the move under an approved startup member's profile", async () => {
    vi.mocked(getPersonSummary).mockResolvedValue(
      menteeSummary({ status: UserAccountStatus.Approved }),
    );
    renderWithQueryClient(<MoveMemberSection userId="mentee-1" />);

    expect(await screen.findByText("Takıma taşı")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Başka takıma taşı" }),
    ).toBeInTheDocument();
    expect(getPersonSummary).toHaveBeenCalledWith("mentee-1");
  });

  it("stays away for a mentor", async () => {
    vi.mocked(getPersonSummary).mockResolvedValue(
      menteeSummary({
        role: UserRole.Mentor,
        status: UserAccountStatus.Approved,
      }),
    );
    renderWithQueryClient(<MoveMemberSection userId="mentor-1" />);

    await vi.waitFor(() => expect(getPersonSummary).toHaveBeenCalled());
    expect(screen.queryByText("Takıma taşı")).not.toBeInTheDocument();
  });
});
