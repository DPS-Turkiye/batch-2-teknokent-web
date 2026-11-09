"use client";

import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/stores/toast-store";
import {
  getPendingMembers,
  removePendingMember,
} from "@/lib/client/organization-members";
import { ToastTone } from "@/interfaces/toast";

export const PENDING_MEMBERS_QUERY_KEY = [
  "organization-pending-members",
] as const;

/** Teammates listed at signup who have not joined with the invite code yet. */
export function usePendingMembers() {
  const t = useTranslations("sharedUi");
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
        message: t("pendingRemoved"),
        tone: ToastTone.Success,
      });
    },
    onError: (error) =>
      showToast({
        message:
          error instanceof Error ? error.message : t("pendingRemoveFailed"),
        tone: ToastTone.Error,
      }),
  });

  return {
    pending: query.data ?? [],
    remove: (pendingId: string) => remove.mutate(pendingId),
    removingId: remove.isPending ? remove.variables : null,
  };
}
