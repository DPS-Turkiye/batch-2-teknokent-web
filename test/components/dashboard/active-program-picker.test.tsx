import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ActiveProgramPicker } from "@/components/dashboard/active-program-picker";
import { ToastProvider } from "@/components/providers/toast-provider";
import type { OrganizationPrograms } from "@/interfaces/program";

const mockUseOrganizationPrograms = vi.fn();
const mockMutate = vi.fn();
const mockUseSetActiveProgram = vi.fn();

vi.mock("@/hooks/use-programs", () => ({
  useOrganizationPrograms: () => mockUseOrganizationPrograms(),
  useSetActiveProgram: () => mockUseSetActiveProgram(),
}));

const PROGRAMS: OrganizationPrograms["programs"] = [
  {
    id: "prog-1",
    name: "metustarts 2026",
    coordinatorName: "Demo Koordinatör",
  },
  { id: "prog-2", name: "Seed 2026", coordinatorName: "Demo Koordinatör" },
];

function query(overrides: Record<string, unknown> = {}) {
  return { data: undefined, isLoading: false, error: null, ...overrides };
}

function renderPicker() {
  return render(
    <ToastProvider>
      <ActiveProgramPicker />
    </ToastProvider>,
  );
}

beforeEach(() => {
  mockUseOrganizationPrograms.mockReset();
  mockMutate.mockReset();
  mockUseSetActiveProgram.mockReturnValue({
    mutate: mockMutate,
    isPending: false,
    error: null,
  });
});

describe("ActiveProgramPicker", () => {
  // A coordinator assigns programs; with none assigned there is nothing to
  // choose between, so no picker should be offered at all.
  it("explains the coordinator assigns programs when there are none", () => {
    mockUseOrganizationPrograms.mockReturnValue(
      query({ data: { programs: [], activeProgramId: null } }),
    );

    renderPicker();

    expect(
      screen.getByText(/Henüz bir programa eklenmediniz/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows the no-program label until a choice is made", () => {
    mockUseOrganizationPrograms.mockReturnValue(
      query({ data: { programs: PROGRAMS, activeProgramId: null } }),
    );

    renderPicker();

    expect(
      screen.getByRole("button", { name: /Bir programa dahil değilim/ }),
    ).toBeInTheDocument();
  });

  it("names the active program when one is chosen", () => {
    mockUseOrganizationPrograms.mockReturnValue(
      query({ data: { programs: PROGRAMS, activeProgramId: "prog-2" } }),
    );

    renderPicker();

    expect(
      screen.getByRole("button", { name: /Seed 2026/ }),
    ).toBeInTheDocument();
  });

  it("saves the program the startup picks", async () => {
    const user = userEvent.setup();
    mockUseOrganizationPrograms.mockReturnValue(
      query({ data: { programs: PROGRAMS, activeProgramId: null } }),
    );

    renderPicker();
    await user.click(screen.getByRole("button", { name: /dahil değilim/ }));
    await user.click(screen.getByRole("option", { name: /metustarts 2026/ }));

    expect(mockMutate).toHaveBeenCalledWith("prog-1", expect.any(Object));
  });

  it("clears the choice with null when no-program is picked", async () => {
    const user = userEvent.setup();
    mockUseOrganizationPrograms.mockReturnValue(
      query({ data: { programs: PROGRAMS, activeProgramId: "prog-1" } }),
    );

    renderPicker();
    await user.click(screen.getByRole("button", { name: /metustarts 2026/ }));
    await user.click(
      screen.getByRole("option", { name: /Bir programa dahil değilim/ }),
    );

    expect(mockMutate).toHaveBeenCalledWith(null, expect.any(Object));
  });

  // Re-picking the current program would be a pointless round trip.

  it("surfaces a failed save through the shared toast", async () => {
    const user = userEvent.setup();
    mockUseOrganizationPrograms.mockReturnValue(
      query({ data: { programs: PROGRAMS, activeProgramId: null } }),
    );
    mockMutate.mockImplementation(
      (
        _programId: string | null,
        options: { onError: (error: Error) => void },
      ) => options.onError(new Error("Program seçiminiz kaydedilemedi.")),
    );
    mockUseSetActiveProgram.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: null,
    });

    renderPicker();
    await user.click(screen.getByRole("button", { name: /dahil değilim/ }));
    await user.click(screen.getByRole("option", { name: /metustarts 2026/ }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Program seçiminiz kaydedilemedi.",
    );
  });

  it("surfaces a failed load", () => {
    mockUseOrganizationPrograms.mockReturnValue(
      query({ error: new Error("Programlarınız yüklenemedi.") }),
    );

    renderPicker();

    expect(screen.getByText("Programlarınız yüklenemedi.")).toBeInTheDocument();
  });
});
