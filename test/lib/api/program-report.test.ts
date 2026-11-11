import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchProgramMeetingFeedback } from "@/lib/api/program-report";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";
import { itemAt } from "@test/fixtures/list-assertions";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

describe("program report server API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("asks for who rated whom as the session's coordinator", async () => {
    await fetchProgramMeetingFeedback("coord-1", "program-1", {
      from: "2026-11-01",
      page: 1,
      size: 20,
    });

    expect(backendRequest).toHaveBeenCalledWith({
      method: HttpMethod.Get,
      url: "/api/coordinator/programs/program-1/meeting-feedback",
      params: { actorId: "coord-1", page: 1, size: 20, from: "2026-11-01" },
    });
  });

  it("leaves the window out for the whole program", async () => {
    await fetchProgramMeetingFeedback("coord-1", "program-1", {
      from: null,
      page: 0,
      size: 20,
    });

    expect(itemAt(vi.mocked(backendRequest).mock.calls, 0)[0].params).toEqual({
      actorId: "coord-1",
      page: 0,
      size: 20,
    });
  });
});
