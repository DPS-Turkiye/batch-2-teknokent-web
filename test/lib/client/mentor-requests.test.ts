import { beforeEach, describe, expect, it, vi } from "vitest";

import { MeetingStatus } from "@/interfaces/meeting";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import { backendHttp } from "@/lib/client/backend-http";
import {
  decideMentorRequest,
  getMentorRequests,
  getMentorshipMeetings,
  logMentorshipMeeting,
  markMentorRequestRead,
} from "@/lib/client/mentor-requests";
import { createMentorResponse } from "@test/fixtures/mentors";
import { SIGNED_IN_USER_ID } from "@test/mocks/backend-http";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

describe("mentor-requests client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // The backend takes the team from the session; a mentor's list names the signed-in mentor, which it checks.
  it("names no scope for the team's own request list", async () => {
    vi.mocked(backendHttp.get).mockResolvedValue(createMentorResponse([]));

    await getMentorRequests(UserRole.Mentee);

    expect(backendHttp.get).toHaveBeenCalledWith("/api/mentorship-requests", {
      params: {},
    });
  });

  it("names the signed-in mentor for a mentor's request list", async () => {
    vi.mocked(backendHttp.get).mockResolvedValue(createMentorResponse([]));

    await getMentorRequests(UserRole.Mentor);

    expect(backendHttp.get).toHaveBeenCalledWith("/api/mentorship-requests", {
      params: { mentorId: SIGNED_IN_USER_ID },
    });
  });

  it("submits a decision", async () => {
    vi.mocked(backendHttp.patch).mockResolvedValue(createMentorResponse({}));

    await decideMentorRequest({
      id: "request-1",
      message: "Kabul edildi",
      status: MentorshipRequestStatus.Accepted,
    });

    expect(backendHttp.patch).toHaveBeenCalledWith(
      "/api/mentorship-requests/request-1/decision",
      {
        status: MentorshipRequestStatus.Accepted,
        message: "Kabul edildi",
      },
    );
  });

  it("fetches the meeting timeline for a request", async () => {
    vi.mocked(backendHttp.get).mockResolvedValue(createMentorResponse([]));

    await getMentorshipMeetings("request-1");

    expect(backendHttp.get).toHaveBeenCalledWith(
      "/api/mentorship-requests/request-1/meetings",
    );
  });

  it("logs a new meeting for a request", async () => {
    vi.mocked(backendHttp.post).mockResolvedValue(createMentorResponse({}));

    await logMentorshipMeeting("request-1", {
      scheduledAt: "2026-08-15T10:00:00.000Z",
      durationMinutes: 45,
      status: MeetingStatus.Completed,
    });

    expect(backendHttp.post).toHaveBeenCalledWith(
      "/api/mentorship-requests/request-1/meetings",
      {
        scheduledAt: "2026-08-15T10:00:00.000Z",
        durationMinutes: 45,
        status: MeetingStatus.Completed,
      },
    );
  });

  it("marks a conversation read, naming nobody", async () => {
    vi.mocked(backendHttp.post).mockResolvedValue(
      createMentorResponse({ id: "req 1" }),
    );

    await markMentorRequestRead("req 1");

    expect(backendHttp.post).toHaveBeenCalledWith(
      "/api/mentorship-requests/req%201/read",
    );
  });
});
