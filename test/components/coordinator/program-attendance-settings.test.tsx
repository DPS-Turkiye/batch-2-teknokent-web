import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramSettingsView } from "@/components/coordinator/program-settings-view";
import {
  getCoordinatorProgram,
  updateCoordinatorProgram,
} from "@/lib/client/coordinator-programs";
import { coordinatorProgramDetail } from "@test/fixtures/coordinator-programs";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/coordinator/programs/program-1/settings"),
}));

vi.mock("@/lib/client/coordinator-programs", () => ({
  getCoordinatorProgram: vi.fn(),
  updateCoordinatorProgram: vi.fn(),
  replaceCoordinatorProgramPhases: vi.fn(),
  setCoordinatorProgramArchived: vi.fn(),
  addProgramCoordinator: vi.fn(),
  removeProgramCoordinator: vi.fn(),
  getProgramTeams: vi.fn(),
  getProgramEligibleEmails: vi.fn(),
  addProgramEligibleEmails: vi.fn(),
  removeProgramEligibleEmail: vi.fn(),
}));

describe("program attendance setting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCoordinatorProgram).mockResolvedValue(
      coordinatorProgramDetail(),
    );
    vi.mocked(updateCoordinatorProgram).mockResolvedValue(
      coordinatorProgramDetail(),
    );
  });

  it("is on by default and saves turning attendance off", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramSettingsView programId="program-1" />);

    const toggle = await screen.findByRole("switch", { name: /Yoklama al/ });
    expect(toggle).toBeChecked();
    await user.click(toggle);
    await user.click(
      screen.getByRole("button", { name: "Değişiklikleri kaydet" }),
    );

    expect(updateCoordinatorProgram).toHaveBeenCalledWith(
      "program-1",
      expect.objectContaining({ attendanceEnabled: false }),
    );
  });
});
