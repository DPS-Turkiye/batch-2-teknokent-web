import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Toaster } from "@/components/common/toaster";
import { useProgramAssignmentDelete } from "@/hooks/use-program-assignment-delete";
import { deleteProgramAssignment } from "@/lib/client/program-assignments";
import { programAssignment } from "@test/fixtures/program-assignments";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/program-assignments", () => ({
  deleteProgramAssignment: vi.fn(),
}));

function renderDelete(client = createTestQueryClient()) {
  return renderHook(() => useProgramAssignmentDelete("program-1"), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>
        {children}
        <Toaster />
      </QueryClientProvider>
    ),
  });
}

describe("useProgramAssignmentDelete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(deleteProgramAssignment).mockResolvedValue(undefined);
  });

  it("asks first, counting the teams with a file, and deletes nothing until confirmed", () => {
    const { result } = renderDelete();
    expect(result.current.deleting).toBeNull();
    expect(result.current.teamsWithFiles).toBe(0);
    act(() => result.current.confirm());
    expect(deleteProgramAssignment).not.toHaveBeenCalled();

    act(() => result.current.start(programAssignment()));
    expect(result.current.deleting?.id).toBe("odev-1");
    expect(result.current.teamsWithFiles).toBe(1);

    act(() => result.current.cancel());
    expect(result.current.deleting).toBeNull();
    expect(deleteProgramAssignment).not.toHaveBeenCalled();
  });

  it("deletes on confirm, refreshes the program's Ödevler, closes and says so", async () => {
    const client = createTestQueryClient();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderDelete(client);
    act(() => result.current.start(programAssignment()));
    act(() => result.current.confirm());

    await waitFor(() => expect(result.current.deleting).toBeNull());
    expect(deleteProgramAssignment).toHaveBeenCalledWith("program-1", "odev-1");
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["program-assignments", "program-1"],
    });
    expect(await screen.findByText("Ödev silindi.")).toBeInTheDocument();
  });

  it("neither closes nor deletes twice while the delete is on its way", async () => {
    let finish: () => void = () => {};
    vi.mocked(deleteProgramAssignment).mockReturnValue(
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    );
    const { result } = renderDelete();
    act(() => result.current.start(programAssignment()));
    act(() => result.current.confirm());
    await waitFor(() => expect(result.current.removing).toBe(true));

    act(() => result.current.cancel());
    act(() => result.current.confirm());
    expect(result.current.deleting).not.toBeNull();
    expect(deleteProgramAssignment).toHaveBeenCalledTimes(1);

    act(() => finish());
    await waitFor(() => expect(result.current.deleting).toBeNull());
  });

  it("stays open and shows the backend's refusal when the delete fails", async () => {
    vi.mocked(deleteProgramAssignment).mockRejectedValue(
      new Error("Arşivlenmiş bir programın ödevi silinemez."),
    );
    const { result } = renderDelete();
    act(() => result.current.start(programAssignment()));
    act(() => result.current.confirm());

    expect(
      await screen.findByText("Arşivlenmiş bir programın ödevi silinemez."),
    ).toBeInTheDocument();
    expect(result.current.deleting).not.toBeNull();
  });
});
