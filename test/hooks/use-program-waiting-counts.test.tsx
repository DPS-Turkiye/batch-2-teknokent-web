import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useProgramWaitingCounts } from "@/hooks/use-program-waiting-counts";
import { TeamJoinStatus } from "@/interfaces/coordinator-program";
import { MentorPoolStatus, type MentorPoolRow } from "@/interfaces/mentor-pool";
import {
  getMentorPool,
  getProgramTeams,
} from "@/lib/client/coordinator-programs";
import { queryWrapper } from "@test/fixtures/query-wrapper";

vi.mock("@/lib/client/coordinator-programs", () => ({
  getMentorPool: vi.fn(),
  getProgramTeams: vi.fn(),
}));

const invited: MentorPoolRow = {
  mentorId: null,
  inviteId: "invite-1",
  fullName: null,
  email: "cagri@yilmazfinans.com",
  status: MentorPoolStatus.Invited,
  expertise: [],
  programs: [],
  activeTeams: 0,
  capacity: 4,
  since: "2026-09-20T10:00:00Z",
  expiresAt: "2026-10-03T10:00:00Z",
  inviteCode: "abc123",
};

describe("useProgramWaitingCounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMentorPool).mockResolvedValue([
      invited,
      {
        ...invited,
        inviteId: null,
        mentorId: "m-1",
        status: MentorPoolStatus.Active,
      },
    ]);
    vi.mocked(getProgramTeams).mockResolvedValue([
      {
        inviteId: "t-1",
        organizationId: null,
        name: "Kavşak",
        status: TeamJoinStatus.Waiting,
        leadName: null,
        leadEmail: "deniz@kavsak.co",
        code: "BIGG26-K4TX",
        invitedAt: "2026-09-20T10:00:00Z",
        joinedAt: null,
        memberCount: 0,
        codeSentAt: null,
        codeSendFailed: false,
      },
    ]);
  });

  it("counts the waiting teams and mentors once both lists load", async () => {
    const { result } = renderHook(
      () => useProgramWaitingCounts("program-1", 0),
      queryWrapper(),
    );
    expect(result.current).toEqual({ teams: null, mentors: null });
    await waitFor(() =>
      expect(result.current).toEqual({ teams: 1, mentors: 1 }),
    );
  });

  it("loads nothing for a program without teams and a mentor pool", () => {
    const { result } = renderHook(
      () => useProgramWaitingCounts("program-1", null),
      queryWrapper(),
    );
    expect(result.current).toEqual({ teams: null, mentors: null });
    expect(getMentorPool).not.toHaveBeenCalled();
    expect(getProgramTeams).not.toHaveBeenCalled();
  });
});
