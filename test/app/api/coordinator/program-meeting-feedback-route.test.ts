import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/coordinator/programs/[id]/meeting-feedback/route";
import { UserRole } from "@/interfaces/session";
import { fetchProgramMeetingFeedback } from "@/lib/api/program-report";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";
import { guardRefusal } from "@test/fixtures/route-handlers";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/program-report", () => ({
  fetchProgramMeetingFeedback: vi.fn(),
}));

vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorSession: vi.fn(),
}));

const params = { params: Promise.resolve({ id: "program-1" }) };

function get(query = "") {
  return GET(
    new NextRequest(
      `http://localhost/api/coordinator/programs/program-1/meeting-feedback${query}`,
    ),
    params,
  );
}

describe("GET /api/coordinator/programs/[id]/meeting-feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCoordinatorSession).mockResolvedValue({
      ok: true,
      session: appSession({ userId: "coord-1", role: UserRole.Coordinator }),
    });
    vi.mocked(fetchProgramMeetingFeedback).mockResolvedValue({
      data: { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 },
      headers: {},
      status: 200,
    });
  });

  it("asks as the signed-in coordinator, for the window and page", async () => {
    const response = await get("?from=2026-11-01&page=2");

    expect(response.status).toBe(200);
    expect(fetchProgramMeetingFeedback).toHaveBeenCalledWith(
      "coord-1",
      "program-1",
      { from: "2026-11-01", page: 2, size: 20 },
    );
  });

  it("starts at the first page of the whole program", async () => {
    await get();

    expect(fetchProgramMeetingFeedback).toHaveBeenCalledWith(
      "coord-1",
      "program-1",
      { from: null, page: 0, size: 20 },
    );
  });

  it("refuses a malformed window or page without asking the backend", async () => {
    for (const query of [
      "?from=yesterday",
      "?page=-1",
      "?page=1.5",
      "?page=x",
      "?page=10001",
    ]) {
      expect((await get(query)).status).toBe(400);
    }
    expect(fetchProgramMeetingFeedback).not.toHaveBeenCalled();
  });

  it("stops anyone who is not a coordinator or admin", async () => {
    vi.mocked(requireCoordinatorSession).mockResolvedValue(guardRefusal(403));

    const response = await get();

    expect(response.status).toBe(403);
    expect(fetchProgramMeetingFeedback).not.toHaveBeenCalled();
  });
});
