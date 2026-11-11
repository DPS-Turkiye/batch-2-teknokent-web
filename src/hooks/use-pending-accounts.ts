"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ADMIN_OVERVIEW_QUERY_KEY } from "@/hooks/use-admin-overview";
import type { UserAccountStatus } from "@/interfaces/session";
import {
  decidePendingAccount,
  getPendingAccounts,
} from "@/lib/client/admin-users";

export const PENDING_ACCOUNTS_QUERY_KEY = ["pending-accounts"] as const;

export function usePendingAccounts() {
  return useQuery({
    queryKey: PENDING_ACCOUNTS_QUERY_KEY,
    queryFn: getPendingAccounts,
  });
}

export function useDecidePendingAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      status,
    }: {
      userId: string;
      status: UserAccountStatus.Approved | UserAccountStatus.Rejected;
    }) => decidePendingAccount(userId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PENDING_ACCOUNTS_QUERY_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: ADMIN_OVERVIEW_QUERY_KEY,
      });
    },
  });
}
