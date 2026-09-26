import { NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST as renew } from "@/app/api/coordinator/programs/[id]/mentor-invites/[inviteId]/renew/route";
import { DELETE as cancel } from "@/app/api/coordinator/programs/[id]/mentor-invites/[inviteId]/route";
import { POST as decide } from "@/app/api/coordinator/programs/[id]/mentors/[mentorId]/decision/route";
import { GET as review } from "@/app/api/coordinator/programs/[id]/mentors/[mentorId]/review/route";
import { DELETE as withdraw } from "@/app/api/coordinator/programs/[id]/mentors/[mentorId]/route";
import { GET, POST } from "@/app/api/coordinator/programs/[id]/mentors/route";
import { type AppSession, UserRole } from "@/interfaces/session";
import * as api from "@/lib/api/coordinator-programs";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

vi.mock("@/lib/api/coordinator-programs", () => ({
  fetchMentorPool: vi.fn(),
  inviteProgramMentor: vi.fn(),
  withdrawProgramMentorInvite: vi.fn(),
  fetchMentorReview: vi.fn(),
  decideProgramMentor: vi.fn(),
  renewMentorInvite: vi.fn(),
  cancelMentorInvite: vi.fn(),
}));
vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorSession: vi.fn(),
}));

const ok = { data: [], headers: {}, status: 200 } as never;
const program = { params: Promise.resolve({ id: "program-1" }) };
const mentor = {
  params: Promise.resolve({ id: "program-1", mentorId: "mentor-1" }),
};
const invite = {
  params: Promise.resolve({ id: "program-1", inviteId: "invite-1" }),
};
const request = (method: string, value?: unknown) =>
  new Request("http://localhost", {
    method,
    body: value === undefined ? undefined : JSON.stringify(value),
  });

describe("coordinator mentor pool routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCoordinatorSession).mockResolvedValue({
      ok: true,
      session: {
        userId: "coordinator-1",
        role: UserRole.Coordinator,
      } as AppSession,
    });
    for (const fn of Object.values(api)) vi.mocked(fn).mockResolvedValue(ok);
  });

  it("reads the pool and invites as the signed-in coordinator", async () => {
    await GET(request("GET"), program);
    expect(api.fetchMentorPool).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
    );

    await POST(request("POST", { email: "cagri@yilmazfinans.com" }), program);
    expect(api.inviteProgramMentor).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      "cagri@yilmazfinans.com",
    );
  });

  it("reviews and decides only a strict true as approval", async () => {
    await review(request("GET"), mentor);
    expect(api.fetchMentorReview).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      "mentor-1",
    );
    await decide(request("POST", { accepted: "yes" }), mentor);
    expect(api.decideProgramMentor).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      "mentor-1",
      false,
    );
  });

  it("renews, cancels and withdraws invites", async () => {
    await renew(request("POST"), invite);
    await cancel(request("DELETE"), invite);
    await withdraw(request("DELETE"), mentor);
    expect(api.renewMentorInvite).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      "invite-1",
    );
    expect(api.cancelMentorInvite).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      "invite-1",
    );
    expect(api.withdrawProgramMentorInvite).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      "mentor-1",
    );
  });

  it("stops at the session check", async () => {
    vi.mocked(requireCoordinatorSession).mockResolvedValue({
      ok: false,
      response: NextResponse.json({ code: "FORBIDDEN" }, { status: 403 }),
    });
    const response = await POST(request("POST", { email: "a@b.co" }), program);
    expect(response.status).toBe(403);
    expect(api.inviteProgramMentor).not.toHaveBeenCalled();
  });
});
