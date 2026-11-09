import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramAcademicsView } from "@/components/coordinator/program-academics-view";
import { ProgramType } from "@/interfaces/program";
import { getProgramAcademics } from "@/lib/client/admin-academics";
import { getCoordinatorProgram } from "@/lib/client/coordinator-programs";
import { adminAcademic } from "@test/fixtures/admin-academics";
import { coordinatorProgramDetail } from "@test/fixtures/coordinator-programs";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("next/navigation", () => ({
  usePathname: () => "/coordinator/programs/program-1/academics",
  useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock("@/lib/client/coordinator-programs", () => ({
  getCoordinatorProgram: vi.fn(),
  launchCoordinatorProgram: vi.fn(),
}));
vi.mock("@/lib/client/admin-academics", () => ({
  getProgramAcademics: vi.fn(),
  getAdminAcademics: vi.fn(),
}));

describe("Office Hours › Katılımcılar › Akademisyenler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const detail = coordinatorProgramDetail();
    vi.mocked(getCoordinatorProgram).mockResolvedValue({
      ...detail,
      program: { ...detail.program, type: ProgramType.OfficeHours },
    });
    vi.mocked(getProgramAcademics).mockResolvedValue([
      adminAcademic({ email: null, lastLoginAt: null }),
      adminAcademic({
        personId: "p-zeynep",
        userId: null,
        fullName: "Zeynep Kara",
        academicTitle: "Prof. Dr.",
        email: null,
        signedIn: false,
        lastLoginAt: null,
        adviseeCount: 0,
      }),
    ]);
  });

  it("lists the program's academicians without e-mail, under the Akademisyenler sub-tab", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramAcademicsView programId="program-1" />);

    expect(await screen.findByText("Doç. Dr. Ali Demir")).toBeInTheDocument();
    expect(getProgramAcademics).toHaveBeenCalledWith("program-1");
    expect(
      screen.getByText(/tüm aktif akademisyenleri davetsiz katılır/),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Mühendislik Fakültesi").length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText("Giriş yaptı")).toBeInTheDocument();
    const sub = screen.getByRole("navigation", { name: "Katılımcılar" });
    expect(
      within(sub).getByRole("link", { name: /Akademisyenler/ }),
    ).toHaveAttribute("aria-current", "page");

    await user.click(
      screen.getByRole("button", { name: "Ayrıntılar: Ali Demir" }),
    );
    const drawer = screen.getByRole("dialog", {
      name: "Akademisyen: Ali Demir",
    });
    expect(within(drawer).queryByText("E-posta")).not.toBeInTheDocument();
    expect(within(drawer).getByText("3 danışan")).toBeInTheDocument();
  });
});
