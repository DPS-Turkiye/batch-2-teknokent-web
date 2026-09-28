import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AssignCoordinatorDialog } from "@/components/admin/assign-coordinator-dialog";
import { CoordinatorCandidateStatus } from "@/interfaces/admin-coordinator";
import { UserAccountStatus } from "@/interfaces/session";
import {
  addCoordinator,
  getCoordinatorCandidate,
} from "@/lib/client/admin-coordinators";
import {
  addProgramCoordinator,
  getProgramCoordinatorCandidates,
} from "@/lib/client/coordinator-programs";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/admin-coordinators", () => ({
  getCoordinatorCandidate: vi.fn(),
  addCoordinator: vi.fn(),
}));

vi.mock("@/lib/client/coordinator-programs", () => ({
  getProgramCoordinatorCandidates: vi.fn(),
  addProgramCoordinator: vi.fn(),
}));

describe("AssignCoordinatorDialog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("adds the picked coordinator to the program and closes", async () => {
    vi.mocked(getProgramCoordinatorCandidates).mockResolvedValue([
      { id: "c-1", fullName: "Elif Demir", owner: false },
      { id: "c-2", fullName: "Mert Kaya", owner: false },
    ]);
    vi.mocked(addProgramCoordinator).mockResolvedValue([
      { id: "c-2", fullName: "Mert Kaya", owner: false },
    ]);
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithQueryClient(
      <AssignCoordinatorDialog
        programId="p-1"
        programName="Hızlandırma 2026"
        onClose={onClose}
      />,
    );

    expect(screen.getByText(/Hızlandırma 2026 programına/)).toBeInTheDocument();
    const save = screen.getByRole("button", { name: "Programa ekle" });
    expect(save).toBeDisabled();

    await user.click(await screen.findByLabelText("Mert Kaya"));
    await user.click(save);

    expect(addProgramCoordinator).toHaveBeenCalledWith("p-1", "c-2");
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("adds someone not in the system by email, then puts them on the program", async () => {
    vi.mocked(getProgramCoordinatorCandidates).mockResolvedValue([
      { id: "c-1", fullName: "Elif Demir", owner: false },
    ]);
    vi.mocked(getCoordinatorCandidate).mockResolvedValue({
      email: "yeni@teknokent.org",
      status: CoordinatorCandidateStatus.New,
      userId: null,
      fullName: null,
      role: null,
    });
    vi.mocked(addCoordinator).mockResolvedValue({
      id: "c-9",
      email: "yeni@teknokent.org",
      fullName: "Yeni Kişi",
      status: UserAccountStatus.Approved,
      outcome: CoordinatorCandidateStatus.New,
    });
    vi.mocked(addProgramCoordinator).mockResolvedValue([]);
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithQueryClient(
      <AssignCoordinatorDialog
        programId="p-1"
        programName="Hızlandırma 2026"
        onClose={onClose}
      />,
    );

    await user.click(
      await screen.findByRole("button", {
        name: "Listede yok mu? E-posta ile ekle",
      }),
    );
    await user.type(screen.getByLabelText("E-posta"), "yeni@teknokent.org");
    await user.type(await screen.findByLabelText("Ad soyad"), "Yeni Kişi");
    await user.click(screen.getByRole("button", { name: "Programa ekle" }));

    await waitFor(() =>
      expect(addProgramCoordinator).toHaveBeenCalledWith("p-1", "c-9"),
    );
    expect(addCoordinator).toHaveBeenCalledWith({
      fullName: "Yeni Kişi",
      email: "yeni@teknokent.org",
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("goes straight to the email form when there is no approved coordinator", async () => {
    vi.mocked(getProgramCoordinatorCandidates).mockResolvedValue([]);
    renderWithQueryClient(
      <AssignCoordinatorDialog
        programId="p-1"
        programName="Hızlandırma 2026"
        onClose={vi.fn()}
      />,
    );

    expect(await screen.findByLabelText("E-posta")).toBeInTheDocument();
    expect(screen.getByText(/Onaylı koordinatör yok/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Listeden seç" }),
    ).not.toBeInTheDocument();
  });
});
