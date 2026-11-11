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

/**
 * How a recommendation was made. The backend stores it as free text: it reports its own method in a header, and a
 * request started from a startup's profile is marked by this app.
 */
export const MatchingMethod = {
  Deterministic: "DETERMINISTIC",
  Profile: "PROFILE",
} as const;

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
  programId?: string | null;
  programName?: string | null;
  id: string;
  requesterId: string;
  requesterName?: string;
  organizationId: string;
  /** Null for a personal team (Organization.visibleName), which is never shown as a team. */
  organizationName?: string | null;
  mentorId: string;
  mentorName: string;
  requestedForName?: string;
  supportArea: string;
  summary?: string;
  requesterMessage?: string | null;
  /** The mentee's "BEKLENEN ÇIKTI"; null on requests sent before it had its own field. */
  expectedOutcome?: string | null;
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
