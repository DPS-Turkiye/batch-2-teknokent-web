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

export enum MentorshipRequestMessageType {
  MenteeReply = "MENTEE_REPLY",
  MentorQuestion = "MENTOR_QUESTION",
}

export type RequestMessage = {
  messageType: MentorshipRequestMessageType;
  body: string;
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
  supportArea: string;
  summary?: string;
  status: MentorshipRequestStatus;
  mentorMessage: string | null;
  rejectionReason: string | null;
  createdAt: string;
  messages: RequestMessage[];
  recommendationSnapshot: RecommendationSnapshot | null;
};
