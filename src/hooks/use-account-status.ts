"use client";

import { useQuery } from "@tanstack/react-query";

import type { BackendUser } from "@/interfaces/session";
import { fetchAccountStatus } from "@/lib/client/auth";
import { currentIdToken } from "@/lib/firebase/auth";

export const ACCOUNT_STATUS_QUERY_KEY = ["account-status"] as const;

export function useAccountStatus() {
  const query = useQuery<BackendUser | null>({
    queryKey: ACCOUNT_STATUS_QUERY_KEY,
    queryFn: async () => {
      const idToken = await currentIdToken();
      if (!idToken) return null;
      return fetchAccountStatus(idToken);
    },
    staleTime: 0,
    retry: false,
  });

  return {
    account: query.data ?? null,
    isLoading: query.isLoading,
    // A resolved query with no account means Firebase has no signed-in user,
    // so the visitor has to sign in again before a status can be read.
    isSignedOut: !query.isLoading && !query.isError && query.data === null,
    error: query.error,
  };
}
