import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramWizardView } from "@/components/admin/program-wizard-view";
import { CoordinatorCandidateStatus } from "@/interfaces/admin-coordinator";
import { Edition } from "@/interfaces/edition";
import { ProgramType } from "@/interfaces/program";
import {
  getCoordinatorCandidate,
  searchCoordinators,
} from "@/lib/client/admin-coordinators";
import { createCoordinatorProgram } from "@/lib/client/coordinator-programs";
import { coordinatorProgramDetail } from "@test/fixtures/coordinator-programs";
import { renderWithQueryClient } from "@test/test-utils";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/admin/programs/new",
}));

vi.mock("@/lib/client/coordinator-programs", () => ({
  createCoordinatorProgram: vi.fn(),
}));
vi.mock("@/lib/client/admin-coordinators", () => ({
  searchCoordinators: vi.fn(),
  getCoordinatorCandidate: vi.fn(),
}));

const elif = {
  id: "coordinator-1",
  fullName: "Elif Demir",
  email: "elif@odtu.test",
};

const editionState = vi.hoisted(() => ({ current: "ODTU" }));

vi.mock("@/hooks/use-edition", () => ({
  useEdition: () => editionState.current,
}));

async function reachSummary(clicker: ReturnType<typeof userEvent.setup>) {
  await clicker.click(screen.getByRole("radio", { name: /Office Hours/ }));
  await clicker.click(screen.getByRole("button", { name: /Devam/ }));
  await clicker.type(screen.getByLabelText("Program adı"), "ODTÜ OH 2027");
  await clicker.click(screen.getByRole("button", { name: /Devam/ }));
  await clicker.type(screen.getByLabelText("Koordinatör e-postası"), "eli");
  await clicker.click(
    await screen.findByRole("button", { name: "Elif Demir ekle" }),
  );
  await clicker.click(screen.getByRole("button", { name: /Devam/ }));
}

