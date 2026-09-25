import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramLaunchView } from "@/components/coordinator/program-launch-view";
import { createCoordinatorProgram } from "@/lib/client/coordinator-programs";
import { coordinatorProgramDetail } from "@test/fixtures/coordinator-programs";
import { renderWithQueryClient } from "@test/test-utils";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => ({ fullName: "Elif Demir" }),
}));
vi.mock("@/lib/client/coordinator-programs", () => ({
  createCoordinatorProgram: vi.fn(),
}));

async function toTeamsStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Program adı"), "METU BİGG 2026");
  await user.click(
    screen.getByRole("button", { name: "Devam: Mentorluk kuralları" }),
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
      screen.getByRole("button", { name: "Devam: Mentorluk kuralları" }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Program adı gerekli.");
    expect(screen.getByText("Adım 1 / 3")).toBeInTheDocument();
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
});
