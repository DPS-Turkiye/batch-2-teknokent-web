import { beforeEach, describe, vi } from "vitest";

import {
  acceptMeetingProposal,
  declineMeetingProposal,
  getCoordinatorMeetingProposals,
  getMentorshipMeetingProposals,
  getMyMeetingProposals,
  proposeMeeting,
  proposeReschedule,
  remindMeetingProposal,
  withdrawMeetingProposal,
} from "@/lib/client/meeting-proposals";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";

vi.mock("@/lib/http-client", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const proposal = {
  scheduledAt: "2026-04-01T09:00:00Z",
  durationMinutes: 45,
  agenda: null,
  replacesMeetingId: null,
};

const calls: ClientCall[] = [
  {
    title:
      "getCoordinatorMeetingProposals lists every program's proposals with no program",
    call: () => getCoordinatorMeetingProposals(null),
    method: "get",
    args: ["/api/coordinator/meeting-proposals", { params: undefined }],
  },
  {
    title: "getCoordinatorMeetingProposals narrows to the chosen program",
    call: () => getCoordinatorMeetingProposals("prog-1"),
    method: "get",
    args: [
      "/api/coordinator/meeting-proposals",
      { params: { programId: "prog-1" } },
    ],
  },
  {
    title: "getMentorshipMeetingProposals narrows to one mentorship",
    call: () => getMentorshipMeetingProposals("ms-1"),
    method: "get",
    args: [
      "/api/coordinator/meeting-proposals",
      { params: { mentorshipId: "ms-1" } },
    ],
  },
  {
    title: "proposeMeeting posts the proposal under the encoded mentorship",
    call: () => proposeMeeting("ms/1", proposal),
    method: "post",
    args: ["/api/coordinator/mentorships/ms%2F1/meeting-proposals", proposal],
  },
  {
    title:
      "remindMeetingProposal posts to the encoded proposal's remind action",
    call: () => remindMeetingProposal("p/1"),
    method: "post",
    args: ["/api/coordinator/meeting-proposals/p%2F1/remind"],
    returnsNothing: true,
  },
  {
    title: "withdrawMeetingProposal deletes the encoded proposal",
    call: () => withdrawMeetingProposal("p/1"),
    method: "delete",
    args: ["/api/coordinator/meeting-proposals/p%2F1"],
    returnsNothing: true,
  },
  {
    title: "getMyMeetingProposals lists the participant's proposals",
    call: () => getMyMeetingProposals(),
    method: "get",
    args: ["/api/meeting-proposals"],
  },
  {
    title:
      "acceptMeetingProposal posts to the encoded proposal's accept action",
    call: () => acceptMeetingProposal("p/1"),
    method: "post",
    args: ["/api/meeting-proposals/p%2F1/accept"],
  },
  {
    title: "declineMeetingProposal sends the trimmed reason",
    call: () => declineMeetingProposal("p/1", "  O gün sınavım var  "),
    method: "post",
    args: [
      "/api/meeting-proposals/p%2F1/decline",
      { reason: "O gün sınavım var" },
    ],
  },
  {
    title: "declineMeetingProposal sends a blank reason as null",
    call: () => declineMeetingProposal("p/1", "   "),
    method: "post",
    args: ["/api/meeting-proposals/p%2F1/decline", { reason: null }],
  },
  {
    title: "proposeReschedule posts the new time under the encoded meeting",
    call: () =>
      proposeReschedule("m/1", {
        scheduledAt: "2026-04-02T09:00:00Z",
        durationMinutes: 30,
      }),
    method: "post",
    args: [
      "/api/meetings/m%2F1/reschedule-proposals",
      { scheduledAt: "2026-04-02T09:00:00Z", durationMinutes: 30 },
    ],
  },
];

describe("meeting proposals client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  itSendsEachClientCall(calls);
});
