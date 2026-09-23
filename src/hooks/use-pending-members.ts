"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/components/providers/toast-provider";
import {
  getPendingMembers,
  removePendingMember,
} from "@/lib/client/organization-members";

export const PENDING_MEMBERS_QUERY_KEY = [
  "organization-pending-members",
] as const;

/** Teammates listed at signup who have not joined with the invite code yet. */
export function usePendingMembers() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const query = useQuery({
    queryKey: PENDING_MEMBERS_QUERY_KEY,
    queryFn: getPendingMembers,
  });

  const remove = useMutation({
    mutationFn: removePendingMember,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PENDING_MEMBERS_QUERY_KEY,
      });
      showToast({
        message: "Bekleyen üye listeden çıkarıldı.",
        tone: "success",
      });
    },
    onError: (error) =>
      showToast({
        message:
          error instanceof Error ? error.message : "Bekleyen üye çıkarılamadı.",
        tone: "error",
      }),
  });

  return {
    pending: query.data ?? [],
    remove: (pendingId: string) => remove.mutate(pendingId),
    removingId: remove.isPending ? remove.variables : null,
  };
}
