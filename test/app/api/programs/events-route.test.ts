import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/programs/events/route";
import { fetchMemberProgramEvents } from "@/lib/api/programs";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionIds } from "@/lib/session";

vi.mock("@/lib/api/programs", () => ({
  fetchMemberProgramEvents: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ getSessionIds: vi.fn() }));

function request(query: string) {
  return new NextRequest(`http://localhost/api/programs/events?${query}`);
}

describe("GET /api/programs/events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("asks for the session user's program events in the given range", async () => {
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "mentee-1",
      organizationId: "",
    });
    vi.mocked(fetchMemberProgramEvents).mockResolvedValue({
      status: 200,
      data: [],
      headers: {},
    });

    const response = await GET(
      request("from=2026-09-21T00:00:00.000Z&to=2026-09-28T00:00:00.000Z"),
    );

    expect(response.status).toBe(200);
    expect(fetchMemberProgramEvents).toHaveBeenCalledWith("mentee-1", {
      from: "2026-09-21T00:00:00.000Z",
      to: "2026-09-28T00:00:00.000Z",
    });
  });

  it("refuses a visitor without a session", async () => {
    vi.mocked(getSessionIds).mockRejectedValue(new SessionRequiredError());

    const response = await GET(request("from=a&to=b"));

    expect(response.status).toBe(401);
    expect(fetchMemberProgramEvents).not.toHaveBeenCalled();
  });
});
