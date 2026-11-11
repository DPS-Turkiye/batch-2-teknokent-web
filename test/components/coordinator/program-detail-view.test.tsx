import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePathname } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramOverviewView } from "@/components/coordinator/program-overview-view";
import { ProgramSettingsView } from "@/components/coordinator/program-settings-view";
import { ProgramLifecycle } from "@/interfaces/coordinator-program";
import { ProgramStatus, ProgramType } from "@/interfaces/program";
import { DocumentKind } from "@/interfaces/startup-document";
import {
  addProgramCoordinator,
  getCoordinatorProgram,
  getProgramCoordinatorCandidates,
  getProgramTeams,
  launchCoordinatorProgram,
  replaceCoordinatorProgramPhases,
  setCoordinatorProgramArchived,
  updateCoordinatorProgram,
} from "@/lib/client/coordinator-programs";
import {
  readWeeklyProgram,
  saveWeeklyProgram,
} from "@/lib/client/weekly-program";
import {
  coordinatorProgramDetail,
  phase,
} from "@test/fixtures/coordinator-programs";
import { weeklyProgramProposal } from "@test/fixtures/weekly-program";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/coordinator/programs/program-1"),
}));

vi.mock("@/lib/client/program-peer-categories", () => ({
  getProgramPeerCategories: vi.fn(async () => ({
    programId: "program-1",
    active: [],
  })),
  replaceProgramPeerCategories: vi.fn(),
}));

