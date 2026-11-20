import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ADMIN_OVERVIEW_QUERY_KEY } from "@/hooks/use-admin-overview";
import { teamMoveQueryKey, useMoveMember } from "@/hooks/use-move-member";
import { personSummaryQueryKey } from "@/hooks/use-person-summary";
import { programTeamsQueryKey } from "@/hooks/use-program-teams";
import { teamHistoryQueryKey } from "@/hooks/use-team-history";
import { ToastTone } from "@/interfaces/toast";
import { ClientApiError } from "@/lib/client/api";
import { getTeamMoveOptions, moveMemberToTeam } from "@/lib/client/team-moves";
import type { ToastInput } from "@/stores/toast-store";
import {
  founderBlocked,
  soloFounder,
  teamMoveOptions,
  teamMoveResult,
} from "@test/fixtures/team-moves";
import { createTestQueryClient, InLocale } from "@test/test-utils";

vi.mock("@/lib/client/team-moves", () => ({
  getTeamMoveOptions: vi.fn(),
  moveMemberToTeam: vi.fn(),
}));

const showToast = vi.fn<(toast: ToastInput) => void>();

vi.mock("@/stores/toast-store", () => ({
  useToast: () => ({ showToast, dismiss: vi.fn() }),
}));

function wrapperFor(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <InLocale locale="tr">{children}</InLocale>
      </QueryClientProvider>
    );
  };
}

function setup(programId?: string) {
  const queryClient = createTestQueryClient();
  const invalidate = vi.spyOn(queryClient, "invalidateQueries");
  const hook = renderHook(() => useMoveMember("user-1", programId), {
    wrapper: wrapperFor(queryClient),
  });
  return { hook, invalidate, queryClient };
}

