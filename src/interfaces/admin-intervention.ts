export type AdminIntervention = {
  id: string;
  mentorshipId: string;
  coordinatorId: string;
  coordinatorName: string;
  openedByName: string;
  action: string;
  note: string | null;
  openedAt: string;
  readAt: string | null;
  plannedMeetingAt: string | null;
  resolvedAt: string | null;
};

export const INTERVENTION_ACTION = "48 saat içinde görüşme planlansın";
