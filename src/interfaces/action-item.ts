export enum ActionItemStatus {
  Open = "OPEN",
  InProgress = "IN_PROGRESS",
  Completed = "COMPLETED",
  Cancelled = "CANCELLED",
}

export interface ActionItem {
  id: string;
  organizationId: string;
  /** Null for a personal team (Organization.visibleName), which is never shown as a team. */
  organizationName?: string | null;
  meetingId?: string | null;
  ownerId: string;
  ownerName?: string;
  title: string;
  description?: string | null;
  status: ActionItemStatus;
  dueDate?: string | null;
  completionNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  mentorshipRequestId?: string | null;
  /** Who had the task before leaving the team; null for a task never handed over. */
  previousOwnerName?: string | null;
  ownerLeftAt?: string | null;
}
