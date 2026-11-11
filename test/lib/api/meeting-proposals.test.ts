import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  acceptMeetingProposal,
  declineMeetingProposal,
  fetchCoordinatorMeetingProposals,
  fetchMyMeetingProposals,
  proposeMeeting,
  proposeReschedule,
  remindMeetingProposal,
  withdrawMeetingProposal,
} from "@/lib/api/meeting-proposals";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

const ACTOR = "user-1";

type RequestCase = [
  description: string,
  call: () => Promise<unknown>,
  request: AxiosRequestConfig,
];

const cases: RequestCase[] = [
  [
    "lists every coordinator proposal when neither filter is set",
    () =>
      fetchCoordinatorMeetingProposals(ACTOR, {
        programId: null,
        mentorshipId: null,
      }),
    {
      method: "GET",
      url: "/api/coordinator/meeting-proposals",
      params: { actorId: ACTOR },
    },
  ],
  [
    "narrows coordinator proposals to the program and the mentorship",
    () =>
      fetchCoordinatorMeetingProposals(ACTOR, {
        programId: "prog-1",
        mentorshipId: "ms-1",
      }),
    {
      method: "GET",
      url: "/api/coordinator/meeting-proposals",
      params: { actorId: ACTOR, programId: "prog-1", mentorshipId: "ms-1" },
    },
  ],
  [
    "proposes a meeting for an encoded mentorship with the actor in the body",
    () =>
      proposeMeeting(ACTOR, "ms/1", {
        scheduledAt: "2026-11-20T10:00:00Z",
        durationMinutes: 45,
        agenda: null,
        replacesMeetingId: null,
      }),
    {
      method: "POST",
      url: "/api/coordinator/mentorships/ms%2F1/meeting-proposals",
      data: {
        scheduledAt: "2026-11-20T10:00:00Z",
        durationMinutes: 45,
        agenda: null,
        replacesMeetingId: null,
        actorId: ACTOR,
      },
    },
  ],
  [
    "reminds the other side of a proposal",
    () => remindMeetingProposal(ACTOR, "prop/1"),
    {
      method: "POST",
      url: "/api/coordinator/meeting-proposals/prop%2F1/remind",
      params: { actorId: ACTOR },
    },
  ],
  [
    "withdraws a proposal",
    () => withdrawMeetingProposal(ACTOR, "prop/1"),
    {
      method: "DELETE",
      url: "/api/coordinator/meeting-proposals/prop%2F1",
      params: { actorId: ACTOR },
    },
  ],
  [
    "lists the participant's own proposals",
    () => fetchMyMeetingProposals(ACTOR),
    {
      method: "GET",
      url: "/api/meeting-proposals",
      params: { actorId: ACTOR },
    },
  ],
  [
    "accepts a proposal",
    () => acceptMeetingProposal(ACTOR, "prop/1"),
    {
      method: "POST",
      url: "/api/meeting-proposals/prop%2F1/accept",
      params: { actorId: ACTOR },
    },
  ],
  [
    "declines a proposal with the reason in the body",
    () => declineMeetingProposal(ACTOR, "prop/1", "Sınav haftası"),
    {
      method: "POST",
      url: "/api/meeting-proposals/prop%2F1/decline",
      data: { actorId: ACTOR, reason: "Sınav haftası" },
    },
  ],
  [
    "declines a proposal without a reason as null",
    () => declineMeetingProposal(ACTOR, "prop/1", null),
    {
      method: "POST",
      url: "/api/meeting-proposals/prop%2F1/decline",
      data: { actorId: ACTOR, reason: null },
    },
  ],
  [
    "proposes a new time for an encoded meeting",
    () =>
      proposeReschedule(ACTOR, "meet/1", {
        scheduledAt: "2026-11-21T09:00:00Z",
        durationMinutes: 30,
      }),
    {
      method: "POST",
      url: "/api/meetings/meet%2F1/reschedule-proposals",
      data: {
        scheduledAt: "2026-11-21T09:00:00Z",
        durationMinutes: 30,
        actorId: ACTOR,
      },
    },
  ],
];

describe("meeting proposals server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
