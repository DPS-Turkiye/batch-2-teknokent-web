export enum ProgramLifecycle {
  Upcoming = "UPCOMING",
  Active = "ACTIVE",
  Completed = "COMPLETED",
}

export type ProgramPhase = {
  id: string;
  name: string;
  position: number;
  startDate: string | null;
  endDate: string | null;
};

/** A program as its coordinator sees it (`GET /api/coordinator/programs`). */
export type CoordinatorProgram = {
  id: string;
  name: string;
  status: "ACTIVE" | "COMPLETED";
  lifecycle: ProgramLifecycle;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  coordinatorId: string;
  coordinatorName: string | null;
  teamCount: number;
  mentorCount: number;
  pendingMentorCount: number;
  activeMentorshipCount: number;
  riskyMentorshipCount: number;
  awaitingMatchCount: number;
  oldestAwaitingMatchDays: number | null;
  currentPhase: ProgramPhase | null;
  phases: ProgramPhase[];
  currentWeek: number | null;
  totalWeeks: number | null;
};
