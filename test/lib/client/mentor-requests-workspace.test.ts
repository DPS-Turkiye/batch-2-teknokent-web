import { beforeEach, describe, vi } from "vitest";

import { UserRole } from "@/interfaces/session";
import { backendHttp } from "@/lib/client/backend-http";
import {
  acceptProposedMentorSlot,
  getAlternativeMentors,
  getMentorAvailability,
  getMentorRequest,
  getMentorRequestsPage,
  postMentorMessage,
  replyToMentorRequest,
  scheduleMeeting,
  withdrawMentorRequest,
} from "@/lib/client/mentor-requests";
import { MentorshipWorkspaceTab } from "@/types/mentorship";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";
import { SIGNED_IN_USER_ID } from "@test/mocks/backend-http";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

const R = "/api/mentorship-requests/r%2F1";

const calls: ClientCall[] = [
  {
    title: "getMentorRequestsPage pages a mentee's tab with no role param",
    call: () =>
      getMentorRequestsPage({
        tab: MentorshipWorkspaceTab.History,
        page: 2,
        size: 20,
      }),
    method: "get",
    args: [
      "/api/mentorship-requests",
      { params: { tab: MentorshipWorkspaceTab.History, page: 2, size: 20 } },
    ],
  },
  {
    title:
      "getMentorRequestsPage pages a mentor's tab, naming the signed-in mentor",
    call: () =>
      getMentorRequestsPage({
        role: UserRole.Mentor,
        tab: MentorshipWorkspaceTab.Requests,
        page: 0,
        size: 10,
      }),
    method: "get",
    args: [
      "/api/mentorship-requests",
      {
        params: {
          mentorId: SIGNED_IN_USER_ID,
          tab: MentorshipWorkspaceTab.Requests,
          page: 0,
          size: 10,
        },
      },
    ],
  },
  {
    title: "getMentorRequestsPage sends no role for an explicit mentee",
    call: () =>
      getMentorRequestsPage({
        role: UserRole.Mentee,
        tab: MentorshipWorkspaceTab.Active,
        page: 0,
        size: 10,
      }),
    method: "get",
    args: [
      "/api/mentorship-requests",
      { params: { tab: MentorshipWorkspaceTab.Active, page: 0, size: 10 } },
    ],
  },
  {
    title: "getMentorRequest reads the encoded request",
    call: () => getMentorRequest("r/1"),
    method: "get",
    args: [R],
  },
  {
    title: "replyToMentorRequest posts the mentee's message",
    call: () => replyToMentorRequest({ id: "r/1", message: "Ek bilgi" }),
    method: "post",
    args: [`${R}/messages`, { message: "Ek bilgi" }],
  },
  {
    title: "postMentorMessage posts the mentor's message",
    call: () => postMentorMessage({ id: "r/1", message: "Merhaba" }),
    method: "post",
    args: [`${R}/mentor-messages`, { message: "Merhaba" }],
  },
  {
    title: "withdrawMentorRequest patches the withdrawal",
    call: () => withdrawMentorRequest("r/1"),
    method: "patch",
    args: [`${R}/withdrawal`],
  },
  {
    title: "getMentorAvailability reads the request's mentor slots",
    call: () => getMentorAvailability("r/1"),
    method: "get",
    args: [`${R}/availability`],
  },
  {
    title: "scheduleMeeting posts the chosen slot",
    call: () => scheduleMeeting({ id: "r/1", slotId: "slot-1" }),
    method: "post",
    args: [`${R}/meeting`, { slotId: "slot-1" }],
  },
  {
    title: "getAlternativeMentors lists other mentors for the request",
    call: () => getAlternativeMentors("r/1"),
    method: "get",
    args: [`${R}/alternatives`],
  },
  {
    title: "acceptProposedMentorSlot patches the selected slot",
    call: () =>
      acceptProposedMentorSlot({
        id: "r/1",
        selectedSlot: "2026-05-01T10:00:00Z",
      }),
    method: "patch",
    args: [`${R}/accept-proposal`, { selectedSlot: "2026-05-01T10:00:00Z" }],
  },
];

describe("mentor requests client (workspace calls)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  itSendsEachClientCall(calls, backendHttp);
});
