import {
  TeamMoveBlock,
  type MemberTeamMoveOptions,
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
