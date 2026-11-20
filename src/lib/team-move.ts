import type { PersonSummary } from "@/interfaces/person-summary";
import { UserAccountStatus, UserRole } from "@/interfaces/session";
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
