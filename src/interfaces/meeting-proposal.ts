export enum MeetingProposalStatus {
  Pending = "PENDING",
  Confirmed = "CONFIRMED",
  Declined = "DECLINED",
  Withdrawn = "WITHDRAWN",
}

/** A coordinator's proposed meeting time that the mentor and the team lead each accept. */
export type MeetingProposal = {
  id: string;
  /** Null for a meeting proposed between a mentor and team outside a mentorship. */
  mentorshipId: string | null;
  /** Null for a proposal that is not tied to a program. */
  programId: string | null;
  programName: string | null;
  mentorId: string;
  mentorName: string;
  organizationId: string;
  organizationName: string;
  proposedByName: string | null;
  scheduledAt: string;
  durationMinutes: number;
  agenda: string | null;
  replacesMeetingId: string | null;
  status: MeetingProposalStatus;
  mentorAcceptedAt: string | null;
  teamAcceptedAt: string | null;
  teamResponderName: string | null;
  declinedByName: string | null;
  declineReason: string | null;
  meetingId: string | null;
  remindedAt: string | null;
  createdAt: string;
  /** From the viewer's side: they are the mentor or the team lead and have not answered yet. */
  canRespond: boolean;
};

export type ProposeMeetingInput = {
  scheduledAt: string;
  durationMinutes: number;
  agenda: string | null;
  replacesMeetingId: string | null;
};
