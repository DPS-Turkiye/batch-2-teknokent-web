import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AssignCoordinatorDialog } from "@/components/admin/assign-coordinator-dialog";
import { CoordinatorCandidateStatus } from "@/interfaces/admin-coordinator";
import { UserRole } from "@/interfaces/session";
import {
  getCoordinatorCandidate,
  searchCoordinators,
} from "@/lib/client/admin-coordinators";
import {
  addProgramCoordinator,
  inviteProgramCoordinator,
} from "@/lib/client/coordinator-programs";
import { renderWithQueryClient } from "@test/test-utils";

// The e-mail field waits for typing to settle before it searches; leave room on a busy machine.
const PICKER_WAIT = 3000;

vi.mock("@/lib/client/admin-coordinators", () => ({
  searchCoordinators: vi.fn(),
  getCoordinatorCandidate: vi.fn(),
}));

vi.mock("@/lib/client/coordinator-programs", () => ({
  addProgramCoordinator: vi.fn(),
  inviteProgramCoordinator: vi.fn(),
}));

function renderDialog(onClose = vi.fn()) {
  renderWithQueryClient(
    <AssignCoordinatorDialog
      programId="p-1"
      programName="Hızlandırma 2026"
      onClose={onClose}
    />,
  );
  return onClose;
}

describe("AssignCoordinatorDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(searchCoordinators).mockResolvedValue([]);
    vi.mocked(addProgramCoordinator).mockResolvedValue([]);
    vi.mocked(inviteProgramCoordinator).mockResolvedValue([]);
  });

  it("lists nobody until searched, then adds the picked coordinator and closes", async () => {
    vi.mocked(searchCoordinators).mockResolvedValue([
      { id: "c-2", fullName: "Mert Kaya", email: "mert@teknokent.org" },
    ]);
    const user = userEvent.setup();
    const onClose = renderDialog();

    expect(screen.getByText(/Hızlandırma 2026 programına/)).toBeInTheDocument();
    expect(screen.queryByText("Mert Kaya")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Koordinatör e-postası"), "mer");
    await user.click(
      await screen.findByRole(
        "button",
        { name: "Mert Kaya ekle" },
        { timeout: PICKER_WAIT },
      ),
    );

    expect(searchCoordinators).toHaveBeenCalledWith("mer", "p-1");
    expect(addProgramCoordinator).toHaveBeenCalledWith("p-1", "c-2");
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("invites an e-mail with no account into the program", async () => {
    vi.mocked(getCoordinatorCandidate).mockResolvedValue({
      email: "yeni@teknokent.org",
      status: CoordinatorCandidateStatus.New,
      userId: null,
      fullName: null,
      role: null,
    });
    const user = userEvent.setup();
    const onClose = renderDialog();

    await user.type(
      screen.getByLabelText("Koordinatör e-postası"),
      "yeni@teknokent.org",
    );
    await user.type(
      await screen.findByLabelText("Ad soyad", {}, { timeout: PICKER_WAIT }),
      "Yeni Kişi",
    );
    await user.click(screen.getByRole("button", { name: "Davet et" }));

    expect(inviteProgramCoordinator).toHaveBeenCalledWith("p-1", {
      fullName: "Yeni Kişi",
      email: "yeni@teknokent.org",
    });
    expect(addProgramCoordinator).not.toHaveBeenCalled();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("does not offer to promote a mentor from here", async () => {
    vi.mocked(getCoordinatorCandidate).mockResolvedValue({
      email: "ece@mentor.org",
      status: CoordinatorCandidateStatus.Promotable,
      userId: "m-1",
      fullName: "Ece Mentor",
      role: UserRole.Mentor,
    });
    const user = userEvent.setup();
    renderDialog();

    await user.type(
      screen.getByLabelText("Koordinatör e-postası"),
      "ece@mentor.org",
    );

    expect(
      await screen.findByText(/Ece Mentor menton'da mentor olarak kayıtlı/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Davet et" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the dialog open when adding fails", async () => {
    vi.mocked(searchCoordinators).mockResolvedValue([
      { id: "c-2", fullName: "Mert Kaya", email: "mert@teknokent.org" },
    ]);
    vi.mocked(addProgramCoordinator).mockRejectedValue(
      new Error("Bu koordinatör programı zaten yürütüyor."),
    );
    const user = userEvent.setup();
    const onClose = renderDialog();

    await user.type(screen.getByLabelText("Koordinatör e-postası"), "mer");
    await user.click(
      await screen.findByRole(
        "button",
        { name: "Mert Kaya ekle" },
        { timeout: PICKER_WAIT },
      ),
    );

    await waitFor(() => expect(addProgramCoordinator).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
  });
});
