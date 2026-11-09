import {
  type CoordinatorProgram,
  type CoordinatorProgramDetail,
  ProgramEventKind,
  ProgramLifecycle,
  type ProgramPhase,
} from "@/interfaces/coordinator-program";
import { ProgramType } from "@/interfaces/program";

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
    type: ProgramType.StartupMentoring,
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

export function coordinatorProgramDetail(
  overrides: Partial<CoordinatorProgramDetail> = {},
): CoordinatorProgramDetail {
  return {
    program: coordinatorProgram({
      phases: [
        phase("phase-1", "Başvuru", 0),
        phase("phase-2", "Mentorluk dönemi", 1),
        phase("phase-3", "Demo Day", 2),
      ],
      currentPhase: phase("phase-2", "Mentorluk dönemi", 1),
      currentWeek: 6,
      totalWeeks: 16,
    }),
    rules: {
      meetingFrequencyDays: 14,
      staleAfterDays: 14,
      meetingNoteRequired: true,
      autoMatchSuggestions: true,
      defaultMentorCapacity: 4,
      communicationGapDays: 14,
      bottleneckFlagDays: 21,
      eligibleEmailDomain: null,
      rosterOnly: false,
      individualMentees: false,
    },
    health: {
      healthy: 48,
      followUp: 10,
      risky: 6,
      riskyTopics: [{ title: "Pazarlama stratejisi", teams: 5 }],
    },
    awaitingTeams: [{ organizationId: "org-9", name: "Terra", waitingDays: 4 }],
    upcomingEvents: [
      {
        id: "event-1",
        programId: "program-1",
        title: "Ara rapor teslimi",
        kind: ProgramEventKind.Deadline,
        startsAt: new Date(Date.now() + 3 * 86_400_000).toISOString(),
        endsAt: null,
        description: "28/42 takım teslim etti",
      },
    ],
    teams: { mentored: 36, awaitingMatch: 5 },
    mentors: { withCapacity: 22, full: 4, idle: 2, pending: 5 },
    coordinators: [
      { id: "coordinator-1", fullName: "Elif Demir", owner: true },
      { id: "coordinator-2", fullName: "Burcu Şen", owner: false },
    ],
    missingNoteMeetings: 4,
    pendingApprovalCount: 6,
    ...overrides,
  };
}
