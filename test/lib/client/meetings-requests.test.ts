import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserRole } from "@/interfaces/session";
import {
  deleteMeeting,
  getMeetingFeedback,
  getMeetingRoom,
  getMeetings,
  postMeetingFeedback,
  postMeetingGuest,
  setMeetingHeld,
} from "@/lib/client/meetings";
import { httpClient } from "@/lib/http-client";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";
import { createMentorResponse } from "@test/fixtures/mentors";

vi.mock("@/lib/http-client", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const feedback = { ratings: [5, 4], benefits: ["Yol haritası"] };

const calls: ClientCall[] = [
  {
    title: "getMeetings lets the primary role decide when no side is given",
    call: () => getMeetings(),
    method: "get",
    args: ["/api/meetings", undefined],
  },
  {
    title: "getMeetings asks for the mentee side of a two-sided account",
    call: () => getMeetings(UserRole.Mentee),
    method: "get",
    args: ["/api/meetings", { params: { as: UserRole.Mentee } }],
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

  itSendsEachClientCall(calls);

  it("getMeetingFeedback reads a 404 from older backends as not rated yet", async () => {
    vi.mocked(httpClient.get).mockResolvedValue(
      createMentorResponse({ message: "Not found" }, 404),
    );

    await expect(getMeetingFeedback("m-1")).resolves.toBeNull();
  });

  it("getMeetingFeedback still rejects when the server fails", async () => {
    vi.mocked(httpClient.get).mockResolvedValue(createMentorResponse({}, 500));

    await expect(getMeetingFeedback("m-1")).rejects.toMatchObject({
      status: 500,
    });
  });
});
