"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import type { GateBadgeRow, GateBadgeState } from "@/interfaces/badges";
import {
  getProgramBadgeRoster,
  postGateBadgeAward,
  postGateBadgeRevoke,
} from "@/lib/client/badges";

const rosterQueryKey = (programId: string) =>
  ["coordinator-programs", programId, "badge-roster"] as const;

/**
 * Katılımcılar of a peer program: the roster with each person's gate badge, and "Rozet ver" / "Rozeti geri al".
 * A revoke asks for a reason first, so the hook keeps the row being taken back and the typed reason.
 */
export function useProgramBadges(
  programId: string,
  state: GateBadgeState | null,
) {
  const queryClient = useQueryClient();
  const roster = useQuery({
    queryKey: [...rosterQueryKey(programId), state ?? "ALL"],
    queryFn: () => getProgramBadgeRoster(programId, state),
  });
  const [revoking, setRevoking] = useState<GateBadgeRow | null>(null);
  const [reason, setReason] = useState("");
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: rosterQueryKey(programId) });

  const award = useMutation({
    mutationFn: (userId: string) => postGateBadgeAward(programId, userId),
    onSuccess: refresh,
  });
  const revoke = useMutation({
    mutationFn: ({ awardId, why }: { awardId: string; why: string }) =>
      postGateBadgeRevoke(programId, awardId, why),
    onSuccess: async () => {
      setRevoking(null);
      setReason("");
      await refresh();
    },
  });

  return {
    rows: roster.data ?? [],
    isLoading: roster.isLoading,
    loadError: roster.error,
    awardingUserId: award.isPending ? award.variables : null,
    award: (userId: string) => award.mutate(userId),
    revoking,
    reason,
    setReason,
    canConfirmRevoke: reason.trim().length > 0 && !revoke.isPending,
    startRevoke: (row: GateBadgeRow) => {
      revoke.reset();
      setReason("");
      setRevoking(row);
    },
    cancelRevoke: () => setRevoking(null),
    confirmRevoke: () => {
      if (!revoking?.awardId || !reason.trim()) return;
      revoke.mutate({ awardId: revoking.awardId, why: reason.trim() });
    },
    actionError: award.error ?? revoke.error ?? null,
  };
}
