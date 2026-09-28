import { vi } from "vitest";

import type { MentorshipMeetingProposals } from "@/hooks/use-meeting-proposals";
import {
  type MeetingProposal,
  MeetingProposalStatus,
} from "@/interfaces/meeting-proposal";

export function meetingProposal(
  overrides: Partial<MeetingProposal> = {},
): MeetingProposal {
  return {
    id: "proposal-1",
    mentorshipId: "mentorship-1",
    programId: "program-1",
    programName: "METU Stars 2026",
    mentorId: "mentor-1",
    mentorName: "Ayşe Demir",
    organizationId: "org-1",
    organizationName: "Lumen",
    proposedByName: "Elif Demir",
    scheduledAt: "2026-10-01T07:30:00Z",
    durationMinutes: 45,
    agenda: "Nakit akışı",
    replacesMeetingId: null,
    status: MeetingProposalStatus.Pending,
    mentorAcceptedAt: null,
    teamAcceptedAt: null,
    teamResponderName: null,
    declinedByName: null,
    declineReason: null,
    meetingId: null,
    remindedAt: null,
    createdAt: "2026-09-27T09:00:00Z",
    canRespond: true,
    ...overrides,
  };
}

export function mentorshipProposalsStub(
  overrides: Partial<MentorshipMeetingProposals> = {},
): MentorshipMeetingProposals {
  return {
    query: {} as MentorshipMeetingProposals["query"],
    open: null,
    latest: null,
    declined: null,
    composing: false,
    openComposer: vi.fn(),
    closeComposer: vi.fn(),
    rescheduling: false,
    startsAt: "2026-10-01T10:30",
    setStartsAt: vi.fn(),
    duration: 45,
    setDuration: vi.fn(),
    agenda: "",
    setAgenda: vi.fn(),
    canPropose: true,
    propose: vi.fn(),
    proposing: false,
    proposeError: null,
    remind: vi.fn(),
    reminding: false,
    reminded: false,
    withdraw: vi.fn(),
    withdrawing: false,
    actionError: null,
    ...overrides,
  };
}
