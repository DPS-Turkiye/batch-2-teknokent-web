import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST as remind } from "@/app/api/coordinator/meeting-proposals/[id]/remind/route";
import { DELETE as withdraw } from "@/app/api/coordinator/meeting-proposals/[id]/route";
import { GET as coordinatorList } from "@/app/api/coordinator/meeting-proposals/route";
import { POST as propose } from "@/app/api/coordinator/mentorships/[id]/meeting-proposals/route";
import { POST as accept } from "@/app/api/meeting-proposals/[id]/accept/route";
import { POST as decline } from "@/app/api/meeting-proposals/[id]/decline/route";
import { GET as mine } from "@/app/api/meeting-proposals/route";
import { UserRole } from "@/interfaces/session";
import {
  acceptMeetingProposal,
  declineMeetingProposal,
  fetchCoordinatorMeetingProposals,
  fetchMyMeetingProposals,
  proposeMeeting,
  remindMeetingProposal,
  withdrawMeetingProposal,
} from "@/lib/api/meeting-proposals";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";
import { getSessionIds } from "@/lib/session";
import {
  answerEachWith,
  backendResponse,
  guardRefusal,
} from "@test/fixtures/route-handlers";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/meeting-proposals", () => ({
  acceptMeetingProposal: vi.fn(),
  declineMeetingProposal: vi.fn(),
  fetchCoordinatorMeetingProposals: vi.fn(),
  fetchMyMeetingProposals: vi.fn(),
  proposeMeeting: vi.fn(),
  remindMeetingProposal: vi.fn(),
  withdrawMeetingProposal: vi.fn(),
}));
vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorSession: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ getSessionIds: vi.fn() }));

const ok = backendResponse({});
const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe("meeting proposal routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCoordinatorSession).mockResolvedValue({
      ok: true,
      session: appSession({
        userId: "coordinator-1",
        role: UserRole.Coordinator,
      }),
    });
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "mentor-1",
      organizationId: "",
    });
    for (const fn of [
      acceptMeetingProposal,
      declineMeetingProposal,
      fetchCoordinatorMeetingProposals,
      fetchMyMeetingProposals,
      proposeMeeting,
      remindMeetingProposal,
      withdrawMeetingProposal,
    ]) {
      answerEachWith([fn], ok);
    }
  });

  it("lets a coordinator list, propose, remind and withdraw as themselves", async () => {
    await coordinatorList(
      new NextRequest(
        "http://localhost/api/coordinator/meeting-proposals?mentorshipId=m-1",
      ),
    );
    expect(fetchCoordinatorMeetingProposals).toHaveBeenCalledWith(
      "coordinator-1",
      { programId: null, mentorshipId: "m-1" },
    );

    await propose(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          scheduledAt: "2026-10-01T07:30:00Z",
          durationMinutes: 45,
          actorId: "someone-else",
        }),
      }),
      params("m-1"),
    );
    expect(proposeMeeting).toHaveBeenCalledWith("coordinator-1", "m-1", {
      scheduledAt: "2026-10-01T07:30:00Z",
      durationMinutes: 45,
      agenda: null,
      replacesMeetingId: null,
    });

    await remind(new Request("http://localhost"), params("p-1"));
    await withdraw(new Request("http://localhost"), params("p-1"));
    expect(remindMeetingProposal).toHaveBeenCalledWith("coordinator-1", "p-1");
    expect(withdrawMeetingProposal).toHaveBeenCalledWith(
      "coordinator-1",
      "p-1",
    );
  });

  it("stops coordinator routes at the session check", async () => {
    vi.mocked(requireCoordinatorSession).mockResolvedValue(guardRefusal(403));

    const response = await remind(
      new Request("http://localhost"),
      params("p-1"),
    );

    expect(response.status).toBe(403);
    expect(remindMeetingProposal).not.toHaveBeenCalled();
  });

  it("lets the mentor or team list, accept and decline with a reason", async () => {
    await mine();
    await accept(new Request("http://localhost"), params("p-1"));
    await decline(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ reason: "Seyahatteyim" }),
      }),
      params("p-1"),
    );

    expect(fetchMyMeetingProposals).toHaveBeenCalledWith("mentor-1");
    expect(acceptMeetingProposal).toHaveBeenCalledWith("mentor-1", "p-1");
    expect(declineMeetingProposal).toHaveBeenCalledWith(
      "mentor-1",
      "p-1",
      "Seyahatteyim",
    );
  });

  it("needs a signed-in user to answer", async () => {
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "",
      organizationId: "",
    });

    const response = await accept(
      new Request("http://localhost"),
      params("p-1"),
    );

    expect(response.status).toBe(401);
    expect(acceptMeetingProposal).not.toHaveBeenCalled();
  });
});
