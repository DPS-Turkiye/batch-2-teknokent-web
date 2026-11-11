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
  getProgramTeamDetail,
  getProgramTeams,
  removeProgramTeam,
  sendProgramTeamCode,
  updateProgramTeam,
} from "@/lib/client/coordinator-programs";
import { StartupStage } from "@/interfaces/startup-process";
import { getTeamProcess, updateTeamStage } from "@/lib/client/startup-process";
import { coordinatorProgramDetail } from "@test/fixtures/coordinator-programs";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/coordinator-programs", () => ({
  getCoordinatorProgram: vi.fn(),
  getProgramTeams: vi.fn(),
  addProgramTeams: vi.fn(),
  updateProgramTeam: vi.fn(),
  removeProgramTeam: vi.fn(),
  sendProgramTeamCode: vi.fn(),
  getProgramTeamDetail: vi.fn(),
  getProgramWithoutTeam: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/lib/client/startup-process", () => ({
  getTeamProcess: vi.fn(),
  updateTeamStage: vi.fn(),
}));

const teamProcess = (currentStage: StartupStage | null) =>
  ({ organizationId: "org-1", currentStage }) as Awaited<
    ReturnType<typeof getTeamProcess>
  >;

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
  codeSentAt: null,
  codeSendFailed: false,
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

  it("reads in English", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <InLocale locale="en">
        <ProgramTeamsView programId="program-1" />
      </InLocale>,
    );

    expect(await screen.findByText("Deniz Arı")).toBeInTheDocument();
    expect(
      screen.getByText(/leads joined · 1 team waiting/),
    ).toBeInTheDocument();
    expect(screen.getByText("3 members")).toBeInTheDocument();
    expect(screen.getByText("Lead joined")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send the code" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Add a team/ }));
    expect(screen.getByRole("form", { name: "New team" })).toBeInTheDocument();
    expect(screen.getByLabelText("Team lead's email")).toBeInTheDocument();
  });

  it("emails a waiting team's code and shows when it went out", async () => {
    const user = userEvent.setup();
    vi.mocked(sendProgramTeamCode).mockResolvedValue([
      joined,
      { ...waiting, codeSentAt: "2026-09-19T10:00:00Z" },
    ]);
    renderWithQueryClient(<ProgramTeamsView programId="program-1" />);

    await user.click(
      await screen.findByRole("button", { name: "Kodu gönder" }),
    );

    expect(sendProgramTeamCode).toHaveBeenCalledWith("program-1", "invite-2");
    expect(
      await screen.findByText("Gönderildi 19 Eyl · ali@pusula.io"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Kodu tekrar gönder" }),
    ).toBeInTheDocument();
  });

  it("lists a team whose code email bounced under Sorunlu and lets the coordinator fix the address", async () => {
    const user = userEvent.setup();
    vi.mocked(getProgramTeams).mockResolvedValue([
      joined,
      { ...waiting, codeSendFailed: true },
    ]);
    renderWithQueryClient(<ProgramTeamsView programId="program-1" />);

    await user.click(await screen.findByRole("button", { name: "Sorunlu 1" }));
    expect(screen.getByText("E-posta iletilemedi")).toBeInTheDocument();
    expect(screen.queryByText("Deniz Arı")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "E-postayı düzelt" }));
    expect(screen.getByDisplayValue("ali@pusula.io")).toBeInTheDocument();
  });

  it("opens a joined team's drawer with its lead, members and message link", async () => {
    const user = userEvent.setup();
    vi.mocked(getProgramTeamDetail).mockResolvedValue({
      organizationId: "org-1",
      name: "Kavşak",
      sector: "Fintech",
      lead: {
        id: "lead-1",
        name: "Deniz Arı",
        jobTitle: "CEO",
        email: "deniz@kavsak.co",
        joinedAt: "2026-09-20T10:00:00Z",
      },
      code: "BIGG26-K4TX",
      members: [
        {
          id: "member-1",
          name: "Cem Tunç",
          jobTitle: "CTO",
          email: null,
          joinedAt: "2026-09-21T10:00:00Z",
        },
      ],
      mentorships: [],
    });
    renderWithQueryClient(<ProgramTeamsView programId="program-1" />);

    await user.click(await screen.findByRole("button", { name: "Detay" }));

    const drawer = await screen.findByRole("dialog", { name: "Takım detayı" });
    expect(await within(drawer).findByText("Cem Tunç")).toBeInTheDocument();
    expect(
      within(drawer).getByRole("link", { name: "Profili gör: Cem Tunç" }),
    ).toHaveAttribute("href", "/coordinator/people/member-1");
    expect(getProgramTeamDetail).toHaveBeenCalledWith("program-1", "org-1");
    expect(
      within(drawer).getByRole("link", { name: "Takıma mesaj gönder" }),
    ).toHaveAttribute(
      "href",
      "/coordinator/messages?program=program-1&team=org-1",
    );
    expect(
      within(drawer).getByText("Bu takım henüz bir mentorla eşleşmedi."),
    ).toBeInTheDocument();
  });

  it("lets the coordinator move a joined team to another stage", async () => {
    const user = userEvent.setup();
    vi.mocked(getProgramTeamDetail).mockResolvedValue({
      organizationId: "org-1",
      name: "Kavşak",
      sector: null,
      lead: null,
      code: null,
      members: [],
      mentorships: [],
    });
    vi.mocked(getTeamProcess).mockResolvedValue(teamProcess(StartupStage.Mvp));
    vi.mocked(updateTeamStage).mockResolvedValue(
      teamProcess(StartupStage.Market),
    );
    renderWithQueryClient(<ProgramTeamsView programId="program-1" />);

    await user.click(await screen.findByRole("button", { name: "Detay" }));
    const drawer = await screen.findByRole("dialog", { name: "Takım detayı" });
    expect(await within(drawer).findByText("MVP")).toBeInTheDocument();
    expect(getTeamProcess).toHaveBeenCalledWith("program-1", "org-1");

    await user.click(
      within(drawer).getByRole("button", { name: "Aşamayı güncelle" }),
    );
    const save = within(drawer).getByRole("button", { name: "Kaydet" });
    expect(save).toBeDisabled();
    await user.selectOptions(
      within(drawer).getByRole("combobox", { name: "Yeni aşama" }),
      "Pazar",
    );
    await user.click(save);

    expect(updateTeamStage).toHaveBeenCalledWith(
      "program-1",
      "org-1",
      StartupStage.Market,
    );
    expect(await within(drawer).findByText("Pazar")).toBeInTheDocument();
    expect(
      within(drawer).queryByRole("combobox", { name: "Yeni aşama" }),
    ).not.toBeInTheDocument();
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
