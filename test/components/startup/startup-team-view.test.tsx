import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StartupTeamView } from "@/components/startup/startup-team-view";
import { usePendingMembers } from "@/hooks/use-pending-members";
import { useStartupTeam } from "@/hooks/use-startup-team";
import { useTeamChanges } from "@/hooks/use-team-changes";
import {
  type TeamChange,
  TeamChangeKind,
  TeamChangeStatus,
} from "@/interfaces/team-change";
import { memberFixture } from "@test/fixtures/startup-team";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

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
vi.mock("@/components/startup/startup-invite-code", () => ({
  StartupInviteCode: () => <section>Davet kodu</section>,
}));
vi.mock("@/hooks/use-pending-members", () => ({ usePendingMembers: vi.fn() }));
vi.mock("@/hooks/use-team-changes", () => ({ useTeamChanges: vi.fn() }));

const pendingEce = {
  id: "p1",
  fullName: "Ece Kaya",
  jobTitle: "CTO",
  email: null,
  createdAt: "2026-09-21T10:00:00Z",
};

function pendingState(
  overrides: Partial<ReturnType<typeof usePendingMembers>> = {},
) {
  vi.mocked(usePendingMembers).mockReturnValue({
    pending: [],
    remove: vi.fn(),
    removingId: null,
    ...overrides,
  });
}

type Changes = ReturnType<typeof useTeamChanges>;

function changesState(overrides: Partial<Changes> = {}): Changes {
  const value: Changes = {
    alone: false,
    canLeave: false,
    cancel: vi.fn(),
    cancellingId: null,
    changeFor: () => null,
    closeLeave: vi.fn(),
    confirmLeave: vi.fn(),
    confirmingLeave: false,
    inProgram: true,
    isLeaving: false,
    myChange: null,
    openLeave: vi.fn(),
    refresh: vi.fn(),
    requestedByMe: () => false,
    setSuccessorId: vi.fn(),
    successorId: "",
    successors: [],
    viewerIsLeader: false,
    ...overrides,
  };
  vi.mocked(useTeamChanges).mockReturnValue(value);
  return value;
}

function teamChange(overrides: Partial<TeamChange> = {}): TeamChange {
  return {
    id: "tc-1",
    kind: TeamChangeKind.Leave,
    status: TeamChangeStatus.Pending,
    organizationId: "org-1",
    organizationName: "Döngü",
    memberId: "cto",
    memberName: "Kerem Aksoy",
    memberEmail: "cto@dongu.co",
    requestedById: "cto",
    requestedByName: "Kerem Aksoy",
    createdAt: "2026-11-04T09:00:00Z",
    ...overrides,
  };
}

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
    removalNeedsApproval: false,
    removingMember: null,
    setField: vi.fn(),
    submitForm: vi.fn(),
    viewerIsFounder: true,
    ...overrides,
  };
}

describe("StartupTeamView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pendingState();
    changesState();
  });

  it("shows the invite code to the founder, who is the only one allowed it", () => {
    vi.mocked(useStartupTeam).mockReturnValue(state({ viewerIsFounder: true }));
    renderWithQueryClient(<StartupTeamView />);

    expect(screen.getByText("Davet kodu")).toBeInTheDocument();
  });

  it("withholds the invite code from a member who is not the founder", () => {
    vi.mocked(useStartupTeam).mockReturnValue(
      state({ viewerIsFounder: false }),
    );
    renderWithQueryClient(<StartupTeamView />);

    expect(screen.queryByText("Davet kodu")).not.toBeInTheDocument();
  });

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

  it("reads in English", () => {
    vi.mocked(useStartupTeam).mockReturnValue(state());
    renderWithQueryClient(
      <InLocale locale="en">
        <StartupTeamView />
      </InLocale>,
    );

    const [first, second] = screen.getAllByRole("listitem");
    expect(within(first).getByText("CEO · Founder")).toBeInTheDocument();
    expect(within(first).getByText("Joined: Jun 12, 2026")).toBeInTheDocument();
    expect(within(first).getByText("Admin")).toBeInTheDocument();
    expect(within(second).getByText("Member")).toBeInTheDocument();
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

  it("lists teammates still waiting to join, apart from the members", () => {
    vi.mocked(useStartupTeam).mockReturnValue(state());
    pendingState({ pending: [pendingEce] });
    renderWithQueryClient(<StartupTeamView />);

    const pending = screen
      .getByRole("heading", { name: "Katılım bekleyenler" })
      .closest("section") as HTMLElement;
    expect(within(pending).getByText("Ece Kaya")).toBeInTheDocument();
    expect(within(pending).getByText("Katılım bekleniyor")).toBeInTheDocument();
  });

  it("hides the waiting list when nobody is waiting", () => {
    vi.mocked(useStartupTeam).mockReturnValue(state());
    renderWithQueryClient(<StartupTeamView />);

    expect(
      screen.queryByRole("heading", { name: "Katılım bekleyenler" }),
    ).not.toBeInTheDocument();
  });

  it("lets only the founder drop a waiting teammate", async () => {
    const user = userEvent.setup();
    const remove = vi.fn();
    pendingState({ pending: [pendingEce], remove });

    vi.mocked(useStartupTeam).mockReturnValue(
      state({ viewerIsFounder: false }),
    );
    const { unmount } = renderWithQueryClient(<StartupTeamView />);
    expect(
      screen.queryByRole("button", { name: "Ece Kaya bekleyenlerden çıkar" }),
    ).not.toBeInTheDocument();
    unmount();

    vi.mocked(useStartupTeam).mockReturnValue(state());
    renderWithQueryClient(<StartupTeamView />);
    await user.click(
      screen.getByRole("button", { name: "Ece Kaya bekleyenlerden çıkar" }),
    );
    expect(remove).toHaveBeenCalledWith("p1");
  });

  it("lets a member open the leave dialog", async () => {
    const user = userEvent.setup();
    vi.mocked(useStartupTeam).mockReturnValue(
      state({ viewerIsFounder: false }),
    );
    const changes = changesState({ canLeave: true });
    renderWithQueryClient(<StartupTeamView />);

    await user.click(screen.getByRole("button", { name: "Takımdan ayrıl" }));
    expect(changes.openLeave).toHaveBeenCalled();
  });

  it("marks a waiting request on the member and lets its sender withdraw it", async () => {
    const user = userEvent.setup();
    vi.mocked(useStartupTeam).mockReturnValue(state());
    const removal = teamChange({
      kind: TeamChangeKind.Remove,
      requestedById: "founder",
    });
    const changes = changesState({
      changeFor: (id) => (id === "cto" ? removal : null),
      requestedByMe: () => true,
    });
    renderWithQueryClient(<StartupTeamView />);

    expect(screen.getByText("Çıkarma talebi bekliyor")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Kerem Aksoy ekipten çıkar" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Talebi geri al" }));
    expect(changes.cancel).toHaveBeenCalledWith("tc-1");
  });

  it("asks the coordinator instead of removing at once inside a program", () => {
    vi.mocked(useStartupTeam).mockReturnValue(
      state({ removalNeedsApproval: true, removingMember: cto }),
    );
    renderWithQueryClient(<StartupTeamView />);

    expect(
      screen.getByText(/çıkarma talebi programın koordinatörüne gider/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Talep gönder" }),
    ).toBeInTheDocument();
  });
});
