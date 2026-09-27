"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { useToast } from "@/components/providers/toast-provider";
import { coordinatorProgramQueryKey } from "@/hooks/use-coordinator-program";
import { COORDINATOR_PROGRAMS_QUERY_KEY } from "@/hooks/use-coordinator-programs";
import type { MatchCandidate } from "@/interfaces/program-matching";
import {
  createMatch,
  getMatching,
  getMatchSuggestions,
} from "@/lib/client/coordinator-programs";
import { filterPool, MatchTab } from "@/lib/program-matching";
import { errorMessage } from "@/lib/utils";

export const matchingQueryKey = (programId: string) =>
  [...coordinatorProgramQueryKey(programId), "matching"] as const;

/**
 * Eşleşmeler: pick a waiting team, look at the pool mentors ranked for it (or search the pool by hand), and
 * confirm a match. The team from the Anasayfa link starts selected.
 */
export function useProgramMatching(programId: string, initialTeamId?: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [tab, setTab] = useState(MatchTab.Waiting);
  const [pickedTeamId, setPickedTeamId] = useState(initialTeamId ?? null);
  const [search, setSearch] = useState("");
  const [confirming, setConfirming] = useState<MatchCandidate | null>(null);
  const [matched, setMatched] = useState<{
    team: string;
    mentor: string;
  } | null>(null);

  const overview = useQuery({
    queryKey: matchingQueryKey(programId),
    queryFn: () => getMatching(programId),
  });
  const waiting = overview.data?.waiting ?? [];
  const team =
    waiting.find((item) => item.organizationId === pickedTeamId) ?? waiting[0];

  const suggestions = useQuery({
    queryKey: [...matchingQueryKey(programId), team?.organizationId],
    queryFn: () => getMatchSuggestions(programId, team!.organizationId),
    enabled: Boolean(team),
  });

  const match = useMutation({
    mutationFn: (candidate: MatchCandidate) =>
      createMatch(programId, {
        organizationId: team!.organizationId,
        mentorId: candidate.mentorId,
      }),
    onSuccess: (next, candidate) => {
      queryClient.setQueryData(matchingQueryKey(programId), next);
      void queryClient.invalidateQueries({
        queryKey: coordinatorProgramQueryKey(programId),
        exact: true,
      });
      void queryClient.invalidateQueries({
        queryKey: COORDINATOR_PROGRAMS_QUERY_KEY,
      });
      setMatched({ team: team!.name, mentor: candidate.fullName });
      setConfirming(null);
      setSearch("");
      setPickedTeamId(null);
      showToast({
        message: `${team!.name} ↔ ${candidate.fullName} eşleşti. İki tarafa bildirim gönderildi.`,
        tone: "success",
      });
    },
    onError: (failure) =>
      showToast({
        message: errorMessage(failure, "Eşleşme oluşturulamadı."),
        tone: "error",
      }),
  });

  return {
    overview,
    tab,
    setTab,
    waiting,
    team,
    pickTeam: (organizationId: string) => {
      setPickedTeamId(organizationId);
      setSearch("");
      setMatched(null);
    },
    suggestions,
    search,
    setSearch,
    searchResults: filterPool(suggestions.data?.pool ?? [], search),
    confirming,
    openConfirm: (candidate: MatchCandidate) => setConfirming(candidate),
    closeConfirm: () => setConfirming(null),
    confirm: () => confirming && match.mutate(confirming),
    matching: match.isPending,
    matched,
  };
}
