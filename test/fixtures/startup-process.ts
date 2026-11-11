import type { StartupProcess } from "@/interfaces/startup-process";

/** A team's process with no stages, rounds or assignments unless the overrides add them. */
export function startupProcess(
  overrides: Partial<StartupProcess> = {},
): StartupProcess {
  return {
    organizationId: "org-1",
    currentStage: null,
    stages: [],
    currentRound: null,
    rounds: [],
    assignments: [],
    ...overrides,
  };
}
