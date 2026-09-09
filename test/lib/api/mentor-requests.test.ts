import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchMentorRequests,
  isMentorRequestAction,
  mutateMentorRequest,
  MentorRequestAction,
} from "@/lib/api/mentor-requests";
import { UserRole } from "@/interfaces/session";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

describe("fetchMentorRequests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scopes by mentorId when role is mentor", async () => {
    await fetchMentorRequests({
      requesterId: "mentor-1",
      role: UserRole.Mentor,
    });
    expect(backendRequest).toHaveBeenCalledWith(
      expect.objectContaining({ params: { mentorId: "mentor-1" } }),
    );
  });

  it("scopes mentee lists by organization so the whole startup sees the request", async () => {
    await fetchMentorRequests({
      organizationId: "org-1",
      role: UserRole.Mentee,
    });
    expect(backendRequest).toHaveBeenCalledWith(
      expect.objectContaining({ params: { organizationId: "org-1" } }),
    );
  });
});

describe("isMentorRequestAction", () => {
  it("accepts every action the [id]/[action] proxy route needs to route, including the mentorship timeline's plural 'meetings'", () => {
    for (const action of [
      "alternatives",
      "availability",
      "decision",
      "messages",
      "meeting",
      "meetings",
      "withdrawal",
    ]) {
      expect(isMentorRequestAction(action)).toBe(true);
    }
  });

  it("rejects an unknown action", () => {
    expect(isMentorRequestAction("not-a-real-action")).toBe(false);
  });
});

describe("mutateMentorRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("injects the mentor id into decision payloads", async () => {
    await mutateMentorRequest({
      action: MentorRequestAction.Decision,
      data: { status: "ACCEPTED", message: "ok" },
      id: "req-1",
      method: HttpMethod.Patch,
      requesterId: "mentee-1",
      mentorId: "mentor-1",
    });

    expect(backendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: "ACCEPTED", message: "ok", mentorId: "mentor-1" },
      }),
    );
  });

  it("injects the requester id for actions that need it, not the mentor id", async () => {
    await mutateMentorRequest({
      action: MentorRequestAction.Withdrawal,
      data: {},
      id: "req-1",
      method: HttpMethod.Patch,
      requesterId: "mentee-1",
    });

    expect(backendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { requesterId: "mentee-1" },
      }),
    );
  });

  it("leaves the payload untouched for actions outside either list", async () => {
    await mutateMentorRequest({
      action: MentorRequestAction.Availability,
      id: "req-1",
      method: HttpMethod.Get,
      requesterId: "mentee-1",
    });

    expect(backendRequest).toHaveBeenCalledWith(
      expect.objectContaining({ data: undefined }),
    );
  });
});
