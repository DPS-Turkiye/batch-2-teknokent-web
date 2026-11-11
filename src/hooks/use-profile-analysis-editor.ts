"use client";

import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { PROFILE_ANALYSIS_MUTATION_KEY } from "@/hooks/use-profile-analysis-record";
import {
  ProfileAnalysisType,
  type ProfileAnalysis,
} from "@/interfaces/profile-analysis";
import {
  confirmStartupProfileRecord,
  createStartupProfileRecord,
} from "@/lib/client/profile-analysis-records";
import {
  editableProfile,
  profilePayload,
  toProfileObject,
} from "@/lib/profile-analysis";

export function useProfileAnalysisEditor({
  analysis,
  onSaved,
}: {
  analysis?: ProfileAnalysis | undefined;
  onSaved: (analysis: ProfileAnalysis) => void;
}) {
  const t = useTranslations("profileAnalysis");
  const labels = useTranslations("profileTools");
  const client = useQueryClient();
  const profileType = ProfileAnalysisType.Startup;
  const original = toProfileObject(analysis?.profile);
  const [draft, setDraft] = useState(() =>
    editableProfile(original, profileType),
  );
  const [error, setError] = useState("");
  const busy = useRef(false);
  const mutationsPending =
    useIsMutating({ mutationKey: PROFILE_ANALYSIS_MUTATION_KEY }) > 0;
  const mutation = useMutation({
    mutationKey: PROFILE_ANALYSIS_MUTATION_KEY,
    mutationFn: async () => {
      const profile = profilePayload(original, draft, profileType);
      return analysis
        ? confirmStartupProfileRecord(analysis.id, profile)
        : createStartupProfileRecord(profile);
    },
  });

  async function save() {
    if (
      busy.current ||
      client.isMutating({ mutationKey: PROFILE_ANALYSIS_MUTATION_KEY }) > 0
    )
      return;
    if (!draft.startup_name?.trim() && !draft.startup_summary?.trim()) {
      setError(labels("minimum"));
      return;
    }
    busy.current = true;
    setError("");
    try {
      const result = await mutation.mutateAsync();
      void client.invalidateQueries({ queryKey: ["profile-analysis"] });
      onSaved(result);
    } catch {
      setError(t("saveFailed"));
    } finally {
      busy.current = false;
    }
  }

  return {
    draft,
    setDraft,
    error,
    save,
    isPending: mutation.isPending || mutationsPending,
    clear: () => {
      if (!busy.current) {
        setDraft(editableProfile({}, profileType));
        setError("");
      }
    },
  };
}
