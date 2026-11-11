import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AssignToProgram } from "@/components/admin/assign-to-program";
import { ProgramMemberKind } from "@/interfaces/admin-overview";
import { assignToProgram } from "@/lib/client/admin-program-members";
import { adminProgram } from "@test/fixtures/admin-programs";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/admin-program-members", () => ({
  assignToProgram: vi.fn(),
}));

const program = adminProgram({ name: "METU Stars 2026" });

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
