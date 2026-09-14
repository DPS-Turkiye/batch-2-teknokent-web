import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StartupTeamView } from "@/components/startup/startup-team-view";
import { useStartupTeam } from "@/hooks/use-startup-team";
import { memberFixture } from "@test/fixtures/startup-team";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/components/startup/startup-page-frame", () => ({
  StartupPageFrame: ({
    action,
    children,
  }: {
    action?: ReactNode;
    children: ReactNode;
  }) => (
    <div>
      {action}
      {children}
    </div>
  ),
  startupPrimaryActionClass: "",
  startupSecondaryActionClass: "",
}));
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

  it("lists the members with their email, join date and role", () => {
    vi.mocked(useStartupTeam).mockReturnValue(state());
    renderWithQueryClient(<StartupTeamView />);

    const [first, second] = screen.getAllByRole("listitem");
    expect(within(first).getByText("CEO · Kurucu")).toBeInTheDocument();
    expect(within(first).getByText("founder@dongu.co")).toBeInTheDocument();
    expect(within(first).getByText("Katılım: 12 Haz 2026")).toBeInTheDocument();
    expect(within(first).getByText("Yönetici")).toBeInTheDocument();
    expect(within(second).getByText("Üye")).toBeInTheDocument();
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
    await user.click(screen.getByRole("button", { name: "Ekip üyesi ekle" }));

    expect(team.openEdit).toHaveBeenCalledWith(cto);
    expect(team.openAdd).toHaveBeenCalled();
  });

  it("says so when the team is empty", () => {
    vi.mocked(useStartupTeam).mockReturnValue(state({ members: [] }));
    renderWithQueryClient(<StartupTeamView />);

    expect(screen.getByText("Henüz ekip üyesi eklenmedi.")).toBeInTheDocument();
  });

  it("reports a team that could not be loaded", () => {
    vi.mocked(useStartupTeam).mockReturnValue(
      state({ error: new Error("Ekip yüklenemedi.") }),
    );
    renderWithQueryClient(<StartupTeamView />);

    expect(screen.getByRole("alert")).toHaveTextContent("Ekip yüklenemedi.");
  });
});
