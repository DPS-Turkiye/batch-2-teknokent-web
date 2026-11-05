import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramLaunchView } from "@/components/coordinator/program-launch-view";
import {
  createCoordinatorProgram,
  extractSyllabusPhases,
} from "@/lib/client/coordinator-programs";
import { uploadDocument } from "@/lib/client/documents";
import { coordinatorProgramDetail } from "@test/fixtures/coordinator-programs";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => ({ fullName: "Elif Demir" }),
}));
vi.mock("@/lib/client/coordinator-programs", () => ({
  createCoordinatorProgram: vi.fn(),
  extractSyllabusPhases: vi.fn(),
}));
vi.mock("@/lib/client/documents", () => ({ uploadDocument: vi.fn() }));

const pdf = () =>
  new File(["%PDF-1.7"], "METU-BIGG-2026-mufredat.pdf", {
    type: "application/pdf",
  });

async function toTeamsStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Program adı"), "METU BİGG 2026");
  await user.click(
    screen.getByRole("button", { name: "Devam: Müfredat & fazlar" }),
  );
  await user.click(
    screen.getByRole("button", { name: "Onayla: Mentorluk kuralları" }),
  );
  await user.click(
    screen.getByRole("button", { name: "Varsayılan mentor kapasitesi: artır" }),
  );
  await user.click(screen.getByRole("button", { name: "Devam: Takımlar" }));
}

