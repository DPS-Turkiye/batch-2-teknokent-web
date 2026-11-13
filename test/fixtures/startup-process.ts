import {
  StartupStageState,
  type ProcessPhase,
  type StartupProcess,
} from "@/interfaces/startup-process";

/** A team's process with no phases, rounds or assignments unless the overrides add them. */
export function startupProcess(
  overrides: Partial<StartupProcess> = {},
): StartupProcess {
  return {
    organizationId: "org-1",
    currentRound: null,
    rounds: [],
    assignments: [],
    currentPhaseId: null,
    phases: [],
    ...overrides,
  };
}

/** A phase of the team's program; upcoming and undated unless the overrides say otherwise. */
export function processPhase(
  id: string,
  name: string,
  overrides: Partial<ProcessPhase> = {},
): ProcessPhase {
  return {
    id,
    name,
    position: 0,
    startDate: null,
    endDate: null,
    expectedOutput: null,
    state: StartupStageState.Upcoming,
    ...overrides,
  };
}
