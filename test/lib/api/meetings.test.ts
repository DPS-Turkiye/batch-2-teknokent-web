import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createMeeting,
  deleteMeeting,
  fetchMeetingFeedback,
  fetchMeetingRoom,
  fetchMeetings,
  fetchRatedMeetingIds,
  inviteMeetingGuest,
  setMeetingHeld,
  submitMeetingFeedback,
  updateMeeting,
} from "@/lib/api/meetings";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

const MEETING_URL = "/api/meetings/meet%2F1";

type RequestCase = [
  description: string,
  call: () => Promise<unknown>,
  request: AxiosRequestConfig,
];

const cases: RequestCase[] = [
  [
    "lists meetings in the given scope",
    () => fetchMeetings({ organizationId: "org-1" }),
    {
      method: "GET",
      url: "/api/meetings",
      params: { organizationId: "org-1" },
    },
  ],
  [
    "books a meeting for the startup with the mentor added",
    () => createMeeting("org-1", { title: "Haftalık" }, "mentor-1"),
    {
      method: "POST",
      url: "/api/meetings",
      data: {
        title: "Haftalık",
        organizationId: "org-1",
        mentorId: "mentor-1",
      },
    },
  ],
  [
    "books a meeting without a mentor key when the startup books it alone",
    () => createMeeting("org-1", { title: "Haftalık" }),
    {
      method: "POST",
      url: "/api/meetings",
      data: { title: "Haftalık", organizationId: "org-1" },
    },
  ],
  [
    "lets the session's startup override an organization in the payload",
    () => createMeeting("org-1", { organizationId: "org-other" }),
    {
      method: "POST",
      url: "/api/meetings",
      data: { organizationId: "org-1" },
    },
  ],
  [
    "submits feedback with the author in the query",
    () => submitMeetingFeedback("meet/1", "user-1", { rating: 5 }),
    {
      method: "POST",
      url: `${MEETING_URL}/feedback`,
      params: { authorId: "user-1" },
      data: { rating: 5 },
    },
  ],
  [
    "asks which meetings were rated with the ids joined by commas",
    () => fetchRatedMeetingIds(["m-1", "m-2", "m-3"], "user-1"),
    {
      method: "GET",
      url: "/api/meetings/feedback",
      params: { meetingIds: "m-1,m-2,m-3", authorId: "user-1" },
    },
  ],
  [
    "reads the author's own feedback for one meeting",
    () => fetchMeetingFeedback("meet/1", "user-1"),
    {
      method: "GET",
      url: `${MEETING_URL}/feedback`,
      params: { authorId: "user-1" },
    },
  ],
  [
    "patches a meeting at its encoded path",
    () => updateMeeting("meet/1", { agenda: "Demo" }),
    { method: "PATCH", url: MEETING_URL, data: { agenda: "Demo" } },
  ],
  [
    "marks a meeting held with POST",
    () => setMeetingHeld("meet/1", "mentor-1", true),
    {
      method: "POST",
      url: `${MEETING_URL}/held`,
      params: { mentorId: "mentor-1" },
    },
  ],
  [
    "takes the held mark back with DELETE",
    () => setMeetingHeld("meet/1", "mentor-1", false),
    {
      method: "DELETE",
      url: `${MEETING_URL}/held`,
      params: { mentorId: "mentor-1" },
    },
  ],
  [
    "reads the meeting's room",
    () => fetchMeetingRoom("meet/1"),
    { method: "GET", url: `${MEETING_URL}/room` },
  ],
  [
    "invites a guest with the payload as the body",
    () => inviteMeetingGuest("meet/1", { mentorId: "mentor-2" }),
    {
      method: "POST",
      url: `${MEETING_URL}/guests`,
      data: { mentorId: "mentor-2" },
    },
  ],
  [
    "deletes a meeting at its encoded path",
    () => deleteMeeting("meet/1"),
    { method: "DELETE", url: MEETING_URL },
  ],
];

describe("meetings server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
