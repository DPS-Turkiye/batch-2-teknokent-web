import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramOverviewView } from "@/components/coordinator/program-overview-view";
import { ProgramSettingsView } from "@/components/coordinator/program-settings-view";
import { ProgramLifecycle } from "@/interfaces/coordinator-program";
import {
  addProgramCoordinator,
  getCoordinatorProgram,
  getProgramCoordinatorCandidates,
  getProgramTeams,
  replaceCoordinatorProgramPhases,
  setCoordinatorProgramArchived,
  updateCoordinatorProgram,
} from "@/lib/client/coordinator-programs";
import { coordinatorProgramDetail } from "@test/fixtures/coordinator-programs";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/coordinator-programs", () => ({
  getCoordinatorProgram: vi.fn(),
  updateCoordinatorProgram: vi.fn(),
  replaceCoordinatorProgramPhases: vi.fn(),
  setCoordinatorProgramArchived: vi.fn(),
  getProgramCoordinatorCandidates: vi.fn(),
  addProgramCoordinator: vi.fn(),
  removeProgramCoordinator: vi.fn(),
  getProgramTeams: vi.fn(),
}));

describe("coordinator program detail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCoordinatorProgram).mockResolvedValue(
      coordinatorProgramDetail(),
    );
    vi.mocked(getProgramTeams).mockResolvedValue([]);
  });

  it("walks a new program through its setup checklist", async () => {
    const detail = coordinatorProgramDetail();
    detail.program.mentorCount = 0;
    detail.program.activeMentorshipCount = 0;
    vi.mocked(getCoordinatorProgram).mockResolvedValue(detail);
    renderWithQueryClient(<ProgramOverviewView programId="program-1" />);

    const setup = await screen.findByRole("region", {
      name: "Program kurulumu",
    });
    expect(within(setup).getByText("Kurulum 1 / 4")).toBeInTheDocument();
    expect(
      within(setup).getByRole("link", { name: "Takım ekle" }),
    ).toHaveAttribute("href", "/coordinator/programs/program-1/teams");
  });

  it("shows Genel Bakış: phases, health, actions, dates and distribution", async () => {
    renderWithQueryClient(<ProgramOverviewView programId="program-1" />);

    expect(
      await screen.findByRole("heading", { name: /METU Stars 2026/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Koordinatörler: Elif Demir, Burcu Şen/),
    ).toBeInTheDocument();
    expect(screen.getByText("Mentorluk dönemi")).toBeInTheDocument();
    expect(screen.getByText("Hafta 6 / 16")).toBeInTheDocument();
    const actions = screen.getByRole("list", { name: "Bekleyen işler" });
    expect(
      within(actions).getByText("4 görüşme: not eksik"),
    ).toBeInTheDocument();
    expect(
      within(actions).getByRole("link", { name: /Mentorluklar/ }),
    ).toHaveAttribute("href", "/coordinator/mentorships");
    expect(screen.getByText("Ara rapor teslimi")).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /Program Ayarları/ }),
    ).toHaveAttribute("href", "/coordinator/programs/program-1/settings");
    expect(screen.getByRole("tab", { name: /Takımlar/ })).toHaveAttribute(
      "href",
      "/coordinator/programs/program-1/teams",
    );
    expect(screen.getByRole("tab", { name: /Mentor Havuzu/ })).toHaveAttribute(
      "href",
      "/coordinator/programs/program-1/mentors",
    );
    expect(screen.getByRole("tab", { name: /Eşleşmeler/ })).toHaveAttribute(
      "href",
      "/coordinator/programs/program-1/matching",
    );
  });

  it("saves the rules and only replaces phases when they changed", async () => {
    vi.mocked(updateCoordinatorProgram).mockResolvedValue(
      coordinatorProgramDetail(),
    );
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramSettingsView programId="program-1" />);

    const save = await screen.findByRole("button", {
      name: "Değişiklikleri kaydet",
    });
    expect(save).toBeDisabled();
    await user.click(
      screen.getByRole("button", { name: "Hedef görüşme sıklığı: artır" }),
    );
    await user.click(save);

    expect(updateCoordinatorProgram).toHaveBeenCalledWith(
      "program-1",
      expect.objectContaining({
        meetingFrequencyDays: 15,
        name: "METU Stars 2026",
      }),
    );
    expect(replaceCoordinatorProgramPhases).not.toHaveBeenCalled();
  });

  it("lets the coordinator change the launch rules later", async () => {
    vi.mocked(updateCoordinatorProgram).mockResolvedValue(
      coordinatorProgramDetail(),
    );
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramSettingsView programId="program-1" />);

    await user.click(
      await screen.findByRole("button", {
        name: "Çözülmemiş darboğaz uyarısı: azalt",
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: "Varsayılan mentor kapasitesi: artır",
      }),
    );
    await user.click(
      screen.getByRole("button", { name: "Değişiklikleri kaydet" }),
    );

    expect(updateCoordinatorProgram).toHaveBeenCalledWith(
      "program-1",
      expect.objectContaining({
        bottleneckFlagDays: 20,
        defaultMentorCapacity: 5,
        communicationGapDays: 14,
      }),
    );
  });

  it("refuses an unnamed phase before saving", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramSettingsView programId="program-1" />);

    await user.click(await screen.findByRole("button", { name: /Faz ekle/ }));
    await user.click(
      screen.getByRole("button", { name: "Değişiklikleri kaydet" }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Her fazın bir adı olmalı.",
    );
    expect(updateCoordinatorProgram).not.toHaveBeenCalled();
  });

  it("adds a coordinator from the approved ones", async () => {
    vi.mocked(getProgramCoordinatorCandidates).mockResolvedValue([
      { id: "coordinator-3", fullName: "Can Yılmaz", owner: false },
    ]);
    vi.mocked(addProgramCoordinator).mockResolvedValue([]);
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramSettingsView programId="program-1" />);

    const current = await screen.findByRole("list", {
      name: "Programın koordinatörleri",
    });
    expect(within(current).getByText("Programı oluşturan")).toBeInTheDocument();
    expect(
      within(current).getByRole("button", {
        name: "Burcu Şen programdan çıkar",
      }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Koordinatör ekle/ }));
    await user.click(
      await screen.findByRole("button", { name: "+ Can Yılmaz" }),
    );

    expect(addProgramCoordinator).toHaveBeenCalledWith(
      "program-1",
      "coordinator-3",
    );
  });

  it("asks before archiving, and an archived program is read-only", async () => {
    const detail = coordinatorProgramDetail();
    vi.mocked(setCoordinatorProgramArchived).mockResolvedValue({
      ...detail,
      program: {
        ...detail.program,
        lifecycle: ProgramLifecycle.Completed,
        status: "COMPLETED",
      },
    });
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramSettingsView programId="program-1" />);

    await user.click(
      await screen.findByRole("button", { name: "Programı arşivle" }),
    );
    expect(setCoordinatorProgramArchived).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Evet, arşivle" }));

    expect(setCoordinatorProgramArchived).toHaveBeenCalledWith(
      "program-1",
      true,
    );
    expect(
      await screen.findByRole("button", { name: "Yeniden aç" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Program adı")).toBeDisabled();
  });
});
