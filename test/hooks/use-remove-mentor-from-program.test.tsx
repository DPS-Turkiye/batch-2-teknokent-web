import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ADMIN_OVERVIEW_QUERY_KEY } from "@/hooks/use-admin-overview";
import { useRemoveMentorFromProgram } from "@/hooks/use-remove-mentor-from-program";
import type { ProgramMentorRemoval } from "@/interfaces/admin-overview";
import { ToastTone } from "@/interfaces/toast";
import { removeMentorFromProgram } from "@/lib/client/admin-program-members";
import { ClientApiError } from "@/lib/client/api";
import type { ToastInput } from "@/stores/toast-store";
import { adminProgram } from "@test/fixtures/admin-programs";
import { createTestQueryClient, InLocale } from "@test/test-utils";

vi.mock("@/lib/client/admin-program-members", () => ({
  removeMentorFromProgram: vi.fn(),
}));

const showToast = vi.fn<(toast: ToastInput) => void>();

vi.mock("@/stores/toast-store", () => ({
  useToast: () => ({ showToast, dismiss: vi.fn() }),
}));

const mentor = { id: "mentor-1", fullName: "Leyla Aksoy" };
const program = adminProgram({ id: "program-1", name: "Kuluçka 2026" });

function removed(
  overrides: Partial<ProgramMentorRemoval> = {},
): ProgramMentorRemoval {
  return {
    id: "removal-1",
    mentorId: "mentor-1",
    programId: "program-1",
    programName: "Kuluçka 2026",
    removedAt: "2026-11-13T12:00:00Z",
    withdrawnRequests: 0,
    ...overrides,
  };
}

function wrapperFor(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <InLocale locale="tr">{children}</InLocale>
      </QueryClientProvider>
    );
  };
}

function setup() {
  const queryClient = createTestQueryClient();
  const invalidate = vi.spyOn(queryClient, "invalidateQueries");
  const hook = renderHook(() => useRemoveMentorFromProgram(mentor, program), {
    wrapper: wrapperFor(queryClient),
  });
  return { ...hook, invalidate };
}

/** A removal whose answer the test sends when it wants to. */
function pendingRemoval() {
  let finish: (value: ProgramMentorRemoval) => void = () => undefined;
  vi.mocked(removeMentorFromProgram).mockReturnValue(
    new Promise<ProgramMentorRemoval>((resolve) => {
      finish = resolve;
    }),
  );
  return { finish: (value: ProgramMentorRemoval) => finish(value) };
}

describe("useRemoveMentorFromProgram", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(removeMentorFromProgram).mockResolvedValue(removed());
  });

  it("removes nothing before the admin confirms, and lets them back out", () => {
    const { result } = setup();

    expect(result.current.confirming).toBe(false);
    act(() => result.current.confirm());
    expect(removeMentorFromProgram).not.toHaveBeenCalled();

    act(() => result.current.ask());
    expect(result.current.confirming).toBe(true);

    act(() => result.current.cancel());
    expect(result.current.confirming).toBe(false);
    expect(removeMentorFromProgram).not.toHaveBeenCalled();
  });

  it("removes the mentor from the program, says so and refreshes the overview", async () => {
    const { result, invalidate } = setup();

    act(() => result.current.ask());
    act(() => result.current.confirm());

    await waitFor(() => expect(result.current.confirming).toBe(false));
    expect(removeMentorFromProgram).toHaveBeenCalledWith(
      "program-1",
      "mentor-1",
    );
    expect(showToast).toHaveBeenCalledWith({
      message: "Leyla Aksoy, Kuluçka 2026 programından çıkarıldı.",
      tone: ToastTone.Success,
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ADMIN_OVERVIEW_QUERY_KEY,
    });
  });

  it("says how many waiting requests the removal withdrew", async () => {
    vi.mocked(removeMentorFromProgram).mockResolvedValue(
      removed({ withdrawnRequests: 2 }),
    );
    const { result } = setup();

    act(() => result.current.ask());
    act(() => result.current.confirm());

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith({
        message:
          "Leyla Aksoy, Kuluçka 2026 programından çıkarıldı; yanıt bekleyen 2 talep geri çekildi.",
        tone: ToastTone.Success,
      }),
    );
  });

  it("still reports the removal and refreshes the overview when the row is gone before the answer", async () => {
    const removal = pendingRemoval();
    const { result, unmount, invalidate } = setup();

    act(() => result.current.ask());
    act(() => result.current.confirm());
    await waitFor(() => expect(removeMentorFromProgram).toHaveBeenCalled());
    unmount();
    await act(async () => {
      removal.finish(removed());
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith({
        message: "Leyla Aksoy, Kuluçka 2026 programından çıkarıldı.",
        tone: ToastTone.Success,
      }),
    );
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ADMIN_OVERVIEW_QUERY_KEY,
    });
  });

  it("shows the backend's reason when the removal is refused and closes the dialog", async () => {
    vi.mocked(removeMentorFromProgram).mockRejectedValue(
      new ClientApiError("Mentor bu programda kayıtlı değil.", 400),
    );
    const { result, invalidate } = setup();

    act(() => result.current.ask());
    act(() => result.current.confirm());

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith({
        message: "Mentor bu programda kayıtlı değil.",
        tone: ToastTone.Error,
      }),
    );
    await waitFor(() => expect(result.current.confirming).toBe(false));
    // The list may be out of date when the backend refuses, so it is read again.
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ADMIN_OVERVIEW_QUERY_KEY,
    });
  });

  it("falls back to its own message when the failure carries none", async () => {
    vi.mocked(removeMentorFromProgram).mockRejectedValue("offline");
    const { result } = setup();

    act(() => result.current.ask());
    act(() => result.current.confirm());

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith({
        message: "Mentor programdan çıkarılamadı.",
        tone: ToastTone.Error,
      }),
    );
  });

  it("sends one removal and keeps the dialog while it is on its way", async () => {
    const removal = pendingRemoval();
    const { result } = setup();

    act(() => result.current.ask());
    act(() => result.current.confirm());
    await waitFor(() => expect(result.current.pending).toBe(true));

    act(() => result.current.confirm());
    act(() => result.current.cancel());
    expect(removeMentorFromProgram).toHaveBeenCalledTimes(1);
    expect(result.current.confirming).toBe(true);

    act(() => removal.finish(removed()));
    await waitFor(() => expect(result.current.confirming).toBe(false));
    expect(result.current.pending).toBe(false);
  });
});
