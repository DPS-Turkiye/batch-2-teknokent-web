"use client";

import { useQuery } from "@tanstack/react-query";

import { AI_FEATURES_ALL_ON } from "@/lib/ai-features";
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
