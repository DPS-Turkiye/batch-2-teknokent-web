import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramWizardView } from "@/components/admin/program-wizard-view";
import type { AdminOverview, AdminUser } from "@/interfaces/admin-overview";
import { ProgramType } from "@/interfaces/program";
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
    role: "COORDINATOR",
    status: "APPROVED",
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
    user({ id: "coordinator-2", fullName: "Burcu Şen", status: "PENDING" }),
    user({ id: "mentor-1", fullName: "Ece Mentor", role: "MENTOR" }),
  ],
  mentorships: [],
  requests: [],
  bottlenecks: [],
  meetingsLast8Weeks: 0,
};

vi.mock("@/hooks/use-admin-overview", () => ({
  ADMIN_OVERVIEW_QUERY_KEY: ["admin-overview"],
  useAdminOverview: () => ({ data: overview, isLoading: false, error: null }),
}));

describe("admin Yeni Program Oluştur", () => {
  beforeEach(() => vi.clearAllMocks());

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
});
