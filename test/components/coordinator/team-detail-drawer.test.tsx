import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TeamDetailDrawer } from "@/components/coordinator/team-detail-drawer";
import { Edition } from "@/interfaces/edition";
import { getProgramTeamDetail } from "@/lib/client/coordinator-programs";
import { getFounderChangeOptions } from "@/lib/client/founder-change";
import { getTeamMoveOptions } from "@/lib/client/team-moves";
import { founderChangeOptions } from "@test/fixtures/founder-change";
import { teamMoveOptions } from "@test/fixtures/team-moves";
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

vi.mock("@/lib/client/founder-change", () => ({
  getFounderChangeOptions: vi.fn(),
  changeFounder: vi.fn(),
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
  const onClose = vi.fn<() => void>();
  renderWithQueryClient(
    <TeamDetailDrawer
      programId="program-1"
      organizationId="org-1"
      onCopyCode={vi.fn()}
      onClose={onClose}
    />,
  );
  return { onClose, user: userEvent.setup() };
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

  it("closes only the move dialog on Escape, keeping the drawer open", async () => {
    vi.mocked(getTeamMoveOptions).mockResolvedValue(teamMoveOptions());
    const { onClose, user } = render();
    await screen.findByText("Mert Kaya");
    const [, memberMove] = screen.getAllByRole("button", {
      name: "Başka takıma taşı",
    });
    if (!memberMove) throw new Error("no move button on the member row");
    await user.click(memberMove);
    await screen.findByRole("dialog", { name: "Başka takıma taşı" });

    await user.keyboard("{Escape}");

    expect(
      screen.queryByRole("dialog", { name: "Başka takıma taşı" }),
    ).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("offers changing the founder under the lead, for this drawer's startup", async () => {
    vi.mocked(getFounderChangeOptions).mockResolvedValue(
      founderChangeOptions(),
    );
    const { user } = render();
    await screen.findByText("Mert Kaya");

    await user.click(screen.getByRole("button", { name: "Kurucuyu değiştir" }));

    expect(
      await screen.findByRole("dialog", { name: "Kurucuyu değiştir" }),
    ).toBeInTheDocument();
    expect(getFounderChangeOptions).toHaveBeenCalledWith("org-1");
  });

  it("offers no founder change in the ODTÜ edition", async () => {
    sessionState.edition = Edition.Odtu;
    render();

    expect(await screen.findByText("Mert Kaya")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Kurucuyu değiştir" }),
    ).not.toBeInTheDocument();
  });
});
