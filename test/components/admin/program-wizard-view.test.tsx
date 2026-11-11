import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramWizardView } from "@/components/admin/program-wizard-view";
import type { AdminOverview, AdminUser } from "@/interfaces/admin-overview";
import { Edition } from "@/interfaces/edition";
import { ProgramType } from "@/interfaces/program";
import { UserAccountStatus, UserRole } from "@/interfaces/session";
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

function user(overrides: Partial<AdminUser>): AdminUser {
  return {
    id: "coordinator-1",
    email: "elif@odtu.test",
    fullName: "Elif Demir",
    role: UserRole.Coordinator,
    status: UserAccountStatus.Approved,
    organizationId: null,
    organizationName: null,
    jobTitle: null,
    ...overrides,
  };
}

const overview: AdminOverview = {
  programs: [],
  users: [
    user({}),
    user({
      id: "coordinator-2",
      fullName: "Burcu Şen",
      status: UserAccountStatus.Pending,
    }),
    user({ id: "mentor-1", fullName: "Ece Mentor", role: UserRole.Mentor }),
  ],
  mentorships: [],
  requests: [],
  bottlenecks: [],
  meetingsLast8Weeks: 0,
};

const editionState = vi.hoisted(() => ({ current: "ODTU" }));

vi.mock("@/hooks/use-edition", () => ({
  useEdition: () => editionState.current,
}));

const overviewState = vi.hoisted(() => ({
  error: null as Error | null,
  refetch: vi.fn(),
}));

vi.mock("@/hooks/use-admin-overview", () => ({
  ADMIN_OVERVIEW_QUERY_KEY: ["admin-overview"],
  useAdminOverview: () => ({
    data: overviewState.error ? undefined : overview,
    isLoading: false,
    error: overviewState.error,
    refetch: overviewState.refetch,
  }),
}));

async function reachSummary(clicker: ReturnType<typeof userEvent.setup>) {
  await clicker.click(screen.getByRole("radio", { name: /Office Hours/ }));
  await clicker.click(screen.getByRole("button", { name: /Devam/ }));
  await clicker.type(screen.getByLabelText("Program adı"), "ODTÜ OH 2027");
  await clicker.click(screen.getByRole("button", { name: /Devam/ }));
  await clicker.click(screen.getByRole("checkbox", { name: /Elif Demir/ }));
  await clicker.click(screen.getByRole("button", { name: /Devam/ }));
}

describe("admin Yeni Program Oluştur", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    overviewState.error = null;
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

    expect(screen.getByText("Elif Demir")).toBeInTheDocument();
    expect(screen.queryByText("Burcu Şen")).not.toBeInTheDocument();
    expect(screen.queryByText("Ece Mentor")).not.toBeInTheDocument();
    await clicker.click(screen.getByRole("button", { name: /Devam/ }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "En az bir koordinatör seç.",
    );
    await clicker.click(screen.getByRole("checkbox", { name: /Elif Demir/ }));
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

  it("says the coordinators did not load instead of saying there are none", async () => {
    overviewState.error = new Error("Sunucuya ulaşılamadı.");
    const clicker = userEvent.setup();
    renderWithQueryClient(<ProgramWizardView />);
    await clicker.click(screen.getByRole("radio", { name: /Office Hours/ }));
    await clicker.click(screen.getByRole("button", { name: /Devam/ }));
    await clicker.type(screen.getByLabelText("Program adı"), "ODTÜ OH 2027");
    await clicker.click(screen.getByRole("button", { name: /Devam/ }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Sunucuya ulaşılamadı.",
    );
    expect(
      screen.queryByText(/Onaylı koordinatör yok/),
    ).not.toBeInTheDocument();
    await clicker.click(screen.getByRole("button", { name: "Tekrar dene" }));
    expect(overviewState.refetch).toHaveBeenCalled();
  });
});
