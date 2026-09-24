import {
  type CoordinatorProgram,
  ProgramLifecycle,
  type ProgramPhase,
} from "@/interfaces/coordinator-program";

export function phase(
  id: string,
  name: string,
  position: number,
): ProgramPhase {
  return { id, name, position, startDate: null, endDate: null };
}

export function coordinatorProgram(
  overrides: Partial<CoordinatorProgram> = {},
): CoordinatorProgram {
  return {
    id: "program-1",
    name: "METU Stars 2026",
    status: "ACTIVE",
    lifecycle: ProgramLifecycle.Active,
    description: null,
    startDate: "2026-02-01",
    endDate: "2026-12-10",
    coordinatorId: "coordinator-1",
    coordinatorName: "Elif Demir",
    teamCount: 42,
    mentorCount: 28,
    pendingMentorCount: 3,
    activeMentorshipCount: 64,
    riskyMentorshipCount: 6,
    awaitingMatchCount: 5,
    oldestAwaitingMatchDays: 4,
    currentPhase: null,
    phases: [],
    currentWeek: 6,
    totalWeeks: 16,
    ...overrides,
  };
}
