import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ADMIN_OVERVIEW_QUERY_KEY } from "@/hooks/use-admin-overview";
import { useMoveTeamProgram } from "@/hooks/use-move-team-program";
import type { ProgramTeamMove } from "@/interfaces/admin-overview";
import { ToastTone } from "@/interfaces/toast";
import { moveStartupToProgram } from "@/lib/client/admin-program-members";
import { ClientApiError } from "@/lib/client/api";
import type { ToastInput } from "@/stores/toast-store";
import { adminProgram, adminStartup } from "@test/fixtures/admin-programs";
import { createTestQueryClient, InLocale } from "@test/test-utils";

vi.mock("@/lib/client/admin-program-members", () => ({
  moveStartupToProgram: vi.fn(),
}));

const showToast = vi.fn<(toast: ToastInput) => void>();

vi.mock("@/stores/toast-store", () => ({
  useToast: () => ({ showToast, dismiss: vi.fn() }),
}));

const team = adminStartup({
  id: "org-1",
  name: "Lumen",
  programId: "program-1",
  programName: "Ön Kuluçka 2026",
});
const target = adminProgram({ id: "program-2", name: "Kuluçka 2026" });

function moved(overrides: Partial<ProgramTeamMove> = {}): ProgramTeamMove {
  return {
    id: "move-1",
    organizationId: "org-1",
    fromProgramId: "program-1",
    fromProgramName: "Ön Kuluçka 2026",
    toProgramId: "program-2",
    toProgramName: "Kuluçka 2026",
    movedAt: "2026-11-13T12:00:00Z",
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
  const onMoved = vi.fn<() => void>();
  const hook = renderHook(() => useMoveTeamProgram(team, [target], onMoved), {
    wrapper: wrapperFor(queryClient),
  });
  return { ...hook, invalidate, onMoved };
}

/** Picks the target and opens the confirmation. */
function askToMove(result: ReturnType<typeof setup>["result"]) {
  act(() => result.current.select("program-2"));
  act(() => result.current.ask());
}

describe("useMoveTeamProgram", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(moveStartupToProgram).mockResolvedValue(moved());
  });

  it("asks nothing until a program on offer is chosen", () => {
    const { result } = setup();

    expect(result.current.canAsk).toBe(false);
    act(() => result.current.ask());
    expect(result.current.confirmation).toBeNull();

    act(() => result.current.select("program-9"));
    expect(result.current.canAsk).toBe(false);

    act(() => result.current.select("program-2"));
    expect(result.current.canAsk).toBe(true);
    expect(result.current.confirmation).toBeNull();
  });

  it("moves nothing before the admin confirms, and lets them back out", () => {
    const { result } = setup();

    askToMove(result);
    expect(result.current.confirmation).toEqual(target);

    act(() => result.current.cancel());
    expect(result.current.confirmation).toBeNull();
    expect(moveStartupToProgram).not.toHaveBeenCalled();
  });

  it("moves the team out of the program it is listed under and refreshes the overview", async () => {
    const { result, invalidate, onMoved } = setup();

    askToMove(result);
    act(() => result.current.confirm());

    await waitFor(() => expect(onMoved).toHaveBeenCalledTimes(1));
    expect(moveStartupToProgram).toHaveBeenCalledWith(
      "program-2",
      "org-1",
      "program-1",
    );
    expect(showToast).toHaveBeenCalledWith({
      message: "Lumen takımı Kuluçka 2026 programına taşındı.",
      tone: ToastTone.Success,
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ADMIN_OVERVIEW_QUERY_KEY,
    });
    expect(result.current.confirmation).toBeNull();
  });

  it("says how many waiting requests the move closed", async () => {
    vi.mocked(moveStartupToProgram).mockResolvedValue(
      moved({ withdrawnRequests: 2 }),
    );
    const { result, onMoved } = setup();

    askToMove(result);
    act(() => result.current.confirm());

    await waitFor(() => expect(onMoved).toHaveBeenCalledTimes(1));
    expect(showToast).toHaveBeenCalledWith({
      message:
        "Lumen takımı Kuluçka 2026 programına taşındı; yanıt bekleyen 2 talep kapatıldı.",
      tone: ToastTone.Success,
    });
  });

  it("shows the backend's reason when the move is refused and stays on the team", async () => {
    vi.mocked(moveStartupToProgram).mockRejectedValue(
      new ClientApiError("Bu program artık katılıma açık değil.", 400),
    );
    const { result, invalidate, onMoved } = setup();

    askToMove(result);
    act(() => result.current.confirm());

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith({
        message: "Bu program artık katılıma açık değil.",
        tone: ToastTone.Error,
      }),
    );
    expect(onMoved).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();
    expect(result.current.confirmation).toBeNull();
  });

  it("sends one move and keeps the dialog while it is on its way", async () => {
    let finish: (value: ProgramTeamMove) => void = () => undefined;
    vi.mocked(moveStartupToProgram).mockReturnValue(
      new Promise<ProgramTeamMove>((resolve) => {
        finish = resolve;
      }),
    );
    const { result, onMoved } = setup();

    askToMove(result);
    act(() => result.current.confirm());
    await waitFor(() => expect(result.current.pending).toBe(true));

    act(() => result.current.confirm());
    act(() => result.current.cancel());
    expect(moveStartupToProgram).toHaveBeenCalledTimes(1);
    expect(result.current.confirmation).toEqual(target);
    expect(result.current.canAsk).toBe(false);

    act(() => finish(moved()));
    await waitFor(() => expect(onMoved).toHaveBeenCalledTimes(1));
  });
});
