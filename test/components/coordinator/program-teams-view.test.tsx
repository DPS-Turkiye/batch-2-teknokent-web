import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramTeamsView } from "@/components/coordinator/program-teams-view";
import {
  type ProgramTeam,
  TeamJoinStatus,
} from "@/interfaces/coordinator-program";
import {
  addProgramTeams,
  getCoordinatorProgram,
  getProgramTeams,
  removeProgramTeam,
  updateProgramTeam,
} from "@/lib/client/coordinator-programs";
import { coordinatorProgramDetail } from "@test/fixtures/coordinator-programs";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/coordinator-programs", () => ({
  getCoordinatorProgram: vi.fn(),
  getProgramTeams: vi.fn(),
  addProgramTeams: vi.fn(),
  updateProgramTeam: vi.fn(),
  removeProgramTeam: vi.fn(),
}));

const joined: ProgramTeam = {
  inviteId: "invite-1",
  organizationId: "org-1",
  name: "Kavşak",
  status: TeamJoinStatus.Joined,
  leadName: "Deniz Arı",
  leadEmail: "deniz@kavsak.co",
  code: "BIGG26-K4TX",
  invitedAt: "2026-09-19T10:00:00Z",
  joinedAt: "2026-09-20T10:00:00Z",
  memberCount: 3,
};
const waiting: ProgramTeam = {
  ...joined,
  inviteId: "invite-2",
  organizationId: null,
  name: "Pusula",
  status: TeamJoinStatus.Waiting,
  leadName: null,
  leadEmail: "ali@pusula.io",
  code: "BIGG26-P8LN",
  joinedAt: null,
  memberCount: 0,
};

describe("ProgramTeamsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCoordinatorProgram).mockResolvedValue(
      coordinatorProgramDetail(),
    );
    vi.mocked(getProgramTeams).mockResolvedValue([joined, waiting]);
  });

  it("shows who joined and filters to the teams still waiting", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramTeamsView programId="program-1" />);

    expect(await screen.findByText("Deniz Arı")).toBeInTheDocument();
    expect(
      screen.getByText(/yetkili katıldı · 1 takım bekleniyor/),
    ).toBeInTheDocument();
    expect(screen.getByText("3 üye")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Kavşak düzenle" }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Yetkili bekleniyor 1" }),
    );
    expect(screen.queryByText("Deniz Arı")).not.toBeInTheDocument();
    expect(screen.getByText("ali@pusula.io")).toBeInTheDocument();
  });

  it("copies a team code", async () => {
    const user = userEvent.setup();
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue();
    renderWithQueryClient(<ProgramTeamsView programId="program-1" />);

    await user.click(
      await screen.findByRole("button", { name: "Pusula kodunu kopyala" }),
    );

    expect(writeText).toHaveBeenCalledWith("BIGG26-P8LN");
  });

  it("adds a team and refuses an address without a domain", async () => {
    vi.mocked(addProgramTeams).mockResolvedValue([joined, waiting]);
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramTeamsView programId="program-1" />);

    await user.click(await screen.findByRole("button", { name: /Takım ekle/ }));
    const form = screen.getByRole("form", { name: "Yeni takım" });
    await user.type(within(form).getByLabelText("Takım adı"), "Tohum");
    await user.type(
      within(form).getByLabelText("Takım yetkilisi e-postası"),
      "can@tohum",
    );
    await user.click(
      within(form).getByRole("button", { name: "Ekle ve kod üret" }),
    );
    expect(within(form).getByRole("alert")).toHaveTextContent(
      "Geçerli bir e-posta adresi girin.",
    );
    expect(addProgramTeams).not.toHaveBeenCalled();

    await user.type(
      within(form).getByLabelText("Takım yetkilisi e-postası"),
      ".io",
    );
    await user.click(
      within(form).getByRole("button", { name: "Ekle ve kod üret" }),
    );
    expect(addProgramTeams).toHaveBeenCalledWith("program-1", [
      { teamName: "Tohum", leadEmail: "can@tohum.io" },
    ]);
  });

  it("fixes the email of a waiting team and removes another", async () => {
    vi.mocked(updateProgramTeam).mockResolvedValue([joined, waiting]);
    vi.mocked(removeProgramTeam).mockResolvedValue([joined]);
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramTeamsView programId="program-1" />);

    await user.click(
      await screen.findByRole("button", { name: "Pusula düzenle" }),
    );
    const form = screen.getByRole("form", { name: "Pusula düzenleniyor" });
    const email = within(form).getByLabelText("Takım yetkilisi e-postası");
    await user.clear(email);
    await user.type(email, "ali@pusula.com");
    await user.click(within(form).getByRole("button", { name: "Kaydet" }));
    expect(updateProgramTeam).toHaveBeenCalledWith("program-1", "invite-2", {
      teamName: "Pusula",
      leadEmail: "ali@pusula.com",
    });

    await user.click(
      await screen.findByRole("button", { name: "Pusula kaldır" }),
    );
    expect(removeProgramTeam).toHaveBeenCalledWith("program-1", "invite-2");
  });
});
