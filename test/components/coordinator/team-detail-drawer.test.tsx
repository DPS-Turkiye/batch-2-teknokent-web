import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TeamDetailDrawer } from "@/components/coordinator/team-detail-drawer";
import { Edition } from "@/interfaces/edition";
import { getProgramTeamDetail } from "@/lib/client/coordinator-programs";
import { renderWithQueryClient } from "@test/test-utils";

const sessionState: { edition: Edition } = { edition: Edition.Teknokent };

vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => sessionState,
}));

vi.mock("@/components/coordinator/team-phase", () => ({
  TeamPhase: () => null,
}));

vi.mock("@/lib/client/coordinator-programs", () => ({
  getProgramTeamDetail: vi.fn(),
}));

vi.mock("@/lib/client/team-moves", () => ({
  getTeamMoveOptions: vi.fn(),
  moveMemberToTeam: vi.fn(),
}));

function lead() {
  return {
    id: "lead-1",
    name: "Gülse Buran",
    jobTitle: "Kurucu",
    email: "gulse@example.test",
    joinedAt: "2026-09-01T09:00:00Z",
  };
}

function render() {
  renderWithQueryClient(
    <TeamDetailDrawer
      programId="program-1"
      organizationId="org-1"
      onCopyCode={vi.fn()}
      onClose={vi.fn()}
    />,
  );
}

describe("TeamDetailDrawer member moves", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionState.edition = Edition.Teknokent;
    vi.mocked(getProgramTeamDetail).mockResolvedValue({
      organizationId: "org-1",
      name: "Döngü",
      sector: null,
      lead: lead(),
      code: null,
      members: [
        lead(),
        {
          id: "member-1",
          name: "Mert Kaya",
          jobTitle: null,
          email: "mert@example.test",
          joinedAt: "2026-09-02T09:00:00Z",
        },
      ],
      mentorships: [],
    });
  });

  it("offers a move on every member row", async () => {
    render();

    expect(await screen.findByText("Mert Kaya")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Başka takıma taşı" }),
    ).toHaveLength(2);
  });

  it("offers no move in the ODTÜ edition", async () => {
    sessionState.edition = Edition.Odtu;
    render();

    expect(await screen.findByText("Mert Kaya")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Başka takıma taşı" }),
    ).not.toBeInTheDocument();
  });
});
