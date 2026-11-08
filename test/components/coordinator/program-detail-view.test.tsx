import { fireEvent, screen, within } from "@testing-library/react";
import { usePathname } from "next/navigation";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramOverviewView } from "@/components/coordinator/program-overview-view";
import { ProgramSettingsView } from "@/components/coordinator/program-settings-view";
import { ProgramLifecycle } from "@/interfaces/coordinator-program";
import { ProgramStatus, ProgramType } from "@/interfaces/program";
import {
  addProgramCoordinator,
  extractSyllabusPhases,
  getCoordinatorProgram,
  getProgramCoordinatorCandidates,
  getProgramTeams,
  replaceCoordinatorProgramPhases,
  setCoordinatorProgramArchived,
  updateCoordinatorProgram,
} from "@/lib/client/coordinator-programs";
import {
  coordinatorProgramDetail,
  phase,
} from "@test/fixtures/coordinator-programs";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/coordinator/programs/program-1"),
}));

vi.mock("@/lib/client/coordinator-programs", () => ({
  getCoordinatorProgram: vi.fn(),
  updateCoordinatorProgram: vi.fn(),
  replaceCoordinatorProgramPhases: vi.fn(),
  setCoordinatorProgramArchived: vi.fn(),
  getProgramCoordinatorCandidates: vi.fn(),
  addProgramCoordinator: vi.fn(),
  removeProgramCoordinator: vi.fn(),
  getProgramTeams: vi.fn(),
  extractSyllabusPhases: vi.fn(),
}));

