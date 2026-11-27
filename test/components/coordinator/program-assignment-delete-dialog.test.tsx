import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramAssignmentDeleteDialog } from "@/components/coordinator/program-assignment-delete-dialog";
import type { ProgramAssignmentDelete } from "@/hooks/use-program-assignment-delete";
import { programAssignment } from "@test/fixtures/program-assignments";
import { renderWithQueryClient } from "@test/test-utils";

const start = vi.fn();
const cancel = vi.fn();
const confirm = vi.fn();

function remove(
  overrides: Partial<ProgramAssignmentDelete> = {},
): ProgramAssignmentDelete {
  return {
    deleting: programAssignment(),
    teamsWithFiles: 3,
    start,
    cancel,
    confirm,
    removing: false,
    ...overrides,
  };
}

describe("ProgramAssignmentDeleteDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing while no Ödev is being deleted", () => {
    renderWithQueryClient(
      <ProgramAssignmentDeleteDialog remove={remove({ deleting: null })} />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("says how many teams' files go with it and deletes on Sil", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramAssignmentDeleteDialog remove={remove()} />);

    const dialog = within(screen.getByRole("dialog", { name: "Ödevi sil" }));
    expect(
      dialog.getByText("“Pazar araştırması” tüm takımlardan kaldırılacak."),
    ).toBeInTheDocument();
    expect(
      dialog.getByText(
        "3 takım dosya yükledi; bunlar da silinecek. Bu işlem geri alınamaz.",
      ),
    ).toBeInTheDocument();

    await user.click(dialog.getByRole("button", { name: "Sil" }));
    expect(confirm).toHaveBeenCalledTimes(1);
    await user.click(dialog.getByRole("button", { name: "Vazgeç" }));
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("says so when no team has uploaded a file yet", () => {
    renderWithQueryClient(
      <ProgramAssignmentDeleteDialog remove={remove({ teamsWithFiles: 0 })} />,
    );
    expect(
      screen.getByText(
        "Henüz dosya yükleyen takım yok. Bu işlem geri alınamaz.",
      ),
    ).toBeInTheDocument();
  });

  it("holds both buttons while the delete is on its way", () => {
    renderWithQueryClient(
      <ProgramAssignmentDeleteDialog remove={remove({ removing: true })} />,
    );
    expect(screen.getByRole("button", { name: "Siliniyor…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Vazgeç" })).toBeDisabled();
  });
});
