import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CoordinatorNotesSection } from "@/components/coordinator/coordinator-notes";
import type { CoordinatorNotes } from "@/hooks/use-coordinator-notes";
import { InLocale } from "@test/test-utils";

function stub(overrides: Partial<CoordinatorNotes> = {}): CoordinatorNotes {
  return {
    query: {} as CoordinatorNotes["query"],
    notes: [],
    composing: false,
    openComposer: vi.fn(),
    closeComposer: vi.fn(),
    draft: "",
    setDraft: vi.fn(),
    canSave: false,
    save: vi.fn(),
    saving: false,
    remove: vi.fn(),
    error: null,
    ...overrides,
  };
}

const note = (id: string, mine: boolean) => ({
  id,
  mentorshipId: "m-1",
  authorName: mine ? "Elif Demir" : "Burcu Şen",
  body: `Not ${id}`,
  createdAt: "2026-09-27T09:00:00Z",
  mine,
});

describe("CoordinatorNotesSection", () => {
  it("says when there are no notes", () => {
    render(<CoordinatorNotesSection notes={stub()} />);
    expect(screen.getByText("Henüz koordinatör notu yok.")).toBeInTheDocument();
  });

  it("reads in English", () => {
    render(
      <InLocale locale="en">
        <CoordinatorNotesSection
          notes={stub({ composing: true, notes: [note("b", true)] })}
        />
      </InLocale>,
    );
    expect(
      screen.getByPlaceholderText("Only coordinators can see this."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save the note" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Delete the note" }),
    ).toBeInTheDocument();
  });

  it("lists notes with their author and lets you delete only your own", async () => {
    const user = userEvent.setup();
    const notes = stub({ notes: [note("a", false), note("b", true)] });
    render(<CoordinatorNotesSection notes={notes} />);

    expect(screen.getByText("Not a")).toBeInTheDocument();
    expect(screen.getByText(/Burcu Şen/)).toBeInTheDocument();
    const deletes = screen.getAllByRole("button", { name: "Notu sil" });
    expect(deletes).toHaveLength(1);
    await user.click(deletes[0]);
    expect(notes.remove).toHaveBeenCalledWith("b");
  });

  it("saves from the composer", async () => {
    const user = userEvent.setup();
    const notes = stub({ composing: true, draft: "Yeni not", canSave: true });
    render(<CoordinatorNotesSection notes={notes} />);

    await user.click(screen.getByRole("button", { name: "Notu kaydet" }));
    expect(notes.save).toHaveBeenCalled();
  });
});
