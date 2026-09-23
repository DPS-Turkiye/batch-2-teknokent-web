"use client";

import { useQuery } from "@tanstack/react-query";

import { listDocuments } from "@/lib/client/documents";
import { getUserProfile } from "@/lib/client/user-profile";
import { currentIdToken } from "@/lib/firebase/auth";

export const SUBMITTED_PROFILE_QUERY_KEY = ["submitted-profile"] as const;

/** What the person sent for review, read back for /application-status. */
export function useSubmittedProfile() {
  const query = useQuery({
    queryKey: SUBMITTED_PROFILE_QUERY_KEY,
    retry: false,
    queryFn: async () => {
      const idToken = await currentIdToken();
      if (!idToken) return null;
      const [profile, documents] = await Promise.all([
        getUserProfile(idToken),
        listDocuments(idToken),
      ]);
      return { profile, documents };
    },
  });

  return {
    profile: query.data?.profile ?? null,
    documents: query.data?.documents ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
