"use client";

import { useQuery } from "@tanstack/react-query";

import { coordinatorProgramQueryKey } from "@/hooks/use-coordinator-program";
import { isPersonSearch } from "@/hooks/use-program-team-people";
import { getProgramWithoutTeam } from "@/lib/client/coordinator-programs";
import { matchesPersonName } from "@/lib/utils";

/** People of the program without a team; with Takımlar's person search, only those whose name matches it. */
export function useProgramWithoutTeam(programId: string, search = "") {
  const query = useQuery({
    queryKey: [...coordinatorProgramQueryKey(programId), "without-team"],
    queryFn: () => getProgramWithoutTeam(programId),
  });
  const filtered = isPersonSearch(search);
  const all = query.data ?? [];
  const people = filtered
    ? all.filter((person) => matchesPersonName(person.fullName, search))
    : all;
  return {
    query,
    people,
    noMatch: filtered && all.length > 0 && people.length === 0,
  };
}
