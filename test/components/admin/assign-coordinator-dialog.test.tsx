import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AssignCoordinatorDialog } from "@/components/admin/assign-coordinator-dialog";
import {
  addProgramCoordinator,
  getProgramCoordinatorCandidates,
} from "@/lib/client/coordinator-programs";
import { renderWithQueryClient } from "@test/test-utils";

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

  it("points to Kullanıcılar when there is no approved coordinator", async () => {
    vi.mocked(getProgramCoordinatorCandidates).mockResolvedValue([]);
    renderWithQueryClient(
      <AssignCoordinatorDialog
        programId="p-1"
        programName="Hızlandırma 2026"
        onClose={vi.fn()}
      />,
    );

    expect(
      await screen.findByText(/Eklenebilecek onaylı koordinatör yok/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Kullanıcılar" })).toHaveAttribute(
      "href",
      "/admin/users",
    );
  });
});
