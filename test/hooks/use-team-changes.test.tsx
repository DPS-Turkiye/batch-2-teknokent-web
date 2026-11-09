import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAppSession } from "@/components/providers/session-provider";
import { Toaster } from "@/components/common/toaster";
import { useOrganizationPrograms } from "@/hooks/use-programs";
import { useAdoptStartupSession } from "@/hooks/use-startup-membership";
import { useTeamChanges } from "@/hooks/use-team-changes";
import {
  type TeamChange,
  TeamChangeKind,
  TeamChangeStatus,
} from "@/interfaces/team-change";
import {
  getTeamChanges,
  leaveTeam,
  requestLeave,
} from "@/lib/client/team-changes";
import { memberFixture } from "@test/fixtures/startup-team";
import { createTestQueryClient } from "@test/test-utils";

const replace = vi.fn();
const adopt = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: vi.fn(),
}));
vi.mock("@/hooks/use-programs", () => ({ useOrganizationPrograms: vi.fn() }));
vi.mock("@/hooks/use-startup-membership", () => ({
  useAdoptStartupSession: vi.fn(),
}));
vi.mock("@/lib/client/team-changes", () => ({
  cancelTeamChange: vi.fn(),
  getTeamChanges: vi.fn(),
  leaveTeam: vi.fn(),
  requestLeave: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <>
        {children}
        <Toaster />
      </>
    </QueryClientProvider>
  );
}

const founder = memberFixture("founder", { founder: true });
const cto = memberFixture("cto");
const designer = memberFixture("designer");

function leaveOf(memberId: string): TeamChange {
  return {
    id: `tc-${memberId}`,
    kind: TeamChangeKind.Leave,
    status: TeamChangeStatus.Pending,
    organizationId: "org-1",
    organizationName: "Döngü",
    memberId,
    memberName: "Kerem Aksoy",
    memberEmail: `${memberId}@dongu.co`,
    requestedById: memberId,
    requestedByName: "Kerem Aksoy",
    createdAt: "2026-11-04T09:00:00Z",
  };
}

function setup(userId: string, { inProgram = true } = {}) {
  vi.mocked(useAppSession).mockReturnValue({ userId } as never);
  vi.mocked(useOrganizationPrograms).mockReturnValue({
    data: {
      programs: inProgram
        ? [{ id: "p1", name: "Growth", coordinatorName: "Ayşe" }]
        : [],
      activeProgramId: null,
    },
  } as never);
}

describe("useTeamChanges", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAdoptStartupSession).mockReturnValue(adopt);
    vi.mocked(getTeamChanges).mockResolvedValue([]);
  });

  it("lets a member ask to leave only inside a program", () => {
    setup("cto", { inProgram: false });
    const { result } = renderHook(
      () => useTeamChanges([founder, cto, designer]),
      { wrapper },
    );
    expect(result.current.canLeave).toBe(false);

    setup("cto");
    const { result: inProgram } = renderHook(
      () => useTeamChanges([founder, cto, designer]),
      { wrapper },
    );
    expect(inProgram.current.canLeave).toBe(true);
  });

  it("sends a member's leave as a request", async () => {
    setup("cto");
    vi.mocked(requestLeave).mockResolvedValue(leaveOf("cto"));
    const { result } = renderHook(
      () => useTeamChanges([founder, cto, designer]),
      { wrapper },
    );

    act(() => result.current.openLeave());
    act(() => result.current.confirmLeave());

    await waitFor(() => expect(result.current.confirmingLeave).toBe(false));
    expect(requestLeave).toHaveBeenCalled();
    expect(leaveTeam).not.toHaveBeenCalled();
  });

  it("hides the leave button while the member's own request waits", async () => {
    setup("cto");
    vi.mocked(getTeamChanges).mockResolvedValue([leaveOf("cto")]);
    const { result } = renderHook(
      () => useTeamChanges([founder, cto, designer]),
      { wrapper },
    );

    await waitFor(() => expect(result.current.myChange?.id).toBe("tc-cto"));
    expect(result.current.canLeave).toBe(false);
  });

  it("offers only members who are staying as the next leader", async () => {
    setup("founder");
    vi.mocked(getTeamChanges).mockResolvedValue([leaveOf("cto")]);
    const { result } = renderHook(
      () => useTeamChanges([founder, cto, designer]),
      { wrapper },
    );

    await waitFor(() => expect(result.current.changeFor("cto")).not.toBeNull());
    expect(result.current.viewerIsLeader).toBe(true);
    expect(result.current.successors.map((member) => member.id)).toEqual([
      "designer",
    ]);
  });

  it("waits for a successor, then the leader leaves and goes to Startup'ım", async () => {
    setup("founder");
    vi.mocked(leaveTeam).mockResolvedValue({ userId: "founder" } as never);
    const { result } = renderHook(
      () => useTeamChanges([founder, cto, designer]),
      { wrapper },
    );

    act(() => result.current.openLeave());
    act(() => result.current.confirmLeave());
    expect(leaveTeam).not.toHaveBeenCalled();

    act(() => result.current.setSuccessorId("designer"));
    act(() => result.current.confirmLeave());

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/startup"));
    expect(leaveTeam).toHaveBeenCalledWith("designer");
    expect(adopt).toHaveBeenCalledWith({ userId: "founder" });
  });

  it("lets a leader alone in the team leave without a successor", async () => {
    setup("founder", { inProgram: false });
    vi.mocked(leaveTeam).mockResolvedValue({ userId: "founder" } as never);
    const { result } = renderHook(() => useTeamChanges([founder]), {
      wrapper,
    });

    expect(result.current.alone).toBe(true);
    expect(result.current.canLeave).toBe(true);
    act(() => result.current.confirmLeave());

    await waitFor(() => expect(leaveTeam).toHaveBeenCalledWith(null));
  });
});
