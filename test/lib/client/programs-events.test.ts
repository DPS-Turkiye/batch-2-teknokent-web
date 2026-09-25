import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMemberProgramEvents } from "@/lib/client/programs";
import { httpClient } from "@/lib/http-client";
import { createMentorResponse } from "@test/fixtures/mentors";

vi.mock("@/lib/http-client", () => ({ httpClient: { get: vi.fn() } }));

describe("getMemberProgramEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("asks the proxy for a date range", async () => {
    vi.mocked(httpClient.get).mockResolvedValue(createMentorResponse([]));

    await getMemberProgramEvents({
      from: new Date("2026-09-21T00:00:00Z"),
      to: new Date("2026-09-28T00:00:00Z"),
    });

    expect(httpClient.get).toHaveBeenCalledWith("/api/programs/events", {
      params: {
        from: "2026-09-21T00:00:00.000Z",
        to: "2026-09-28T00:00:00.000Z",
      },
    });
  });
});
