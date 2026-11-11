"use client";

import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { useAiFeatureRefusal, useAiFeatures } from "@/hooks/use-ai-features";
import {
  PROFILE_ANALYSIS_MUTATION_KEY,
  useProfileAnalysisRecord,
} from "@/hooks/use-profile-analysis-record";
import {
  ProfileAnalysisType,
  ProfileOcrMode,
  type ProfileAnalysis,
} from "@/interfaces/profile-analysis";
import { uploadProfileAnalysis } from "@/lib/client/profile-analysis";
import { PROFILE_ANALYSIS_MAX_BYTES } from "@/lib/profile-analysis";

export function useStartupProfileImport() {
  const t = useTranslations("profileAnalysis");
  const labels = useTranslations("profileTools");
  const client = useQueryClient();
  const record = useProfileAnalysisRecord();
  // Where the deck cannot be read the manual editor is the only way in, so it stays open.
  const canRead = useAiFeatures().profileParsing;
  const refused = useAiFeatureRefusal();
  const [inputVersion, setInputVersion] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [ocrMode, setOcrMode] = useState<ProfileOcrMode>(ProfileOcrMode.Auto);
  const [showManual, setShowManual] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  const mutationsPending =
    useIsMutating({ mutationKey: PROFILE_ANALYSIS_MUTATION_KEY }) > 0;
  const upload = useMutation({
    mutationKey: PROFILE_ANALYSIS_MUTATION_KEY,
    mutationFn: (input: Parameters<typeof uploadProfileAnalysis>[0]) =>
      uploadProfileAnalysis(input),
  });

  function chooseFile(next: File | null) {
    if (busy.current) return;
    setError("");
    if (
      next &&
      (!next.name.toLowerCase().endsWith(".pdf") ||
        next.size > PROFILE_ANALYSIS_MAX_BYTES ||
        next.size === 0)
    ) {
      setFile(null);
      setInputVersion((value) => value + 1);
      setError(labels("invalidFile"));
      return;
    }
    setFile(next);
    setConsent(false);
  }

  function saved(analysis: ProfileAnalysis) {
    client.setQueryData(record.key, analysis);
    void client.invalidateQueries({ queryKey: ["profile-analysis"] });
    setShowManual(false);
    setError("");
  }

  async function extract() {
    if (
      !file ||
      !consent ||
      busy.current ||
      client.isMutating({ mutationKey: PROFILE_ANALYSIS_MUTATION_KEY }) > 0
    )
      return;
    busy.current = true;
    setError("");
    try {
      saved(
        await upload.mutateAsync({
          file,
          profileType: ProfileAnalysisType.Startup,
          ocrMode,
        }),
      );
      setFile(null);
      setInputVersion((value) => value + 1);
      setConsent(false);
    } catch (failure) {
      if (refused(failure)) {
        setShowManual(true);
        setError(labels("readOff"));
      } else {
        setError(t("processFailed"));
      }
    } finally {
      busy.current = false;
    }
  }

  return {
    analysis:
      record.data?.profileType === ProfileAnalysisType.Startup
        ? record.data
        : null,
    isLoading: record.isLoading,
    isLoadError: record.isError,
    retry: () => record.refetch(),
    file,
    inputVersion,
    chooseFile,
    consent,
    setConsent,
    ocrMode,
    setOcrMode,
    canRead,
    showManual: showManual || !canRead,
    setShowManual,
    isPending: upload.isPending || mutationsPending,
    error,
    extract,
    saved,
  };
}