describe("admin Yeni Program Oluştur", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(searchCoordinators).mockResolvedValue([elif]);
    editionState.current = Edition.Odtu;
  });

  it("offers ODTÜ only peer mentoring and Office Hours", () => {
    renderWithQueryClient(<ProgramWizardView />);

    expect(
      screen.getAllByRole("radio").map((radio) => radio.getAttribute("value")),
    ).toEqual([ProgramType.PeerMentoring, ProgramType.OfficeHours]);
    expect(
      screen.getByRole("radio", { name: /Office Hours/ }),
    ).not.toBeChecked();
    expect(screen.queryByText("Girişim Mentörlüğü")).not.toBeInTheDocument();
  });

  it("starts Teknokent on its only type, so the admin can go straight on", async () => {
    editionState.current = Edition.Teknokent;
    const clicker = userEvent.setup();
    renderWithQueryClient(<ProgramWizardView />);

    expect(
      screen.getByRole("radio", { name: /Girişim Mentörlüğü/ }),
    ).toBeChecked();
    expect(screen.getAllByRole("radio")).toHaveLength(1);
    await clicker.click(screen.getByRole("button", { name: /Devam/ }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Program adı")).toBeInTheDocument();
    expect(screen.getByRole("listitem", { current: "step" })).toHaveTextContent(
      "Program bilgileri",
    );
  });

  it("saves a Teknokent draft on its only type with a coordinator picked by email", async () => {
    editionState.current = Edition.Teknokent;
    const detail = coordinatorProgramDetail();
    vi.mocked(createCoordinatorProgram).mockResolvedValue({
      ...detail,
      program: { ...detail.program, id: "new-tk" },
    });
    const clicker = userEvent.setup();
    renderWithQueryClient(<ProgramWizardView />);

    await clicker.click(screen.getByRole("button", { name: /Devam/ }));
    await clicker.type(screen.getByLabelText("Program adı"), "Teknokent 2027");
    await clicker.click(screen.getByRole("button", { name: /Devam/ }));
    await clicker.type(screen.getByLabelText("Koordinatör e-postası"), "eli");
    await clicker.click(
      await screen.findByRole("button", { name: "Elif Demir ekle" }),
    );
    await clicker.click(screen.getByRole("button", { name: /Devam/ }));
    await clicker.click(
      screen.getByRole("button", { name: "Taslak olarak kaydet" }),
    );

    expect(createCoordinatorProgram).toHaveBeenCalledWith({
      type: ProgramType.StartupMentoring,
      name: "Teknokent 2027",
      description: null,
      startDate: null,
      endDate: null,
      coordinatorIds: ["coordinator-1"],
      newCoordinators: [],
    });
  });

  it("walks type, details, coordinators and summary, then saves a draft", async () => {
    const detail = coordinatorProgramDetail();
    vi.mocked(createCoordinatorProgram).mockResolvedValue({
      ...detail,
      program: { ...detail.program, id: "new-1", name: "ODTÜ Akran 2027" },
    });
    const clicker = userEvent.setup();
    renderWithQueryClient(<ProgramWizardView />);

    await clicker.click(screen.getByRole("button", { name: /Devam/ }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Bir program türü seç.",
    );
    await clicker.click(
      screen.getByRole("radio", { name: /Akran Mentörlüğü/ }),
    );
    await clicker.click(screen.getByRole("button", { name: /Devam/ }));

    await clicker.type(
      screen.getByLabelText("Program adı"),
      "  ODTÜ Akran 2027 ",
    );
    await clicker.click(screen.getByRole("button", { name: /Devam/ }));

    expect(screen.queryByText("Elif Demir")).not.toBeInTheDocument();
    await clicker.click(screen.getByRole("button", { name: /Devam/ }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "En az bir koordinatör ekle.",
    );
    await clicker.type(screen.getByLabelText("Koordinatör e-postası"), "eli");
    await clicker.click(
      await screen.findByRole("button", { name: "Elif Demir ekle" }),
    );
    await clicker.click(screen.getByRole("button", { name: /Devam/ }));

    expect(screen.getByText("Akran Mentörlüğü")).toBeInTheDocument();
    expect(screen.getByText("Belirtilmedi")).toBeInTheDocument();
    await clicker.click(
      screen.getByRole("button", { name: "Taslak olarak kaydet" }),
    );

    expect(createCoordinatorProgram).toHaveBeenCalledWith({
      type: ProgramType.PeerMentoring,
      name: "ODTÜ Akran 2027",
      description: null,
      startDate: null,
      endDate: null,
      coordinatorIds: ["coordinator-1"],
      newCoordinators: [],
    });
    expect(push).toHaveBeenCalledWith("/admin/programs/new-1");
  });

  it("saves one draft however often the button is pressed", async () => {
    const detail = coordinatorProgramDetail();
    vi.mocked(createCoordinatorProgram).mockResolvedValue({
      ...detail,
      program: { ...detail.program, id: "new-2" },
    });
    const clicker = userEvent.setup();
    renderWithQueryClient(<ProgramWizardView />);
    await reachSummary(clicker);

    const save = screen.getByRole("button", { name: "Taslak olarak kaydet" });
    await clicker.dblClick(save);

    expect(createCoordinatorProgram).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByRole("button", { name: "Kaydediliyor…" }),
    ).toBeDisabled();
  });

  it("drops a failed save's message once the admin goes back, and saves again", async () => {
    vi.mocked(createCoordinatorProgram).mockRejectedValueOnce(
      new Error("Aynı adda bir program var."),
    );
    const clicker = userEvent.setup();
    renderWithQueryClient(<ProgramWizardView />);
    await reachSummary(clicker);

    await clicker.click(
      screen.getByRole("button", { name: "Taslak olarak kaydet" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Aynı adda bir program var.",
    );
    await clicker.click(screen.getByRole("button", { name: "Geri" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await clicker.click(screen.getByRole("button", { name: /Devam/ }));
    await clicker.click(
      screen.getByRole("button", { name: "Taslak olarak kaydet" }),
    );
    expect(createCoordinatorProgram).toHaveBeenCalledTimes(2);
  });

  it("invites an e-mail with no account and sends it with the program", async () => {
    vi.mocked(searchCoordinators).mockResolvedValue([]);
    vi.mocked(getCoordinatorCandidate).mockResolvedValue({
      email: "yeni@odtu.test",
      status: CoordinatorCandidateStatus.New,
      userId: null,
      fullName: null,
      role: null,
    });
    const detail = coordinatorProgramDetail();
    vi.mocked(createCoordinatorProgram).mockResolvedValue(detail);
    const clicker = userEvent.setup();
    renderWithQueryClient(<ProgramWizardView />);
    await clicker.click(screen.getByRole("radio", { name: /Office Hours/ }));
    await clicker.click(screen.getByRole("button", { name: /Devam/ }));
    await clicker.type(screen.getByLabelText("Program adı"), "ODTÜ OH 2027");
    await clicker.click(screen.getByRole("button", { name: /Devam/ }));

    await clicker.type(
      screen.getByLabelText("Koordinatör e-postası"),
      "yeni@odtu.test",
    );
    await clicker.type(await screen.findByLabelText("Ad soyad"), "Yeni Kişi");
    await clicker.click(screen.getByRole("button", { name: "Davet et" }));
    await clicker.click(screen.getByRole("button", { name: /Devam/ }));

    expect(screen.getByText("Davet edilecek")).toBeInTheDocument();
    await clicker.click(
      screen.getByRole("button", { name: "Taslak olarak kaydet" }),
    );
    expect(createCoordinatorProgram).toHaveBeenCalledWith({
      type: ProgramType.OfficeHours,
      name: "ODTÜ OH 2027",
      description: null,
      startDate: null,
      endDate: null,
      coordinatorIds: [],
      newCoordinators: [{ fullName: "Yeni Kişi", email: "yeni@odtu.test" }],
    });
  });
});
