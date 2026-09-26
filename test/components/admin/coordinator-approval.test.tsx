import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ApproveCoordinatorDialog,
  CoordinatorApplicationDialog,
} from "@/components/admin/coordinator-approval";
import type { AdminProgram, AdminUser } from "@/interfaces/admin-overview";
import { UserAccountStatus } from "@/interfaces/session";
import { decidePendingAccount } from "@/lib/client/admin-users";
import { addProgramCoordinator } from "@/lib/client/coordinator-programs";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/admin-users", () => ({
  decidePendingAccount: vi.fn(),
  getPendingAccounts: vi.fn(),
}));

vi.mock("@/lib/client/coordinator-programs", () => ({
  addProgramCoordinator: vi.fn(),
}));

const user: AdminUser = {
  id: "user-1",
  email: "okan.yurt@bigg.gov.tr",
  fullName: "Okan Yurt",
  role: "COORDINATOR",
  status: "PENDING",
  organizationId: null,
  organizationName: "BİGG Ankara",
  jobTitle: null,
  createdAt: "2026-09-24T00:00:00Z",
};

const program = {
  id: "program-1",
  name: "BİGG Ankara 2027",
  status: "ACTIVE",
  createdAt: "2026-01-01T00:00:00Z",
  coordinatorId: "other",
  coordinatorName: "Elif Demir",
  startupCount: 0,
  acceptedMentorCount: 0,
  pendingMentorCount: 0,
  startups: [],
  mentors: [],
} satisfies AdminProgram;

describe("Coordinator approval", () => {
  beforeEach(() => vi.clearAllMocks());

  it("opens the assignment step from the application card", async () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();
    renderWithQueryClient(
      <CoordinatorApplicationDialog
        user={user}
        programs={[]}
        appliedLabel="2 gün önce"
        busy={false}
        onClose={vi.fn()}
        onReject={onReject}
        onApprove={onApprove}
      />,
    );

    expect(screen.getByText("BİGG Ankara")).toBeInTheDocument();
    expect(screen.getByText("Başka programa atanmamış")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Reddet" }));
    expect(onReject).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole("button", { name: "Onayla" }));
    expect(onApprove).toHaveBeenCalledOnce();
  });

  it("approves the account and assigns the chosen program", async () => {
    vi.mocked(decidePendingAccount).mockResolvedValue({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: "COORDINATOR" as never,
        status: UserAccountStatus.Approved,
      },
      inviteCode: null,
    });
    vi.mocked(addProgramCoordinator).mockResolvedValue([]);
    const onApproved = vi.fn();
    renderWithQueryClient(
      <ApproveCoordinatorDialog
        user={user}
        programs={[program]}
        onClose={vi.fn()}
        onApproved={onApproved}
        onFailed={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Onayla ve programa ata" }),
    ).toBeDisabled();
    await userEvent.click(screen.getByLabelText("Atanacak program"));
    await userEvent.click(
      screen.getByRole("button", { name: "BİGG Ankara 2027" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Onayla ve programa ata" }),
    );

    expect(decidePendingAccount).toHaveBeenCalledWith(
      "user-1",
      UserAccountStatus.Approved,
    );
    expect(addProgramCoordinator).toHaveBeenCalledWith("program-1", "user-1");
    expect(onApproved).toHaveBeenCalledWith("BİGG Ankara 2027");
  });

  it("does not offer a program this person already runs", async () => {
    renderWithQueryClient(
      <ApproveCoordinatorDialog
        user={user}
        programs={[
          program,
          {
            ...program,
            id: "program-2",
            name: "ODTÜ Stars 2026",
            coordinatorId: user.id,
          },
        ]}
        onClose={vi.fn()}
        onApproved={vi.fn()}
        onFailed={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByLabelText("Atanacak program"));
    expect(
      screen.getByRole("button", {
        name: "ODTÜ Stars 2026 · zaten koordinatör",
      }),
    ).toBeDisabled();
  });
});
