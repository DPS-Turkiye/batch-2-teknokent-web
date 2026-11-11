export enum CoordinatorConversationCounterpart {
  Team = "TEAM",
  Mentor = "MENTOR",
}

/** A thread between a program's coordinator and one of its teams or mentors. */
export type CoordinatorConversation = {
  id: string;
  programId: string;
  programName: string | null;
  counterpartType: CoordinatorConversationCounterpart;
  counterpartId: string;
  counterpartName: string;
  /** Null when neither the thread's coordinator nor the program's creator is known. */
  coordinatorId: string | null;
  coordinatorName: string | null;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unread: boolean;
  unreadCount?: number;
  otherSideReadAt?: string | null;
};

export type CoordinatorMessage = {
  id: string;
  /** Null once the sender's account was deleted (sender_id ON DELETE SET NULL). */
  senderId: string | null;
  senderName: string | null;
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
