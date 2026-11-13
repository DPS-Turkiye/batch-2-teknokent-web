import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/admin/programs/[id]/mentors/[targetId]/remove/route";
import type { ProgramMentorRemoval } from "@/interfaces/admin-overview";
import { UserRole } from "@/interfaces/session";
import * as members from "@/lib/api/admin-program-members";
import { requireAdminSession } from "@/lib/server/require-admin";
import tr from "@/messages/tr.json";
import { jsonRequest } from "@test/app/api/body-validation";
import { withForgedActor } from "@test/fixtures/forged-actor";
import {
  backendRefusal,
  backendResponse,
  guardRefusal,
} from "@test/fixtures/route-handlers";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/admin-program-members");
vi.mock("@/lib/server/require-admin", () => ({
  requireAdminSession: vi.fn(),
}));

const removal: ProgramMentorRemoval = {
  id: "removal-1",
  mentorId: "mentor-1",
  programId: "program-1",
  programName: "Kuluçka 2026",
  removedAt: "2026-11-13T12:00:00Z",
  withdrawnRequests: 2,
};
const context = {
  params: Promise.resolve({ id: "program-1", targetId: "mentor-1" }),
};

function send(body: unknown = "") {
  return POST(jsonRequest(body), context);
}

describe("POST /api/admin/programs/[id]/mentors/[targetId]/remove", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(members.removeMentorFromProgram).mockResolvedValue(
      backendResponse(removal),
    );
    vi.mocked(requireAdminSession).mockResolvedValue({
      ok: true,
      session: appSession({ userId: "admin-1", role: UserRole.Admin }),
    });
  });

  it("removes the mentor in the path from the program in the path, as the signed-in admin", async () => {
    const response = await send();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(removal);
    expect(members.removeMentorFromProgram).toHaveBeenCalledWith(
      "admin-1",
      "program-1",
      "mentor-1",
    );
  });

  it("acts as the session's admin whatever a body claims", async () => {
    await send(withForgedActor({ programId: "program-9" }));

    expect(members.removeMentorFromProgram).toHaveBeenCalledWith(
      "admin-1",
      "program-1",
      "mentor-1",
    );
  });

  it("stops anyone who is not an admin", async () => {
    vi.mocked(requireAdminSession).mockResolvedValue(guardRefusal(403));

    const response = await send();

    expect(response.status).toBe(403);
    expect(members.removeMentorFromProgram).not.toHaveBeenCalled();
  });

  it("passes the backend's refusal on", async () => {
    vi.mocked(members.removeMentorFromProgram).mockResolvedValue(
      backendRefusal(400, {
        code: "INVALID_REQUEST",
        message: "Mentor bu programda kayıtlı değil.",
      }),
    );

    const response = await send();

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: "INVALID_REQUEST",
      message: "Mentor bu programda kayıtlı değil.",
    });
  });

  it("answers its own message when the backend cannot be reached", async () => {
    vi.mocked(members.removeMentorFromProgram).mockRejectedValue(
      new Error("socket hang up"),
    );

    const response = await send();

    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({
      message: tr.apiErrors.programMentorRemoveFailed,
    });
  });
});
