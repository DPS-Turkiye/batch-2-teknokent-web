export enum CoordinatorConversationCounterpart {
  Team = "TEAM",
  Mentor = "MENTOR",
}

/** A thread between a program's coordinator and one of its teams or mentors. */
export type CoordinatorConversation = {
  id: string;
  programId: string;
  programName: string;
  counterpartType: CoordinatorConversationCounterpart;
  counterpartId: string;
  counterpartName: string;
  coordinatorId: string;
  coordinatorName: string;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unread: boolean;
  unreadCount?: number;
  otherSideReadAt?: string | null;
};

export type CoordinatorMessage = {
  id: string;
  senderId: string;
  senderName: string;
  mine: boolean;
  body: string;
  createdAt: string;
};

/** Exactly one of `organizationId` (a team) or `mentorId`. */
export type StartCoordinatorConversationInput = {
  programId: string;
  organizationId: string | null;
  mentorId: string | null;
};
