"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ProfileAnalysis } from "@/interfaces/profile-analysis";
import {
  confirmProfile,
  createManualProfile,
  getLatestProfileAnalysis,
  uploadProfileAnalysis,
} from "@/lib/client/profile-analysis";

export function profileAnalysisQueryKey(appUserId?: string) {
  return ["profile-analysis", "latest", appUserId ?? "self"] as const;
}

function useProfileMutation<TInput extends { appUserId?: string }>(
  mutationFn: (input: TInput) => Promise<ProfileAnalysis>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (analysis, variables) => {
      queryClient.setQueryData(
        profileAnalysisQueryKey(variables.appUserId),
        analysis,
      );
    },
  });
}

export function useProfileAnalysis(appUserId?: string) {
  return useQuery({
    queryKey: profileAnalysisQueryKey(appUserId),
    queryFn: () => getLatestProfileAnalysis(appUserId),
  });
}

export function useUploadProfileAnalysis() {
  return useProfileMutation(uploadProfileAnalysis);
}

export function useCreateManualProfile() {
  return useProfileMutation(createManualProfile);
}

export function useConfirmProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: confirmProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile-analysis"] });
    },
  });
}
