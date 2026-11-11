import { beforeEach, describe, expect, it, vi } from "vitest";

import { MeetingStatus } from "@/interfaces/meeting";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import {
  decideMentorRequest,
  getMentorRequests,
  getMentorshipMeetings,
  logMentorshipMeeting,
  markMentorRequestRead,
} from "@/lib/client/mentor-requests";
import { httpClient } from "@/lib/http-client";
import { createMentorResponse } from "@test/fixtures/mentors";

vi.mock("@/lib/http-client", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("mentor-requests client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("omits the role param for a mentee request list", async () => {
    vi.mocked(httpClient.get).mockResolvedValue(createMentorResponse([]));

    await getMentorRequests(UserRole.Mentee);

    expect(httpClient.get).toHaveBeenCalledWith("/api/mentor-requests", {
      params: undefined,
    });
  });

  it("sends the role param for a mentor request list", async () => {
    vi.mocked(httpClient.get).mockResolvedValue(createMentorResponse([]));

    await getMentorRequests(UserRole.Mentor);

    expect(httpClient.get).toHaveBeenCalledWith("/api/mentor-requests", {
      params: { role: UserRole.Mentor },
    });
  });

  it("submits a decision", async () => {
    vi.mocked(httpClient.patch).mockResolvedValue(createMentorResponse({}));

    await decideMentorRequest({
      id: "request-1",
      message: "Kabul edildi",
      status: MentorshipRequestStatus.Accepted,
    });

    expect(httpClient.patch).toHaveBeenCalledWith(
      "/api/mentor-requests/request-1/decision",
      {
        status: MentorshipRequestStatus.Accepted,
        message: "Kabul edildi",
      },
    );
  });

  it("fetches the meeting timeline for a request", async () => {
    vi.mocked(httpClient.get).mockResolvedValue(createMentorResponse([]));

    await getMentorshipMeetings("request-1");

    expect(httpClient.get).toHaveBeenCalledWith(
      "/api/mentor-requests/request-1/meetings",
    );
  });

  it("logs a new meeting for a request", async () => {
    vi.mocked(httpClient.post).mockResolvedValue(createMentorResponse({}));

    await logMentorshipMeeting("request-1", {
      mentorId: "mentor-1",
      scheduledAt: "2026-08-15T10:00:00.000Z",
      durationMinutes: 45,
      status: MeetingStatus.Completed,
    });

    expect(httpClient.post).toHaveBeenCalledWith(
      "/api/mentor-requests/request-1/meetings",
      {
        mentorId: "mentor-1",
        scheduledAt: "2026-08-15T10:00:00.000Z",
        durationMinutes: 45,
        status: MeetingStatus.Completed,
      },
    );
  });

  it("marks a conversation read through the proxy", async () => {
    vi.mocked(httpClient.post).mockResolvedValue(
      createMentorResponse({ id: "req 1" }),
    );

    await markMentorRequestRead("req 1");

    expect(httpClient.post).toHaveBeenCalledWith(
      "/api/mentor-requests/req%201/read",
      {},
    );
  });
});
