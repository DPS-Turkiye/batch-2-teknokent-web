export enum MentorshipRequestStatus {
  Accepted = "ACCEPTED",
  CounterProposed = "COUNTER_PROPOSED",
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

export enum MentorshipRequestMessageType {
  MenteeReply = "MENTEE_REPLY",
  MentorQuestion = "MENTOR_QUESTION",
  MenteeMessage = "MENTEE_MESSAGE",
  MentorMessage = "MENTOR_MESSAGE",
}

export type RequestMessage = {
  id: string;
  authorId: string;
  authorName: string;
  messageType: MentorshipRequestMessageType;
  body: string;
  createdAt: string;
};

export type RecommendationSnapshot = {
  matchingMethod: string;
  matchingModel: string | null;
  generatedAt: string;
  startupName: string | null;
  startupSector: string | null;
  startupStage: string | null;
  startupSummary: string | null;
  startupTechnologies: string[];
};

export type MentorshipRequest = {
  id: string;
  requesterId: string;
  requesterName?: string;
  organizationId: string;
  organizationName?: string;
  mentorId: string;
  mentorName: string;
  requestedForName?: string;
  supportArea: string;
  summary?: string;
  requesterMessage?: string;
  status: MentorshipRequestStatus;
  mentorMessage: string | null;
  rejectionReason: string | null;
  createdAt: string;
  messages: RequestMessage[];
  recommendationSnapshot: RecommendationSnapshot | null;
  plannedSessionCount?: number | null;
  mentorReadAt?: string | null;
  menteeReadAt?: string | null;
};