describe("ProgramLaunchView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createCoordinatorProgram).mockResolvedValue(
      coordinatorProgramDetail(),
    );
  });

  it("needs a program name before moving on", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramLaunchView />);

    expect(screen.getByText("Elif Demir (sen)")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Devam: Müfredat & fazlar" }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Program adı gerekli.");
    expect(screen.getByText("Adım 1 / 4")).toBeInTheDocument();
  });

  it("walks the wizard in English", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <InLocale locale="en">
        <ProgramLaunchView />
      </InLocale>,
    );

    expect(screen.getByText("Step 1 / 4")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Program name"), "BIGG 2026");
    await user.click(
      screen.getByRole("button", { name: "Next: Syllabus & phases" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Confirm: Mentorship rules" }),
    );
    expect(screen.getByText("Default mentor capacity")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next: Teams" }));
    await user.type(screen.getByLabelText("Team name 1"), "Pusula");
    await user.type(screen.getByLabelText("Team lead's email 1"), "ali@pusula");
    expect(screen.getByText("Invalid email")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create the program and its codes" }),
    ).toBeInTheDocument();
  });

  it("holds back a team row with an invalid email", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramLaunchView />);
    await toTeamsStep(user);

    await user.type(screen.getByLabelText("Takım adı 1"), "Tohum");
    await user.type(
      screen.getByLabelText("Takım yetkilisi e-postası 1"),
      "can@tohum",
    );
    expect(screen.getByText("Geçersiz e-posta")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Programı oluştur ve kodları üret" }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent("1 satırda hata var.");
    expect(createCoordinatorProgram).not.toHaveBeenCalled();
  });

  it("creates the program with its rules and teams, then opens it", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramLaunchView />);
    await toTeamsStep(user);

    await user.type(screen.getByLabelText("Takım adı 1"), "Kavşak");
    await user.type(
      screen.getByLabelText("Takım yetkilisi e-postası 1"),
      "deniz@kavsak.co",
    );
    expect(screen.getByText("BIGG26-····")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Programı oluştur ve kodları üret" }),
    );

    expect(createCoordinatorProgram).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "METU BİGG 2026",
        defaultMentorCapacity: 5,
        bottleneckFlagDays: 21,
        coordinatorIds: [],
        teams: [{ teamName: "Kavşak", leadEmail: "deniz@kavsak.co" }],
      }),
    );
    expect(push).toHaveBeenCalledWith("/coordinator/programs/program-1");
  });

  it("reads the phases from the uploaded syllabus and holds back one without dates", async () => {
    vi.mocked(uploadDocument).mockResolvedValue({ id: "doc-1" } as never);
    vi.mocked(extractSyllabusPhases).mockResolvedValue({
      pageCount: 18,
      phases: [
        {
          name: "Keşif",
          expectedOutput: "Problem doğrulama raporu",
          startDate: "2026-11-03",
          endDate: "2026-11-30",
        },
        {
          name: "Demo Day",
          expectedOutput: null,
          startDate: null,
          endDate: null,
        },
      ],
    });
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramLaunchView />);

    await user.type(screen.getByLabelText("Program adı"), "METU BİGG 2026");
    await user.type(screen.getByLabelText("Başlangıç"), "2026-11-03");
    await user.upload(screen.getByLabelText(/Program Müfredatı/), pdf());
    expect(
      await screen.findByText("METU-BIGG-2026-mufredat.pdf"),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Devam: Müfredat & fazlar" }),
    );

    expect(
      await screen.findByText(
        "Müfredattan 2 faz çıkarıldı. 1 fazın tarihi bulunamadı — kontrol edip onayla.",
      ),
    ).toBeInTheDocument();
    expect(extractSyllabusPhases).toHaveBeenCalledWith({
      documentId: "doc-1",
      startDate: "2026-11-03",
      endDate: null,
    });
    expect(screen.getByText("Tarih bulunamadı")).toBeInTheDocument();
    expect(screen.getByText("Tarih gir")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Onayla: Mentorluk kuralları" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "“Demo Day” fazının tarihlerini gir.",
    );

    await user.click(
      screen.getByRole("button", { name: "“Demo Day” fazını düzenle" }),
    );
    const open = screen.getByText("Faz 2").closest("div")!.parentElement!;
    await user.type(within(open).getByLabelText("Başlangıç"), "2027-09-01");
    await user.type(within(open).getByLabelText("Bitiş"), "2027-09-30");
    await user.click(
      screen.getByRole("button", { name: "Onayla: Mentorluk kuralları" }),
    );
    await user.click(screen.getByRole("button", { name: "Devam: Takımlar" }));
    await user.click(
      screen.getByRole("button", { name: "Programı oluştur ve kodları üret" }),
    );

    expect(createCoordinatorProgram).toHaveBeenCalledWith(
      expect.objectContaining({
        syllabusDocumentId: "doc-1",
        phases: [
          {
            name: "Keşif",
            startDate: "2026-11-03",
            endDate: "2026-11-30",
            expectedOutput: "Problem doğrulama raporu",
          },
          {
            name: "Demo Day",
            startDate: "2027-09-01",
            endDate: "2027-09-30",
            expectedOutput: null,
          },
        ],
      }),
    );
  });

  it("only takes a PDF as the syllabus", async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderWithQueryClient(<ProgramLaunchView />);

    await user.upload(
      screen.getByLabelText(/Program Müfredatı/),
      new File(["x"], "mufredat.docx", { type: "application/msword" }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Müfredatı PDF olarak yükle.",
    );
    expect(uploadDocument).not.toHaveBeenCalled();
  });

  it("enters the phases by hand, with expected outputs as chips", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramLaunchView />);

    await user.type(screen.getByLabelText("Program adı"), "METU BİGG 2026");
    await user.click(screen.getByRole("button", { name: "Manuel gir" }));
    expect(screen.getByText("Adım 2 / 4")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Onayla: Mentorluk kuralları" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent("1. fazın adını gir.");

    await user.click(
      screen.getByRole("button", { name: "“Adsız faz” fazını düzenle" }),
    );
    await user.type(screen.getByLabelText("Faz adı"), "Keşif");
    await user.type(
      screen.getByLabelText(/Beklenen çıktı/),
      "Pilot müşteri{Enter}Fiyat hipotezi{Enter}",
    );
    await user.click(
      screen.getByRole("button", { name: "“Pilot müşteri” çıktısını kaldır" }),
    );
    await user.click(screen.getByRole("button", { name: "Faz ekle" }));
    await user.type(screen.getAllByLabelText("Faz adı").at(-1)!, "Demo Day");
    await user.click(
      screen.getByRole("button", { name: "Onayla: Mentorluk kuralları" }),
    );
    await user.click(screen.getByRole("button", { name: "Devam: Takımlar" }));
    await user.click(
      screen.getByRole("button", { name: "Programı oluştur ve kodları üret" }),
    );

    expect(createCoordinatorProgram).toHaveBeenCalledWith(
      expect.objectContaining({
        syllabusDocumentId: null,
        phases: [
          {
            name: "Keşif",
            startDate: null,
            endDate: null,
            expectedOutput: "Fiyat hipotezi",
          },
          {
            name: "Demo Day",
            startDate: null,
            endDate: null,
            expectedOutput: null,
          },
        ],
      }),
    );
    expect(extractSyllabusPhases).not.toHaveBeenCalled();
  });
});
