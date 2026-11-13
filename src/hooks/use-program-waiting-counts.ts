"use client";

import { useQuery } from "@tanstack/react-query";

import { mentorPoolQueryKey } from "@/hooks/use-mentor-pool";
import { programTeamsQueryKey } from "@/hooks/use-program-teams";
import {
  getMentorPool,
  getProgramTeams,
} from "@/lib/client/coordinator-programs";
import type { ProgramWaitingCounts } from "@/lib/coordinator-program-detail";
import { waitingPoolCount } from "@/lib/mentor-pool";
import { waitingTeamCount } from "@/lib/program-launch";

/**
 * "N · +M bekleyen": the Takımlar and Mentor Havuzu lists also show invited teams and mentors the program's counts
 * leave out. Reads the same queries as those tabs, so opening one of them costs no extra request.
 */
export function useProgramWaitingCounts(
  programId: string,
  /** The program's own team count, or null when it has no teams and no mentor pool (nothing is loaded). */
  countedTeams: number | null,
): ProgramWaitingCounts {
  const enabled = countedTeams != null;
  const pool = useQuery({
    queryKey: mentorPoolQueryKey(programId),
    queryFn: () => getMentorPool(programId),
    enabled,
  });
  const teams = useQuery({
    queryKey: programTeamsQueryKey(programId),
    queryFn: () => getProgramTeams(programId),
    enabled,
  });
  return {
    teams:
      teams.data && countedTeams != null
        ? waitingTeamCount(teams.data, countedTeams)
        : null,
    mentors: pool.data ? waitingPoolCount(pool.data) : null,
  };
}
