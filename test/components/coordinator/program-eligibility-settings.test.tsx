import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramSettingsView } from "@/components/coordinator/program-settings-view";
import {
  addProgramEligibleEmails,
  getCoordinatorProgram,
  getProgramEligibleEmails,
  removeProgramEligibleEmail,
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

const entry = (id: string, email: string, registered = false) => ({
  id,
  email,
  addedAt: "2026-11-07T10:00:00Z",
  registered,
});

function rosterProgram() {
  const detail = coordinatorProgramDetail();
  return {
    ...detail,
    rules: {
      ...detail.rules,
      eligibleEmailDomain: "metu.edu.tr",
      rosterOnly: true,
    },
  };
}

describe("program eligibility settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getProgramEligibleEmails).mockResolvedValue([]);
  });

  it("saves the domain and the two switches with the other settings", async () => {
    vi.mocked(getCoordinatorProgram).mockResolvedValue(
      coordinatorProgramDetail(),
    );
    vi.mocked(updateCoordinatorProgram).mockResolvedValue(
      coordinatorProgramDetail(),
    );
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramSettingsView programId="program-1" />);

    const section = await screen.findByRole("region", { name: "Katılım" });
    await user.type(
      within(section).getByLabelText("İzin verilen e-posta uzantısı"),
      "metu.edu.tr",
    );
    await user.click(
      within(section).getByRole("switch", { name: /Yalnızca listedekiler/ }),
    );
    await user.click(
      within(section).getByRole("switch", { name: /Bireysel katılımcılar/ }),
    );
    await user.click(
      screen.getByRole("button", { name: "Değişiklikleri kaydet" }),
    );

    expect(updateCoordinatorProgram).toHaveBeenCalledWith(
      "program-1",
      expect.objectContaining({
        eligibleEmailDomain: "metu.edu.tr",
        rosterOnly: true,
        individualMentees: true,
      }),
    );
  });

  it("hides the list until the program is limited to it", async () => {
    vi.mocked(getCoordinatorProgram).mockResolvedValue(
      coordinatorProgramDetail(),
    );
    renderWithQueryClient(<ProgramSettingsView programId="program-1" />);

    await screen.findByRole("region", { name: "Katılım" });
    expect(
      screen.queryByLabelText("E-posta adreslerini yapıştır"),
    ).not.toBeInTheDocument();
    expect(getProgramEligibleEmails).not.toHaveBeenCalled();
  });

  it("adds pasted addresses and removes one from the list", async () => {
    vi.mocked(getCoordinatorProgram).mockResolvedValue(rosterProgram());
    vi.mocked(getProgramEligibleEmails).mockResolvedValue([
      entry("e-1", "e1@metu.edu.tr", true),
    ]);
    vi.mocked(addProgramEligibleEmails).mockResolvedValue([
      entry("e-1", "e1@metu.edu.tr", true),
      entry("e-2", "e2@metu.edu.tr"),
      entry("e-3", "e3@metu.edu.tr"),
    ]);
    vi.mocked(removeProgramEligibleEmail).mockResolvedValue([
      entry("e-2", "e2@metu.edu.tr"),
      entry("e-3", "e3@metu.edu.tr"),
    ]);
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramSettingsView programId="program-1" />);

    expect(await screen.findByText("e1@metu.edu.tr")).toBeInTheDocument();
    expect(screen.getByText("Kayıt oldu")).toBeInTheDocument();

    await user.type(
      screen.getByLabelText("E-posta adreslerini yapıştır"),
      "e2@metu.edu.tr\ne3@metu.edu.tr, ",
    );
    await user.click(screen.getByRole("button", { name: "Listeye ekle" }));

    expect(addProgramEligibleEmails).toHaveBeenCalledWith("program-1", [
      "e2@metu.edu.tr",
      "e3@metu.edu.tr",
    ]);
    expect(await screen.findByText("Listede 3 adres")).toBeInTheDocument();
    expect(screen.getByLabelText("E-posta adreslerini yapıştır")).toHaveValue(
      "",
    );

    await user.click(
      screen.getByRole("button", {
        name: "e1@metu.edu.tr adresini listeden kaldır",
      }),
    );
    expect(removeProgramEligibleEmail).toHaveBeenCalledWith("program-1", "e-1");
    expect(await screen.findByText("Listede 2 adres")).toBeInTheDocument();
  });

  it("does not offer to add an empty paste", async () => {
    vi.mocked(getCoordinatorProgram).mockResolvedValue(rosterProgram());
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramSettingsView programId="program-1" />);

    expect(
      await screen.findByText("Listeye henüz adres eklenmedi."),
    ).toBeInTheDocument();
    const add = screen.getByRole("button", { name: "Listeye ekle" });
    expect(add).toBeDisabled();
    await user.type(
      screen.getByLabelText("E-posta adreslerini yapıştır"),
      "  ",
    );
    expect(add).toBeDisabled();
  });
});
