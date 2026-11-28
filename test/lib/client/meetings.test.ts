import { beforeEach, describe, expect, it, vi } from "vitest";

import { MeetingStatus } from "@/interfaces/meeting";
import { backendHttp } from "@/lib/client/backend-http";
import {
  getMeetingFeedback,
  getRatedMeetingIds,
  postMeeting,
  updateMeeting,
} from "@/lib/client/meetings";
import { createMentorResponse } from "@test/fixtures/mentors";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

describe("meetings client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends only the provided fields when updating a meeting", async () => {
    vi.mocked(backendHttp.patch).mockResolvedValue(createMentorResponse({}));

    await updateMeeting("meeting-1", {
      notes: "Yeni not",
      status: MeetingStatus.Completed,
    });

    expect(backendHttp.patch).toHaveBeenCalledWith("/api/meetings/meeting-1", {
      notes: "Yeni not",
      status: MeetingStatus.Completed,
    });
  });

  it("shows the backend's sentence when every recording bot is busy", async () => {
    const busy =
      "Bu saatte 3 kayıt botunun hepsi başka görüşmelerde. Başka bir saat seçebilir ya da kaydı kapatarak görüşmeyi planlayabilirsiniz.";
    vi.mocked(backendHttp.post).mockResolvedValue(
      createMentorResponse({ message: busy }, 409),
    );

    await expect(
      postMeeting({ transcribeRequested: true }),
    ).rejects.toMatchObject({ status: 409, message: busy });
  });

  it("reads a meeting the author has not rated yet as no feedback", async () => {
    vi.mocked(backendHttp.get).mockResolvedValueOnce(
      createMentorResponse("", 204),
    );
    await expect(getMeetingFeedback("meeting-1")).resolves.toBeNull();

    vi.mocked(backendHttp.get).mockResolvedValueOnce(
      createMentorResponse({ ratings: [5] }),
    );
    await expect(getMeetingFeedback("meeting-1")).resolves.toEqual({
      ratings: [5],
    });
  });

  it("asks for every meeting's rating in one call", async () => {
    vi.mocked(backendHttp.get).mockResolvedValueOnce(
      createMentorResponse(["meeting-1"]),
    );

    await expect(
      getRatedMeetingIds(["meeting-1", "meeting-2"]),
    ).resolves.toEqual(["meeting-1"]);
    expect(backendHttp.get).toHaveBeenCalledWith("/api/meetings/feedback", {
      params: { meetingIds: "meeting-1,meeting-2" },
    });
  });
});
