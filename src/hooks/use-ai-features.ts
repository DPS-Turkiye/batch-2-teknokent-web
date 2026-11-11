"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import {
  AI_FEATURES_ALL_ON,
  isAiFeatureDisabledError,
} from "@/lib/ai-features";
import { getAiFeatures } from "@/lib/client/ai-features";

export const aiFeaturesQueryKey = ["ai-features"] as const;

/**
 * The deployment's AI switches. They only change with a redeploy, so they are read once per page load; until
 * then, or if the read fails, every feature counts as on (see AI_FEATURES_ALL_ON).
 */
export function useAiFeatures() {
  const query = useQuery({
    queryKey: aiFeaturesQueryKey,
    queryFn: getAiFeatures,
    staleTime: Infinity,
    retry: false,
  });
  return query.data ?? AI_FEATURES_ALL_ON;
}

/**
 * For a call made before the switches arrived (or after they failed to load): when the backend refused it as
 * switched off, the switches are read again so the screen turns to its manual path. True for such a refusal.
 */
export function useAiFeatureRefusal() {
  const queryClient = useQueryClient();
  return useCallback(
    (error: unknown) => {
      if (!isAiFeatureDisabledError(error)) return false;
      void queryClient.invalidateQueries({ queryKey: aiFeaturesQueryKey });
      return true;
    },
    [queryClient],
  );
}
