import type { StartupProfile } from "@/interfaces/organization";
import { UserAccountStatus } from "@/interfaces/session";

/** An approved startup with only its name filled in, unless the overrides add more. */
export function startupProfile(
  overrides: Partial<StartupProfile> = {},
): StartupProfile {
  return {
    id: "org-1",
    name: "Döngü",
    description: null,
    website: null,
    problem: null,
    solution: null,
    currentSolution: null,
    targetUser: null,
    sector: null,
    maturity: null,
    programLevel: null,
    supportAreas: [],
    statusVersion: null,
    statusSummary: null,
    completionPercent: null,
    fundingStage: null,
    foundedYear: null,
    approvalStatus: UserAccountStatus.Approved,
    createdAt: "2026-09-01T12:00:00Z",
    updatedAt: "2026-09-01T12:00:00Z",
    ...overrides,
  };
}