describe("coordinator program detail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePathname).mockReturnValue("/coordinator/programs/program-1");
    vi.mocked(getCoordinatorProgram).mockResolvedValue(
      coordinatorProgramDetail(),
    );
    vi.mocked(getProgramTeams).mockResolvedValue([]);
  });

  it("keeps admin settings and report links in the admin shell", async () => {
    vi.mocked(usePathname).mockReturnValue("/admin/programs/program-1");
    renderWithQueryClient(<ProgramOverviewView programId="program-1" />);
    expect(
      await screen.findByRole("tab", { name: "Program Ayarları" }),
    ).toHaveAttribute("href", "/admin/programs/program-1/settings");
    expect(
      screen.getByRole("link", { name: "Program raporu" }),
    ).toHaveAttribute("href", "/admin/programs/program-1/report");
    expect(
      screen.queryByRole("link", { name: /Takvim/ }),
    ).not.toBeInTheDocument();
  });

  it("does not send admins to a Takvim they lack when no dates are coming up", async () => {
    vi.mocked(usePathname).mockReturnValue("/admin/programs/program-1");
    vi.mocked(getCoordinatorProgram).mockResolvedValue(
      coordinatorProgramDetail({ upcomingEvents: [] }),
    );
    renderWithQueryClient(<ProgramOverviewView programId="program-1" />);
    expect(
      await screen.findByText("Yaklaşan etkinlik ya da son tarih yok."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Takvim’den/)).not.toBeInTheDocument();
  });

  it("still points coordinators to Takvim when no dates are coming up", async () => {
    vi.mocked(getCoordinatorProgram).mockResolvedValue(
      coordinatorProgramDetail({ upcomingEvents: [] }),
    );
    renderWithQueryClient(<ProgramOverviewView programId="program-1" />);
    expect(
      await screen.findByText(
        "Yaklaşan etkinlik ya da son tarih yok. Takvim’den ekleyebilirsiniz.",
      ),
    ).toBeInTheDocument();
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

  it("reads Genel Bakış in English", async () => {
    renderWithQueryClient(
      <InLocale locale="en">
        <ProgramOverviewView programId="program-1" />
      </InLocale>,
    );

    expect(
      await screen.findByText(/Coordinators: Elif Demir, Burcu Şen/),
    ).toBeInTheDocument();
    expect(screen.getByText("Week 6 / 16")).toBeInTheDocument();
    const actions = screen.getByRole("list", { name: "Waiting work" });
    expect(
      within(actions).getByText("4 meetings: notes missing"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /Program settings/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("Team & mentor distribution")).toBeInTheDocument();
  });

  it("shows the program type and a draft's Taslak label in the header", async () => {
    const detail = coordinatorProgramDetail();
    vi.mocked(getCoordinatorProgram).mockResolvedValue({
      ...detail,
      program: {
        ...detail.program,
        lifecycle: ProgramLifecycle.Draft,
        status: ProgramStatus.Draft,
        type: ProgramType.OfficeHours,
      },
    });
    renderWithQueryClient(<ProgramOverviewView programId="program-1" />);

    const heading = await screen.findByRole("heading", {
      name: /METU Stars 2026/,
    });
    expect(within(heading).getByText("Taslak")).toBeInTheDocument();
    expect(within(heading).getByText("Office Hours")).toBeInTheDocument();
  });

  it("shows Genel Bakış: phases, health, actions, dates and distribution", async () => {
    renderWithQueryClient(<ProgramOverviewView programId="program-1" />);
    expect(await screen.findByRole("link", { name: /Takvim/ })).toHaveAttribute(
      "href",
      "/coordinator/calendar",
    );

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

  it("reads Program Ayarları in English", async () => {
    renderWithQueryClient(
      <InLocale locale="en">
        <ProgramSettingsView programId="program-1" />
      </InLocale>,
    );

    expect(
      await screen.findByRole("button", { name: "Save changes" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("navigation", { name: "Settings sections" }),
    ).toHaveTextContent("Mentorship rules");
    expect(screen.getByText("Target meeting frequency")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Target meeting frequency: increase",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Danger zone")).toBeInTheDocument();
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

  it("refuses a new phase without a name", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramSettingsView programId="program-1" />);

    await user.click(await screen.findByRole("button", { name: /Faz ekle/ }));
    const drawer = screen.getByRole("dialog", { name: "Yeni faz" });
    await user.click(within(drawer).getByRole("button", { name: "Kaydet" }));

    expect(within(drawer).getByRole("alert")).toHaveTextContent(
      "Her fazın bir adı olmalı.",
    );
    expect(replaceCoordinatorProgramPhases).not.toHaveBeenCalled();
  });

  it("edits the running phase: its start stays, a later end is explained, and the list is saved", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-06-10T12:00:00"));
    const detail = coordinatorProgramDetail();
    detail.program.phases = [
      {
        ...phase("phase-1", "Başvuru", 0),
        startDate: "2026-02-01",
        endDate: "2026-02-28",
        expectedOutput: null,
      },
      {
        ...phase("phase-2", "Mentorluk dönemi", 1),
        startDate: "2026-05-01",
        endDate: "2026-11-15",
        expectedOutput: "Ara rapor",
      },
      {
        ...phase("phase-3", "Demo Day", 2),
        startDate: "2026-12-12",
        endDate: "2026-12-12",
        expectedOutput: null,
      },
    ];
    vi.mocked(getCoordinatorProgram).mockResolvedValue(detail);
    vi.mocked(replaceCoordinatorProgramPhases).mockResolvedValue(detail);
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramSettingsView programId="program-1" />);

    const list = await screen.findByRole("list", { name: "Program fazları" });
    expect(within(list).getByText("Tamamlandı")).toBeInTheDocument();
    expect(within(list).getByText("Şu an · hafta 6/16")).toBeInTheDocument();
    expect(within(list).getByText("Planlandı")).toBeInTheDocument();

    await user.click(
      within(list).getByRole("button", {
        name: "Mentorluk dönemi fazını düzenle",
      }),
    );
    const drawer = screen.getByRole("dialog", { name: "Fazı düzenle" });
    expect(within(drawer).getByLabelText("Başlangıç")).toBeDisabled();
    fireEvent.change(within(drawer).getByLabelText("Bitiş"), {
      target: { value: "2026-11-28" },
    });
    expect(
      within(drawer).getByText("Bitiş 15 Kas → 28 Kas: faz 13 gün uzar"),
    ).toBeInTheDocument();
    expect(
      within(drawer).getByText("Demo Day (12 Ara) ile arada 2 hafta kalır"),
    ).toBeInTheDocument();
    expect(
      within(drawer).queryByRole("button", { name: "Fazı sil" }),
    ).toBeNull();

    await user.click(within(drawer).getByRole("button", { name: "Kaydet" }));
    expect(replaceCoordinatorProgramPhases).toHaveBeenCalledWith(
      "program-1",
      [
        {
          name: "Başvuru",
          startDate: "2026-02-01",
          endDate: "2026-02-28",
          expectedOutput: null,
        },
        {
          name: "Mentorluk dönemi",
          startDate: "2026-05-01",
          endDate: "2026-11-28",
          expectedOutput: "Ara rapor",
        },
        {
          name: "Demo Day",
          startDate: "2026-12-12",
          endDate: "2026-12-12",
          expectedOutput: null,
        },
      ],
      null,
    );
    vi.useRealTimers();
  });

  it("keeps a re-read syllabus unsaved until every phase from the file has dates", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-06-10T12:00:00"));
    const detail = coordinatorProgramDetail({
      syllabus: {
        id: "doc-syllabus",
        filename: "mufredat.pdf",
        sizeBytes: 19_540,
        uploadedAt: "2026-06-01T09:00:00Z",
      },
    });
    vi.mocked(getCoordinatorProgram).mockResolvedValue(detail);
    vi.mocked(extractSyllabusPhases).mockResolvedValue({
      pageCount: 1,
      phases: [
        {
          name: "Keşif",
          startDate: "2026-07-01",
          endDate: "2026-08-31",
          expectedOutput: "Problem raporu",
        },
        {
          name: "Demo Day",
          startDate: null,
          endDate: null,
          expectedOutput: "Final sunum",
        },
      ],
    });
    vi.mocked(replaceCoordinatorProgramPhases).mockResolvedValue(detail);
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramSettingsView programId="program-1" />);

    await user.click(
      await screen.findByRole("button", { name: /Fazları yeniden çıkar/ }),
    );
    await user.click(
      await screen.findByRole("button", { name: "Fazları kaydet" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "“Demo Day” fazının tarihlerini gir.",
    );
    expect(replaceCoordinatorProgramPhases).not.toHaveBeenCalled();

    const list = screen.getByRole("list", { name: "Program fazları" });
    await user.click(
      within(list).getByRole("button", { name: "Demo Day fazını düzenle" }),
    );
    const drawer = screen.getByRole("dialog", { name: "Fazı düzenle" });
    fireEvent.change(within(drawer).getByLabelText("Başlangıç"), {
      target: { value: "2026-09-15" },
    });
    fireEvent.change(within(drawer).getByLabelText("Bitiş"), {
      target: { value: "2026-09-15" },
    });
    await user.click(within(drawer).getByRole("button", { name: "Kaydet" }));
    expect(replaceCoordinatorProgramPhases).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Fazları kaydet" }));
    expect(replaceCoordinatorProgramPhases).toHaveBeenCalledWith(
      "program-1",
      [
        {
          name: "Keşif",
          startDate: "2026-07-01",
          endDate: "2026-08-31",
          expectedOutput: "Problem raporu",
        },
        {
          name: "Demo Day",
          startDate: "2026-09-15",
          endDate: "2026-09-15",
          expectedOutput: "Final sunum",
        },
      ],
      "doc-syllabus",
    );
    vi.useRealTimers();
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
