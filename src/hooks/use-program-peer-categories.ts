"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useToast } from "@/components/providers/toast-provider";
import {
  PEER_TOPIC_CATEGORIES,
  type PeerTopicCategory,
} from "@/interfaces/peer-mentoring";
import {
  getProgramPeerCategories,
  replaceProgramPeerCategories,
} from "@/lib/client/program-peer-categories";
import { errorMessage } from "@/lib/utils";

export const programPeerCategoriesQueryKey = (programId: string) =>
  ["program-peer-categories", programId] as const;

/** Program Ayarları › Akran kategorileri: the active set, edited as a draft and saved as a whole. */
export function useProgramPeerCategories(programId: string) {
  const t = useTranslations("programPeerCategories");
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const saved = useQuery({
    queryKey: programPeerCategoriesQueryKey(programId),
    queryFn: () => getProgramPeerCategories(programId),
  });
  const [edits, setEdits] = useState<PeerTopicCategory[] | null>(null);
  const active = edits ?? saved.data?.active ?? [];
  const dirty =
    edits != null &&
    (edits.length !== (saved.data?.active.length ?? 0) ||
      edits.some((category) => !saved.data?.active.includes(category)));

  const save = useMutation({
    mutationFn: () => replaceProgramPeerCategories(programId, active),
    onSuccess: (data) => {
      queryClient.setQueryData(programPeerCategoriesQueryKey(programId), data);
      setEdits(null);
      showToast({ message: t("saved"), tone: "success" });
    },
    onError: (failure: Error) =>
      showToast({
        message: errorMessage(failure, t("saveFailed")),
        tone: "error",
      }),
  });

  return {
    isLoading: saved.isLoading,
    error: saved.error,
    active,
    dirty,
    saving: save.isPending,
    toggle: (category: PeerTopicCategory) =>
      setEdits(
        PEER_TOPIC_CATEGORIES.filter((item) =>
          item === category ? !active.includes(item) : active.includes(item),
        ),
      ),
    save: () => save.mutate(),
    reset: () => setEdits(null),
  };
}
