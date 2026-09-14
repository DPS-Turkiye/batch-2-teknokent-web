import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StartupTeamView } from "@/components/startup/startup-team-view";
import { useStartupTeam } from "@/hooks/use-startup-team";
import { memberFixture } from "@test/fixtures/startup-team";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/hooks/use-startup-team", () => ({ useStartupTeam: vi.fn() }));

const founder = memberFixture("founder", {
  fullName: "Gülse Buran",
  jobTitle: "CEO",
  founder: true,
});
const cto = memberFixture("cto", { joinedAt: null });

type Team = ReturnType<typeof useStartupTeam>;

function state(overrides: Partial<Team> = {}): Team {
  return {
    askRemove: vi.fn(),
    canEdit: () => true,
    canRemove: (member) => !member.founder,
    cancelRemove: vi.fn(),
    closeForm: vi.fn(),
    confirmRemove: vi.fn(),
    draft: null,
    error: null,
    formError: null,
    isLoading: false,
    isRemoving: false,
    isSaving: false,
    members: [founder, cto],
    openAdd: vi.fn(),
    openEdit: vi.fn(),
    removingMember: null,
    setField: vi.fn(),
    submitForm: vi.fn(),
    ...overrides,
  };
}

describe("StartupTeamView", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists the members with their details", () => {
    vi.mocked(useStartupTeam).mockReturnValue(state());
    renderWithQueryClient(<StartupTeamView />);

    expect(screen.getByText("2 ekip üyesi")).toBeInTheDocument();
    const [first, second] = screen.getAllByRole("listitem");
    expect(within(first).getByText("Kurucu")).toBeInTheDocument();
    expect(
      within(first).getByText("CEO · founder@dongu.co"),
    ).toBeInTheDocument();
    expect(
      within(first).getByText("Katılım: 12 Haziran 2026"),
    ).toBeInTheDocument();
    expect(within(second).queryByText(/Katılım/)).not.toBeInTheDocument();
  });

  it("offers removal only where it is allowed", async () => {
    const user = userEvent.setup();
    const team = state();
    vi.mocked(useStartupTeam).mockReturnValue(team);
    renderWithQueryClient(<StartupTeamView />);

    expect(
      screen.queryByRole("button", { name: "Gülse Buran ekipten çıkar" }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Kerem Aksoy ekipten çıkar" }),
    );
    expect(team.askRemove).toHaveBeenCalledWith("cto");
  });

  it("adds and edits members", async () => {
    const user = userEvent.setup();
    const team = state({ canEdit: (member) => member.id === "cto" });
    vi.mocked(useStartupTeam).mockReturnValue(team);
    renderWithQueryClient(<StartupTeamView />);

    expect(
      screen.queryByRole("button", { name: "Gülse Buran düzenle" }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Kerem Aksoy düzenle" }),
    );
    await user.click(screen.getByRole("button", { name: "Ekip Üyesi Ekle" }));

    expect(team.openEdit).toHaveBeenCalledWith(cto);
    expect(team.openAdd).toHaveBeenCalled();
  });

  it("says so when the team is empty", () => {
    vi.mocked(useStartupTeam).mockReturnValue(state({ members: [] }));
    renderWithQueryClient(<StartupTeamView />);

    expect(screen.getByText("0 ekip üyesi")).toBeInTheDocument();
    expect(screen.getByText("Henüz ekip üyesi eklenmedi.")).toBeInTheDocument();
  });
});
