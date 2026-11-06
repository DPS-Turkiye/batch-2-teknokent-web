import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AssignToProgram } from "@/components/admin/assign-to-program";
import {
  ProgramMemberKind,
  type AdminProgram,
} from "@/interfaces/admin-overview";
import { assignToProgram } from "@/lib/client/admin-program-members";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/admin-program-members", () => ({
  assignToProgram: vi.fn(),
}));

const program: AdminProgram = {
  id: "program-1",
  name: "METU Stars 2026",
  status: "ACTIVE",
  createdAt: "2026-01-01T00:00:00Z",
  coordinatorId: null,
  coordinatorName: null,
  startupCount: 0,
  acceptedMentorCount: 0,
  pendingMentorCount: 0,
  startups: [],
  mentors: [],
};

describe("AssignToProgram", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assignToProgram).mockResolvedValue(undefined);
  });

  it("adds the mentor to the chosen program", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <AssignToProgram
        kind={ProgramMemberKind.Mentors}
        targetId="mentor-1"
        programs={[program]}
      />,
    );

    const submit = screen.getByRole("button", { name: "Programa ata" });
    expect(submit).toBeDisabled();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Atanacak program" }),
      "program-1",
    );
    await user.click(submit);

    expect(assignToProgram).toHaveBeenCalledWith(
      "program-1",
      ProgramMemberKind.Mentors,
      "mentor-1",
    );
    expect(
      await screen.findByText("METU Stars 2026 programına eklendi."),
    ).toBeInTheDocument();
  });

  it("says so when no open program is left", () => {
    renderWithQueryClient(
      <AssignToProgram
        kind={ProgramMemberKind.Startups}
        targetId="org-1"
        programs={[]}
      />,
    );

    expect(
      screen.getByText("Eklenebilecek açık program yok."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
