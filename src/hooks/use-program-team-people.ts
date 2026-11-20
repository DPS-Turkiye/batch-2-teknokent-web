"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { programTeamPeopleQueryKey } from "@/hooks/use-program-teams";
import { getProgramTeamPeople } from "@/lib/client/coordinator-programs";
import { foldSearchText, matchesPersonName } from "@/lib/utils";

/** The backend's `ProgramTeamPeopleService.MIN_QUERY_LENGTH`: shorter searches are not sent. */
export const TEAM_PEOPLE_MIN_QUERY = 2;
export const TEAM_PEOPLE_SEARCH_DELAY_MS = 300;

export const TEAM_PEOPLE_MAX_QUERY = 100;

export function isPersonSearch(search: string) {
  return foldSearchText(search).length >= TEAM_PEOPLE_MIN_QUERY;
}

/**
 * Takımlar's "Kişi ara": founders and members of the program's teams by name, from the backend once typing pauses.
 * The last answer stays on screen, narrowed to the current text the same way the backend matches, until the new one
 * arrives.
 */
export function useProgramTeamPeople(programId: string) {
  const [search, setSearch] = useState("");
  const folded = foldSearchText(search);
  const sent = useDebouncedValue(folded, TEAM_PEOPLE_SEARCH_DELAY_MS);
  const active = isPersonSearch(search);
  const settled = sent === folded;
  const query = useQuery({
    queryKey: [...programTeamPeopleQueryKey(programId), sent],
    queryFn: () => getProgramTeamPeople(programId, sent),
    enabled: active && settled,
    placeholderData: keepPreviousData,
  });
  const current = settled && !query.isPlaceholderData;
  const people = active
    ? (query.data?.people ?? []).filter((person) =>
        matchesPersonName(person.fullName, search),
      )
    : [];
  const searching = active && (!settled || query.isFetching);
  return {
    search,
    setSearch,
    active,
    people,
    truncated: active && current && Boolean(query.data?.truncated),
    searching,
    noMatch: active && !searching && people.length === 0,
    error: active ? query.error : null,
  };
}