vi.mock("@/lib/client/program-weeks", () => ({
  getProgramWeekPlan: vi.fn(async () => ({ totalWeeks: null, weeks: [] })),
  saveProgramWeekPlan: vi.fn(),
}));
vi.mock("@/lib/client/weekly-program", () => ({
  readWeeklyProgram: vi.fn(),
  saveWeeklyProgram: vi.fn(),
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
  launchCoordinatorProgram: vi.fn(),
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
    expect(screen.getByRole("tab", { name: /Katılımcılar/ })).toHaveAttribute(
      "href",
      "/coordinator/programs/program-1/teams",
    );
    expect(
      screen.queryByRole("tab", { name: /Mentor Havuzu/ }),
    ).not.toBeInTheDocument();
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
          id: "phase-1",
          name: "Başvuru",
          startDate: "2026-02-01",
          endDate: "2026-02-28",
          expectedOutput: null,
        },
        {
          id: "phase-2",
          name: "Mentorluk dönemi",
          startDate: "2026-05-01",
          endDate: "2026-11-28",
          expectedOutput: "Ara rapor",
        },
        {
          id: "phase-3",
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

  it("shows an older syllabus file read-only, without reading it again", async () => {
    vi.mocked(getCoordinatorProgram).mockResolvedValue(
      coordinatorProgramDetail({
        syllabus: {
          id: "doc-syllabus",
          filename: "mufredat.pdf",
          sizeBytes: 19_540,
          uploadedAt: "2026-06-01T09:00:00Z",
          kind: DocumentKind.Syllabus,
        },
      }),
    );
    renderWithQueryClient(<ProgramSettingsView programId="program-1" />);

    expect(await screen.findByText("mufredat.pdf")).toBeVisible();
    expect(
      screen.getByText("Önceki müfredat dosyası · yalnızca görüntülenir"),
    ).toBeVisible();
    expect(screen.queryByRole("button", { name: /Yeniden oku/ })).toBeNull();
    expect(
      screen.getByRole("button", { name: "Yeni PDF yükle" }),
    ).toBeEnabled();
  });

  it("reads the weekly program again and saves the reviewed weeks and phases in one step", async () => {
    const detail = coordinatorProgramDetail({
      syllabus: {
        id: "doc-weekly",
        filename: "haftalik-program.pdf",
        sizeBytes: 70_000,
        uploadedAt: "2026-06-01T09:00:00Z",
        kind: DocumentKind.WeeklyProgram,
      },
    });
    vi.mocked(getCoordinatorProgram).mockResolvedValue(detail);
    vi.mocked(readWeeklyProgram).mockResolvedValue(weeklyProgramProposal());
    vi.mocked(saveWeeklyProgram).mockResolvedValue({
      program: detail,
      plan: { totalWeeks: 11, weeks: [] },
    });
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramSettingsView programId="program-1" />);

    await user.click(
      await screen.findByRole("button", { name: /Yeniden oku/ }),
    );
    const review = await screen.findByRole("region", {
      name: "Dosyadan okunan plan",
    });
    expect(readWeeklyProgram).toHaveBeenCalledWith("program-1", "doc-weekly");
    expect(
      within(review).getByText(/program takvimine uymuyor: hafta 8 ve 10/),
    ).toBeVisible();
    expect(
      within(review).getByText("9 Ocak Cumartesi — Demo Day"),
    ).toBeVisible();

    const name = within(review).getByRole("textbox", { name: "1. faz adı" });
    await user.clear(name);
    await user.type(name, "Problem");
    await user.selectOptions(
      within(review).getByRole("combobox", { name: "Hafta 4 fazı" }),
      "Problem",
    );
    await user.click(
      within(review).getByRole("button", { name: "Planı kaydet" }),
    );

    expect(saveWeeklyProgram).toHaveBeenCalledWith(
      "program-1",
      expect.objectContaining({
        documentId: "doc-weekly",
        seenPhaseCount: 0,
        seenWeekCount: 0,
        keepPast: false,
        phases: [
          {
            name: "Problem",
            expectedOutput: "Problem tanımı",
            firstWeek: 1,
            lastWeek: 4,
          },
          {
            name: "Fikir ve Değer",
            expectedOutput: null,
            firstWeek: 5,
            lastWeek: 5,
          },
          {
            name: "Pazar ve İş Modeli",
            expectedOutput: null,
            firstWeek: 6,
            lastWeek: 8,
          },
          {
            name: "Doğrula ve Sun",
            expectedOutput: "Sunum ve 90 günlük plan",
            firstWeek: 9,
            lastWeek: 10,
          },
        ],
      }),
    );
    expect(
      await screen.findByText("Haftalık program ve fazlar kaydedildi."),
    ).toBeVisible();
    expect(
      screen.queryByRole("region", { name: "Dosyadan okunan plan" }),
    ).toBeNull();
  });

  it("asks before a read plan replaces the saved one, keeping the past of a running program", async () => {
    vi.mocked(getCoordinatorProgram).mockResolvedValue(
      coordinatorProgramDetail({
        syllabus: {
          id: "doc-weekly",
          filename: "haftalik-program.pdf",
          sizeBytes: 70_000,
          uploadedAt: "2026-06-01T09:00:00Z",
          kind: DocumentKind.WeeklyProgram,
        },
      }),
    );
    vi.mocked(readWeeklyProgram).mockResolvedValue(
      weeklyProgramProposal({
        existing: { phaseCount: 3, weekCount: 6, currentWeek: 4 },
      }),
    );
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramSettingsView programId="program-1" />);

    await user.click(
      await screen.findByRole("button", { name: /Yeniden oku/ }),
    );
    const review = await screen.findByRole("region", {
      name: "Dosyadan okunan plan",
    });
    expect(within(review).getByText(/3 faz ve 6 hafta kayıtlı/)).toBeVisible();
    expect(
      within(review).getByRole("checkbox", {
        name: /Geçmiş haftaları ve tamamlanan fazları koru/,
      }),
    ).toBeChecked();
    expect(
      within(review).getByText(/Hafta 1–3 ve bitmiş fazlar/),
    ).toBeVisible();

    await user.click(
      within(review).getByRole("button", { name: "Planı kaydet" }),
    );
    expect(within(review).getByRole("alert")).toHaveTextContent(
      "Kaydetmeden önce kayıtlı planın yerini almasını onayla.",
    );
    expect(saveWeeklyProgram).not.toHaveBeenCalled();

    await user.click(
      within(review).getByRole("checkbox", {
        name: "Kayıtlı planın yerini almasını onaylıyorum",
      }),
    );
    await user.click(
      within(review).getByRole("button", { name: "Planı kaydet" }),
    );
    expect(saveWeeklyProgram).toHaveBeenCalledWith(
      "program-1",
      expect.objectContaining({
        seenPhaseCount: 3,
        seenWeekCount: 6,
        keepPast: true,
      }),
    );
  });

  it("lets the admin add a coordinator from the approved ones", async () => {
    vi.mocked(usePathname).mockReturnValue("/admin/programs/program-1");
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

  it("shows coordinators their colleagues read-only and leaves the changes to the admin", async () => {
    renderWithQueryClient(<ProgramSettingsView programId="program-1" />);

    const current = await screen.findByRole("list", {
      name: "Programın koordinatörleri",
    });
    expect(within(current).getByText("Burcu Şen")).toBeInTheDocument();
    expect(
      within(current).queryByRole("button", { name: /programdan çıkar/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Koordinatör ekle/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Koordinatörleri yönetici atar."),
    ).toBeInTheDocument();
    expect(screen.getByText("Program türü")).toBeInTheDocument();
  });

  it("gives only a peer program the Akran kategorileri section", async () => {
    const detail = coordinatorProgramDetail();
    vi.mocked(getCoordinatorProgram).mockResolvedValue({
      ...detail,
      program: { ...detail.program, type: ProgramType.PeerMentoring },
    });
    const { unmount } = renderWithQueryClient(
      <ProgramSettingsView programId="program-1" />,
    );
    expect(
      await screen.findByRole("heading", { name: "Akran kategorileri" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Akran kategorileri" }),
    ).toHaveAttribute("href", "#peer_categories");
    unmount();

    vi.mocked(getCoordinatorProgram).mockResolvedValue(detail);
    renderWithQueryClient(<ProgramSettingsView programId="program-1" />);
    expect(
      await screen.findByText("Genel bilgiler", { selector: "h2" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Akran kategorileri" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Akran kategorileri" }),
    ).not.toBeInTheDocument();
  });

  it("lets the admin view the settings without changing them", async () => {
    vi.mocked(usePathname).mockReturnValue("/admin/programs/program-1");
    renderWithQueryClient(<ProgramSettingsView programId="program-1" />);

    expect(
      await screen.findByText(/yönetici olarak yalnızca görüntülersin/),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("METU Stars 2026")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Değişiklikleri kaydet" }),
    ).toBeDisabled();
    expect(
      screen.getByLabelText("Haftalık program PDF dosyası seç"),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Programı arşivle" }),
    ).toBeDisabled();
  });

  it("lets the admin launch a draft once it has a coordinator", async () => {
    vi.mocked(usePathname).mockReturnValue("/admin/programs/program-1");
    const detail = coordinatorProgramDetail();
    const draft = {
      ...detail,
      program: {
        ...detail.program,
        lifecycle: ProgramLifecycle.Draft,
        status: ProgramStatus.Draft,
      },
    };
    vi.mocked(getCoordinatorProgram).mockResolvedValue(draft);
    vi.mocked(launchCoordinatorProgram).mockResolvedValue(detail);
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramOverviewView programId="program-1" />);

    expect(
      await screen.findByText(/Program henüz başlatılmadı/),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Programı Başlat" }));

    expect(launchCoordinatorProgram).toHaveBeenCalledWith("program-1");
  });

  it("keeps the launch closed until a coordinator is assigned, and hides it from coordinators", async () => {
    vi.mocked(usePathname).mockReturnValue("/admin/programs/program-1");
    const detail = coordinatorProgramDetail();
    vi.mocked(getCoordinatorProgram).mockResolvedValue({
      ...detail,
      coordinators: [],
      program: { ...detail.program, lifecycle: ProgramLifecycle.Draft },
    });
    const { unmount } = renderWithQueryClient(
      <ProgramOverviewView programId="program-1" />,
    );

    expect(
      await screen.findByRole("button", { name: "Programı Başlat" }),
    ).toBeDisabled();
    expect(
      screen.getByText("Başlatmadan önce bir koordinatör ata."),
    ).toBeInTheDocument();
    unmount();

    vi.mocked(usePathname).mockReturnValue("/coordinator/programs/program-1");
    renderWithQueryClient(<ProgramOverviewView programId="program-1" />);
    expect(
      await screen.findByText(/yönetici başlattığında/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Programı Başlat" }),
    ).not.toBeInTheDocument();
  });

  it("asks before archiving, and an archived program is read-only", async () => {
    const detail = coordinatorProgramDetail();
    vi.mocked(setCoordinatorProgramArchived).mockResolvedValue({
      ...detail,
      program: {
        ...detail.program,
        lifecycle: ProgramLifecycle.Completed,
        status: ProgramStatus.Completed,
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
