import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateMeeting } from "@/lib/client/meetings";
import { httpClient } from "@/lib/http-client";
import { MeetingStatus } from "@/interfaces/meeting";
import { createMentorResponse } from "@test/fixtures/mentors";

vi.mock("@/lib/http-client", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("meetings client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends only the provided fields when updating a meeting", async () => {
    vi.mocked(httpClient.patch).mockResolvedValue(createMentorResponse({}));

    await updateMeeting("meeting-1", {
      notes: "Yeni not",
      status: MeetingStatus.Completed,
    });

    expect(httpClient.patch).toHaveBeenCalledWith("/api/meetings/meeting-1", {
      notes: "Yeni not",
      status: MeetingStatus.Completed,
    });
  });
});
