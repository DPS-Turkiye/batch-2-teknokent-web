import {
  TeamMoveBlock,
  type MemberTeamMoveOptions,
  type MemberTeamMoveResult,
  type TeamMoveTeam,
} from "@/interfaces/team-move";

export function teamMoveTeam(
  overrides: Partial<TeamMoveTeam> = {},
): TeamMoveTeam {
  return {
    organizationId: "org-new",
    name: "Pazar Lab",
    programId: "program-2",
    programName: "Hızlandırma 2026",
    ...overrides,
  };
}

export function teamMoveOptions(
  overrides: Partial<MemberTeamMoveOptions> = {},
): MemberTeamMoveOptions {
  return {
    userId: "user-1",
    fullName: "Mert Kaya",
    currentTeam: teamMoveTeam({
      organizationId: "org-old",
      name: "Döngü",
      programId: "program-1",
      programName: "Kuluçka 2026",
    }),
    blockedBy: null,
    archivesCurrentTeam: false,
    targets: [
      teamMoveTeam({
        organizationId: "org-tree",
        name: "Ağaç",
        programId: "program-1",
        programName: "Kuluçka 2026",
      }),
      teamMoveTeam(),
    ],
    ...overrides,
  };
}

export const founderBlocked = (): MemberTeamMoveOptions =>
  teamMoveOptions({ blockedBy: TeamMoveBlock.Founder, targets: [] });

/** Mert Kaya moved from Döngü (Kuluçka 2026) to Pazar Lab (Hızlandırma 2026). */
export function teamMoveResult(
  overrides: Partial<MemberTeamMoveResult> = {},
): MemberTeamMoveResult {
  return {
    userId: "user-1",
    from: teamMoveTeam({
      organizationId: "org-old",
      name: "Döngü",
      programId: "program-1",
      programName: "Kuluçka 2026",
    }),
    to: teamMoveTeam(),
    programId: "program-2",
    archivedFrom: false,
    withdrawnRequests: 0,
    movedAt: "2026-11-20T09:00:00Z",
    ...overrides,
  };
}

/** Merve Geçer founded Döngü and is alone in it, so moving her archives it. */
export const soloFounder = (): MemberTeamMoveOptions =>
  teamMoveOptions({ fullName: "Merve Geçer", archivesCurrentTeam: true });
