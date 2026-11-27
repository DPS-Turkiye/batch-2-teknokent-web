import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramAssignmentEditDialog } from "@/components/coordinator/program-assignment-edit-dialog";
import type { ProgramAssignmentEdit } from "@/hooks/use-program-assignment-edit";
import { AssignmentDraftProblem } from "@/lib/program-assignments";
import { programAssignment } from "@test/fixtures/program-assignments";
import { renderWithQueryClient } from "@test/test-utils";

const start = vi.fn();
const cancel = vi.fn();
const setField = vi.fn();
const save = vi.fn();

function edit(
  overrides: Partial<ProgramAssignmentEdit> = {},
): ProgramAssignmentEdit {
  return {
    editing: programAssignment(),
    draft: {
      title: "Pazar araştırması",
      description: "Hedef pazarı anlat.",
      dueDate: "2026-12-01",
    },
    minDueDate: "2026-11-16",
    start,
    cancel,
    setField,
    problem: null,
    canSave: true,
    save,
    saving: false,
    ...overrides,
  };
}

describe("ProgramAssignmentEditDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing while no Ödev is being edited", () => {
    renderWithQueryClient(
      <ProgramAssignmentEditDialog
        edit={edit({ editing: null, draft: null })}
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("edits the title, description and due date and saves for every team", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramAssignmentEditDialog edit={edit()} />);

    const dialog = within(
      screen.getByRole("dialog", { name: "Ödevi düzenle" }),
    );
    expect(
      dialog.getByText(/Değişiklik tüm takımların ödevine yansır/),
    ).toBeInTheDocument();
    expect(dialog.getByLabelText("Başlık")).toHaveValue("Pazar araştırması");
    await user.type(dialog.getByLabelText("Başlık"), "!");
    expect(setField).toHaveBeenCalledWith("title", "Pazar araştırması!");
    await user.type(dialog.getByLabelText("Açıklama"), "!");
    expect(setField).toHaveBeenCalledWith(
      "description",
      "Hedef pazarı anlat.!",
    );
    expect(dialog.getByLabelText("Teslim tarihi")).toHaveAttribute(
      "min",
      "2026-11-16",
    );
    await user.clear(dialog.getByLabelText("Teslim tarihi"));
    expect(setField).toHaveBeenCalledWith("dueDate", "");

    await user.click(dialog.getByRole("button", { name: "Kaydet" }));
    expect(save).toHaveBeenCalled();
    await user.click(dialog.getByRole("button", { name: "Vazgeç" }));
    expect(cancel).toHaveBeenCalled();
  });

  it("says what is wrong and holds the save, and shows it is saving", () => {
    const { rerender } = renderWithQueryClient(
      <ProgramAssignmentEditDialog
        edit={edit({
          problem: AssignmentDraftProblem.DuePassed,
          canSave: false,
        })}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Teslim tarihi bugünden önce olamaz.",
    );
    expect(screen.getByRole("button", { name: "Kaydet" })).toBeDisabled();

    rerender(
      <ProgramAssignmentEditDialog
        edit={edit({ saving: true, canSave: false })}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Kaydediliyor…" }),
    ).toBeDisabled();
  });

  it("puts focus on the title, ties the problem to the fields, and closes on Escape", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <ProgramAssignmentEditDialog
        edit={edit({
          problem: AssignmentDraftProblem.DuePassed,
          canSave: false,
        })}
      />,
    );

    expect(screen.getByLabelText("Başlık")).toHaveFocus();
    const problemId = screen.getByRole("alert").id;
    expect(screen.getByLabelText("Teslim tarihi")).toHaveAttribute(
      "aria-describedby",
      problemId,
    );
    await user.keyboard("{Escape}");
    expect(cancel).toHaveBeenCalled();
  });

  it("closes on a click outside, but not on one inside", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramAssignmentEditDialog edit={edit()} />);

    await user.click(screen.getByLabelText("Başlık"));
    expect(cancel).not.toHaveBeenCalled();
    await user.click(screen.getByRole("dialog"));
    expect(cancel).toHaveBeenCalled();
  });
});
