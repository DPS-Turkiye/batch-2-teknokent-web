import type { PersonSummary } from "@/interfaces/person-summary";
import { UserAccountStatus, UserRole } from "@/interfaces/session";
import { TeamExitReason } from "@/interfaces/team-change";
import { TeamMoveBlock, type TeamMoveTeam } from "@/interfaces/team-move";

/** The teams whose name or program contains the search text; every team for an empty search. */
export function filterTeamMoveTargets(
  targets: readonly TeamMoveTeam[],
  search: string,
): TeamMoveTeam[] {
  const needle = search.trim().toLocaleLowerCase("tr");
  if (!needle) return [...targets];
  return targets.filter((team) =>
    [team.name, team.programName ?? ""].some((text) =>
      text.toLocaleLowerCase("tr").includes(needle),
    ),
  );
}

/** A team as the move dialog names it: "Döngü · Kuluçka 2026", or the name alone outside any program. */
export function teamMoveLabel(team: TeamMoveTeam) {
  return team.programName ? `${team.name} · ${team.programName}` : team.name;
}

/** The `teamHistory` message for how a stay ended; an old row without a reason reads as a leave. */
export function teamExitKey(reason: TeamExitReason | null) {
  return reason ? TEAM_EXIT_KEYS[reason] : TEAM_EXIT_KEYS[TeamExitReason.Left];
}

const TEAM_EXIT_KEYS = {
  [TeamExitReason.Left]: "left",
  [TeamExitReason.Removed]: "removed",
  [TeamExitReason.Moved]: "moved",
} as const satisfies Record<TeamExitReason, string>;

/** The `teamMove.blocked` message that explains why the person cannot be moved. */
export const TEAM_MOVE_BLOCK_KEYS = {
  [TeamMoveBlock.NotApproved]: "notApproved",
  [TeamMoveBlock.NotATeamMember]: "notATeamMember",
  [TeamMoveBlock.NoTeam]: "noTeam",
  [TeamMoveBlock.Founder]: "founder",
} as const satisfies Record<TeamMoveBlock, string>;

/** Whether the profile shows "Takıma taşı": an approved startup member; the dialog explains any other refusal. */
export function canOfferTeamMove(
  person: Pick<PersonSummary, "role" | "status" | "startup">,
) {
  return (
    person.role === UserRole.Mentee &&
    person.status === UserAccountStatus.Approved &&
    person.startup !== null
  );
}
