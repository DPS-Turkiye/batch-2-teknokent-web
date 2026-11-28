import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST as accept } from "@/app/api/meeting-proposals/[id]/accept/route";
import { POST as decline } from "@/app/api/meeting-proposals/[id]/decline/route";
import { GET as mine } from "@/app/api/meeting-proposals/route";
import {
  acceptMeetingProposal,
  declineMeetingProposal,
  fetchMyMeetingProposals,
} from "@/lib/api/meeting-proposals";
import { getSessionIds } from "@/lib/session";
import { answerEachWith, backendResponse } from "@test/fixtures/route-handlers";

vi.mock("@/lib/api/meeting-proposals", () => ({
  acceptMeetingProposal: vi.fn(),
  declineMeetingProposal: vi.fn(),
  fetchMyMeetingProposals: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ getSessionIds: vi.fn() }));

const ok = backendResponse({});
const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe("meeting proposal routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "mentor-1",
      organizationId: "",
    });
    for (const fn of [
      acceptMeetingProposal,
      declineMeetingProposal,
      fetchMyMeetingProposals,
    ]) {
      answerEachWith([fn], ok);
    }
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