describe("useMoveMember", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTeamMoveOptions).mockResolvedValue(teamMoveOptions());
    vi.mocked(moveMemberToTeam).mockResolvedValue(teamMoveResult());
  });

  it("asks the backend only once the dialog opens", async () => {
    const { hook } = setup();

    expect(getTeamMoveOptions).not.toHaveBeenCalled();
    act(() => hook.result.current.show());

    await waitFor(() => expect(hook.result.current.hasTargets).toBe(true));
    expect(getTeamMoveOptions).toHaveBeenCalledWith("user-1");
    expect(hook.result.current.fullName).toBe("Mert Kaya");
    expect(hook.result.current.currentTeamLabel).toBe("Döngü · Kuluçka 2026");
    expect(hook.result.current.blockedKey).toBeNull();
  });

  it("narrows the teams by the search and keeps the chosen one", async () => {
    const { hook } = setup();
    act(() => hook.result.current.show());
    await waitFor(() => expect(hook.result.current.hasTargets).toBe(true));

    act(() => hook.result.current.setSearch("pazar"));
    expect(hook.result.current.targets.map((team) => team.name)).toEqual([
      "Pazar Lab",
    ]);
    expect(hook.result.current.canMove).toBe(false);

    act(() => hook.result.current.select("org-new"));
    expect(hook.result.current.target?.name).toBe("Pazar Lab");
    expect(hook.result.current.canMove).toBe(true);
  });

  it("explains a founder instead of offering teams", async () => {
    vi.mocked(getTeamMoveOptions).mockResolvedValue(founderBlocked());
    const { hook } = setup();
    act(() => hook.result.current.show());

    await waitFor(() => expect(hook.result.current.blockedKey).toBe("founder"));
    expect(hook.result.current.hasTargets).toBe(false);
  });

  it("moves, says so, closes and refreshes every list that shows the person", async () => {
    const { hook, invalidate, queryClient } = setup("program-1");
    act(() => hook.result.current.show());
    await waitFor(() => expect(hook.result.current.hasTargets).toBe(true));
    act(() => hook.result.current.select("org-new"));

    act(() => hook.result.current.confirm());

    await waitFor(() => expect(hook.result.current.open).toBe(false));
    expect(moveMemberToTeam).toHaveBeenCalledWith("user-1", "org-new");
    expect(showToast).toHaveBeenCalledWith({
      message: "Mert Kaya, Pazar Lab takımına taşındı.",
      tone: ToastTone.Success,
    });
    const keys = invalidate.mock.calls.map(([filters]) => filters?.queryKey);
    expect(keys).toEqual(
      expect.arrayContaining([
        teamHistoryQueryKey("user-1"),
        personSummaryQueryKey("user-1"),
        ADMIN_OVERVIEW_QUERY_KEY,
        programTeamsQueryKey("program-1"),
        programTeamsQueryKey("program-2"),
      ]),
    );
    expect(hook.result.current.targetId).toBe("");
    expect(
      queryClient.getQueryData(teamMoveQueryKey("user-1")),
    ).toBeUndefined();
  });

  it("shows the backend's refusal and keeps the dialog open", async () => {
    vi.mocked(moveMemberToTeam).mockRejectedValue(
      new ClientApiError("Takımın kurucusu taşınamaz.", 409, "TEAM_FOUNDER"),
    );
    const { hook } = setup();
    act(() => hook.result.current.show());
    await waitFor(() => expect(hook.result.current.hasTargets).toBe(true));
    act(() => hook.result.current.select("org-new"));

    act(() => hook.result.current.confirm());

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith({
        message: "Takımın kurucusu taşınamaz.",
        tone: ToastTone.Error,
      }),
    );
    expect(hook.result.current.open).toBe(true);
  });

  it("does not move without a chosen team, and stays open while a move is on its way", async () => {
    let finish: (value: ReturnType<typeof teamMoveResult>) => void = () =>
      undefined;
    vi.mocked(moveMemberToTeam).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const { hook } = setup();
    act(() => hook.result.current.show());
    await waitFor(() => expect(hook.result.current.hasTargets).toBe(true));

    act(() => hook.result.current.confirm());
    expect(moveMemberToTeam).not.toHaveBeenCalled();

    act(() => hook.result.current.select("org-new"));
    act(() => hook.result.current.confirm());
    await waitFor(() => expect(hook.result.current.pending).toBe(true));
    act(() => hook.result.current.close());
    expect(hook.result.current.open).toBe(true);

    act(() => finish(teamMoveResult()));
    await waitFor(() => expect(hook.result.current.open).toBe(false));
  });

  it("forgets the search and choice when closed", async () => {
    const { hook } = setup();
    act(() => hook.result.current.show());
    await waitFor(() => expect(hook.result.current.hasTargets).toBe(true));
    act(() => {
      hook.result.current.setSearch("ağaç");
      hook.result.current.select("org-tree");
    });

    act(() => hook.result.current.close());

    expect(hook.result.current.open).toBe(false);
    expect(hook.result.current.search).toBe("");
    expect(hook.result.current.targetId).toBe("");
  });

  it("unpicks a team once the search hides it, so nothing off screen can be moved to", async () => {
    const { hook } = setup();
    act(() => hook.result.current.show());
    await waitFor(() => expect(hook.result.current.hasTargets).toBe(true));
    act(() => hook.result.current.select("org-tree"));
    expect(hook.result.current.canMove).toBe(true);

    act(() => hook.result.current.setSearch("pazar"));

    expect(hook.result.current.target).toBeNull();
    expect(hook.result.current.canMove).toBe(false);
    act(() => hook.result.current.confirm());
    expect(moveMemberToTeam).not.toHaveBeenCalled();
  });

  it("asks again on every open instead of showing what it had before", async () => {
    const { hook } = setup();
    act(() => hook.result.current.show());
    await waitFor(() => expect(hook.result.current.hasTargets).toBe(true));
    act(() => hook.result.current.close());
    vi.mocked(getTeamMoveOptions).mockResolvedValue(founderBlocked());

    act(() => hook.result.current.show());

    expect(hook.result.current.hasTargets).toBe(false);
    await waitFor(() => expect(hook.result.current.blockedKey).toBe("founder"));
    expect(getTeamMoveOptions).toHaveBeenCalledTimes(2);
  });

  it("names why the options could not be loaded", async () => {
    vi.mocked(getTeamMoveOptions).mockRejectedValue(
      new ClientApiError("Kullanıcı bulunamadı.", 404),
    );
    const { hook } = setup();
    act(() => hook.result.current.show());

    await waitFor(() =>
      expect(hook.result.current.loadError).toBe("Kullanıcı bulunamadı."),
    );
  });

  it("names the startup a solo founder's move archives, and says so when it is done", async () => {
    vi.mocked(getTeamMoveOptions).mockResolvedValue(soloFounder());
    vi.mocked(moveMemberToTeam).mockResolvedValue(
      teamMoveResult({ archivedFrom: true, withdrawnRequests: 0 }),
    );
    const { hook } = setup();
    act(() => hook.result.current.show());
    await waitFor(() =>
      expect(hook.result.current.archivedTeamName).toBe("Döngü"),
    );
    act(() => hook.result.current.select("org-new"));

    act(() => hook.result.current.confirm());

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith({
        message: "Merve Geçer, Pazar Lab takımına taşındı; Döngü arşivlendi.",
        tone: ToastTone.Success,
      }),
    );
  });

  it("names no archived startup for an ordinary member", async () => {
    const { hook } = setup();
    act(() => hook.result.current.show());
    await waitFor(() => expect(hook.result.current.hasTargets).toBe(true));

    expect(hook.result.current.archivedTeamName).toBeNull();
  });
});
