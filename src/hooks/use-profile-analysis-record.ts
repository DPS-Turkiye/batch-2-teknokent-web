"use client";

import { useQuery } from "@tanstack/react-query";

import { useAppSession } from "@/components/providers/session-provider";
import { ProfileAnalysisRecordScope } from "@/interfaces/profile-analysis";
import { ClientApiError } from "@/lib/client/api";
import { getProfileAnalysisRecord } from "@/lib/client/profile-analysis-records";

export const PROFILE_ANALYSIS_MUTATION_KEY = [
  "startup-profile-analysis",
] as const;

export const PROFILE_ANALYSIS_RECORD_KEY = [
  "embedded-profile-analysis",
] as const;
export function profileAnalysisRecordKey(
  scope: ProfileAnalysisRecordScope,
  userId?: string,
  organizationId?: string,
) {
  return [...PROFILE_ANALYSIS_RECORD_KEY, userId, organizationId, scope];
}

export function useProfileAnalysisRecord(
  scope: ProfileAnalysisRecordScope = ProfileAnalysisRecordScope.Startup,
  enabled = true,
) {
  const session = useAppSession();
  const key = profileAnalysisRecordKey(
    scope,
    session?.userId,
    session?.organizationId,
  );
  const query = useQuery({
    queryKey: key,
    enabled: enabled && Boolean(session?.userId && session.organizationId),
    queryFn: async () => {
      try {
        return await getProfileAnalysisRecord(scope);
      } catch (error) {
        if (error instanceof ClientApiError && error.status === 404)
          return null;
        throw error;
      }
    },
    retry: false,
  });
  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    key,
  };
}
