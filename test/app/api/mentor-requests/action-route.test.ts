import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PATCH } from "@/app/api/mentor-requests/[id]/[action]/route";
import { mutateMentorRequest } from "@/lib/api/mentor-requests";
import { getSessionIds, getSessionMentorId } from "@/lib/session";

vi.mock("@/lib/api/mentor-requests", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/api/mentor-requests")>();
  return {
    ...actual,
    mutateMentorRequest: vi.fn(),
  };
});

vi.mock("@/lib/session", () => ({
  getSessionIds: vi.fn(),
  getSessionMentorId: vi.fn(),
}));

function contextFor(action: string, id = "req-1") {
  return { params: Promise.resolve({ action, id }) };
}

describe("PATCH /api/mentor-requests/[id]/[action]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "mentee-1",
      organizationId: "org-1",
    });
    vi.mocked(mutateMentorRequest).mockResolvedValue({
      data: {},
      headers: {},
      status: 200,
    });
  });

  it("resolves the mentor id from the session only for the decision action", async () => {
    vi.mocked(getSessionMentorId).mockResolvedValue("mentor-1");

    const request = new NextRequest("http://localhost/x", {
      method: "PATCH",
      body: JSON.stringify({ status: "ACCEPTED", message: "ok" }),
    });

    await PATCH(request, contextFor("decision"));

    expect(getSessionMentorId).toHaveBeenCalled();
    expect(mutateMentorRequest).toHaveBeenCalledWith(
      expect.objectContaining({ mentorId: "mentor-1" }),
    );
  });

  it("does not resolve a mentor id for non-decision actions", async () => {
    const request = new NextRequest("http://localhost/x", {
      method: "PATCH",
      body: JSON.stringify({}),
    });

    await PATCH(request, contextFor("withdrawal"));

    expect(getSessionMentorId).not.toHaveBeenCalled();
    expect(mutateMentorRequest).toHaveBeenCalledWith(
      expect.objectContaining({ mentorId: undefined }),
    );
  });

  it("rejects an unsupported action", async () => {
    const request = new NextRequest("http://localhost/x", { method: "PATCH" });

    const response = await PATCH(request, contextFor("not-a-real-action"));

    expect(response.status).toBe(400);
    expect(mutateMentorRequest).not.toHaveBeenCalled();
  });
});
