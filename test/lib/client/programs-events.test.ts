import { beforeEach, describe, expect, it, vi } from "vitest";

import { backendHttp } from "@/lib/client/backend-http";
import { getMemberProgramEvents } from "@/lib/client/programs";
import { createMentorResponse } from "@test/fixtures/mentors";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

describe("getMemberProgramEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("asks the proxy for a date range", async () => {
    vi.mocked(backendHttp.get).mockResolvedValue(createMentorResponse([]));

    await getMemberProgramEvents({
      from: new Date("2026-09-21T00:00:00Z"),
      to: new Date("2026-09-28T00:00:00Z"),
    });

    expect(backendHttp.get).toHaveBeenCalledWith("/api/programs/events", {
      params: {
        from: "2026-09-21T00:00:00.000Z",
        to: "2026-09-28T00:00:00.000Z",
      },
    });
  });
});
