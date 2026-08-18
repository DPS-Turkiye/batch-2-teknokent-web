"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ProfileAnalysis } from "@/interfaces/profile-analysis";
import {
  confirmProfile,
  createManualProfile,
  getLatestProfileAnalysis,
  uploadProfileAnalysis,
} from "@/lib/client/profile-analysis";

export const PROFILE_ANALYSIS_QUERY_KEY = [
  "profile-analysis",
  "latest",
] as const;

function useProfileMutation<TInput>(
  mutationFn: (input: TInput) => Promise<ProfileAnalysis>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (analysis) => {
      queryClient.setQueryData(PROFILE_ANALYSIS_QUERY_KEY, analysis);
    },
  });
}

export function useProfileAnalysis() {
  return useQuery({
    queryKey: PROFILE_ANALYSIS_QUERY_KEY,
    queryFn: getLatestProfileAnalysis,
  });
}

export function useUploadProfileAnalysis() {
  return useProfileMutation(uploadProfileAnalysis);
}

export function useCreateManualProfile() {
  return useProfileMutation(createManualProfile);
}

export function useConfirmProfile() {
  return useProfileMutation(confirmProfile);
}
