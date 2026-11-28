import { beforeEach, describe, expect, it, vi } from "vitest";

import { backendHttp } from "@/lib/client/backend-http";
import {
  deleteMeeting,
  getMeetingFeedback,
  getMeetingRoom,
  getMeetings,
  postMeeting,
  postMeetingFeedback,
  postMeetingGuest,
  postMentorMeeting,
  setMeetingHeld,
} from "@/lib/client/meetings";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";
import { createMentorResponse } from "@test/fixtures/mentors";
import { SIGNED_IN_USER_ID } from "@test/mocks/backend-http";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

const feedback = { ratings: [5, 4], benefits: ["Yol haritası"] };

const calls: ClientCall[] = [
  {
    title:
      "getMeetings names no side: the backend takes the caller's primary one",
    call: () => getMeetings(),
    method: "get",
    args: ["/api/meetings"],
  },
  {
    title: "postMeeting plans a meeting of the caller's own team",
    call: () => postMeeting({ scheduledAt: "2099-01-05T10:00:00Z" }),
    method: "post",
    args: ["/api/meetings", { scheduledAt: "2099-01-05T10:00:00Z" }],
  },
  {
    title:
      "postMentorMeeting names the signed-in mentor, which the backend checks",
    call: () => postMentorMeeting({ organizationId: "org-1" }),
    method: "post",
    args: [
      "/api/meetings",
      { organizationId: "org-1", mentorId: SIGNED_IN_USER_ID },
    ],
  },
  {
    title: "postMeetingFeedback posts the ratings for the encoded meeting",
    call: () => postMeetingFeedback("m/1", feedback),
    method: "post",
    args: ["/api/meetings/m%2F1/feedback", feedback],
  },
  {
    title: "setMeetingHeld posts to mark the meeting held",
    call: () => setMeetingHeld("m/1", true),
    method: "post",
    args: ["/api/meetings/m%2F1/held"],
  },
  {
    title: "setMeetingHeld deletes to mark the meeting not held",
    call: () => setMeetingHeld("m/1", false),
    method: "delete",
    args: ["/api/meetings/m%2F1/held"],
  },
  {
    title: "getMeetingRoom reads the meeting's room",
    call: () => getMeetingRoom("m/1"),
    method: "get",
    args: ["/api/meetings/m%2F1/room"],
  },
  {
    title: "postMeetingGuest posts the guest to add",
    call: () => postMeetingGuest("m/1", { mentorId: "mentor-2" }),
    method: "post",
    args: ["/api/meetings/m%2F1/guests", { mentorId: "mentor-2" }],
  },
  {
    title: "deleteMeeting deletes the encoded meeting",
    call: () => deleteMeeting("m/1"),
    method: "delete",
    args: ["/api/meetings/m%2F1"],
    returnsNothing: true,
  },
];

describe("meetings client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  itSendsEachClientCall(calls, backendHttp);

  it("getMeetingFeedback reads a 404 from older backends as not rated yet", async () => {
    vi.mocked(backendHttp.get).mockResolvedValue(
      createMentorResponse({ message: "Not found" }, 404),
    );

    await expect(getMeetingFeedback("m-1")).resolves.toBeNull();
  });

  it("getMeetingFeedback still rejects when the server fails", async () => {
    vi.mocked(backendHttp.get).mockResolvedValue(createMentorResponse({}, 500));

    await expect(getMeetingFeedback("m-1")).rejects.toMatchObject({
      status: 500,
    });
  });
});
