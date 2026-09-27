import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCoordinatorNotes } from "@/hooks/use-coordinator-notes";
import {
  addCoordinatorNote,
  deleteCoordinatorNote,
  getCoordinatorNotes,
} from "@/lib/client/coordinator-notes";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/coordinator-notes", () => ({
  addCoordinatorNote: vi.fn(),
  deleteCoordinatorNote: vi.fn(),
  getCoordinatorNotes: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

const note = {
  id: "n-1",
  mentorshipId: "m-1",
  authorName: "Elif Demir",
  body: "Nakit akışı riskli",
  createdAt: "2026-09-27T09:00:00Z",
  mine: true,
};

describe("useCoordinatorNotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCoordinatorNotes).mockResolvedValue([note]);
    vi.mocked(addCoordinatorNote).mockResolvedValue(note);
    vi.mocked(deleteCoordinatorNote).mockResolvedValue(undefined);
  });

  it("saves the trimmed draft and closes the composer", async () => {
    const { result } = renderHook(() => useCoordinatorNotes("m-1"), {
      wrapper,
    });
    await waitFor(() => expect(result.current.notes).toHaveLength(1));

    act(() => result.current.openComposer());
    expect(result.current.canSave).toBe(false);
    act(() => result.current.setDraft("  Nakit akışı riskli  "));
    act(() => result.current.save());

    await waitFor(() => expect(result.current.composing).toBe(false));
    expect(addCoordinatorNote).toHaveBeenCalledWith(
      "m-1",
      "Nakit akışı riskli",
    );
    expect(result.current.draft).toBe("");
  });

  it("deletes a note", async () => {
    const { result } = renderHook(() => useCoordinatorNotes("m-1"), {
      wrapper,
    });
    await waitFor(() => expect(result.current.notes).toHaveLength(1));

    act(() => result.current.remove("n-1"));

    await waitFor(() =>
      expect(deleteCoordinatorNote).toHaveBeenCalledWith(
        "n-1",
        expect.anything(),
      ),
    );
  });
});
