export enum MentorshipRequestStatus {
  Accepted = "ACCEPTED",
  Declined = "DECLINED",
  MoreInfoRequested = "MORE_INFO_REQUESTED",
  Pending = "PENDING",
  Withdrawn = "WITHDRAWN",
}

export enum MentorDecisionMode {
  Accept = "ACCEPT",
  AskInfo = "ASK_INFO",
  Decline = "DECLINE",
}

export enum MentorRequestFilter {
  All = "ALL",
  Accepted = MentorshipRequestStatus.Accepted,
  Declined = MentorshipRequestStatus.Declined,
  MoreInfoRequested = MentorshipRequestStatus.MoreInfoRequested,
  Pending = MentorshipRequestStatus.Pending,
}

export type RequestMessage = {
  messageType: "MENTEE_REPLY" | "MENTOR_QUESTION";
  body: string;
};

export type MentorshipRequest = {
  id: string;
  requesterId: string;
  requesterName?: string;
  organizationId: string;
  organizationName?: string;
  mentorId: string;
  mentorName: string;
  supportArea: string;
  summary?: string;
  status: MentorshipRequestStatus;
  mentorMessage: string | null;
  rejectionReason: string | null;
  createdAt: string;
  messages: RequestMessage[];
};
