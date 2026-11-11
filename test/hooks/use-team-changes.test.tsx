import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Toaster } from "@/components/common/toaster";
import { useAppSession } from "@/components/providers/session-provider";
import { useOrganizationPrograms } from "@/hooks/use-programs";
import { useAdoptStartupSession } from "@/hooks/use-startup-membership";
import { useTeamChanges } from "@/hooks/use-team-changes";
import {
  getTeamChanges,
  leaveTeam,
  requestLeave,
} from "@/lib/client/team-changes";
import { organizationProgram } from "@test/fixtures/organization-programs";
import { appSession } from "@test/fixtures/session";
import { memberFixture } from "@test/fixtures/startup-team";
import { leaveRequestOf } from "@test/fixtures/team-changes";
import { successQuery } from "@test/mocks/query-results";
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
/** The leader's session once they have left: no startup any more. */
const withoutStartup = appSession({ userId: "founder" });

function setup(userId: string, { inProgram = true } = {}) {
  vi.mocked(useAppSession).mockReturnValue(appSession({ userId }));
  vi.mocked(useOrganizationPrograms).mockReturnValue(
    successQuery({
      programs: inProgram
        ? [organizationProgram("p1", "Growth", { coordinatorName: "Ayşe" })]
        : [],
      activeProgramId: null,
    }),
  );
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
    vi.mocked(requestLeave).mockResolvedValue(leaveRequestOf("cto"));
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
    vi.mocked(getTeamChanges).mockResolvedValue([leaveRequestOf("cto")]);
    const { result } = renderHook(
      () => useTeamChanges([founder, cto, designer]),
      { wrapper },
    );

    await waitFor(() => expect(result.current.myChange?.id).toBe("tc-cto"));
    expect(result.current.canLeave).toBe(false);
  });

  it("offers only members who are staying as the next leader", async () => {
    setup("founder");
    vi.mocked(getTeamChanges).mockResolvedValue([leaveRequestOf("cto")]);
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
    vi.mocked(leaveTeam).mockResolvedValue(withoutStartup);
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
    expect(adopt).toHaveBeenCalledWith(withoutStartup);
  });

  it("lets a leader alone in the team leave without a successor", async () => {
    setup("founder", { inProgram: false });
    vi.mocked(leaveTeam).mockResolvedValue(withoutStartup);
    const { result } = renderHook(() => useTeamChanges([founder]), {
      wrapper,
    });

    expect(result.current.alone).toBe(true);
    expect(result.current.canLeave).toBe(true);
    act(() => result.current.confirmLeave());

    await waitFor(() => expect(leaveTeam).toHaveBeenCalledWith(null));
  });
});
