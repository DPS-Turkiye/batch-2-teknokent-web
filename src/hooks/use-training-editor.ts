"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import type {
  TrainingModuleForEditor,
  TrainingQuestionDraft,
} from "@/interfaces/training";
import { getTrainingForEditor, putTraining } from "@/lib/client/training";
import { youtubeWatchUrl } from "@/lib/youtube";

const editorQueryKey = (programId: string) =>
  ["coordinator-programs", programId, "training"] as const;

type Draft = { videoUrl: string; questions: TrainingQuestionDraft[] };

function draftOf(module: TrainingModuleForEditor): Draft {
  return {
    videoUrl: youtubeWatchUrl(module.videoId),
    questions: module.questions.map((question) => ({
      ...question,
      options: [...question.options] as TrainingQuestionDraft["options"],
    })),
  };
}

/** Program Ayarları › Akran Mentoru eğitimi: the form state, and "Kaydet ve yayınla". */
export function useTrainingEditor(programId: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: editorQueryKey(programId),
    queryFn: () => getTrainingForEditor(programId),
  });
  const [edited, setEdited] = useState<Draft | null>(null);
  const draft = edited ?? (query.data ? draftOf(query.data) : null);

  const save = useMutation({
    mutationFn: (value: Draft) => putTraining(programId, value),
    onSuccess: (saved) => {
      queryClient.setQueryData(editorQueryKey(programId), saved);
      setEdited(null);
    },
  });

  const change = (next: (current: Draft) => Draft) => {
    if (draft) setEdited(next(draft));
  };

  return {
    module: query.data ?? null,
    isLoading: query.isLoading,
    loadError: query.error,
    draft,
    dirty: edited !== null,
    setVideoUrl: (videoUrl: string) =>
      change((current) => ({ ...current, videoUrl })),
    setQuestionText: (index: number, text: string) =>
      change((current) => ({
        ...current,
        questions: current.questions.map((question, position) =>
          position === index ? { ...question, text } : question,
        ),
      })),
    setOption: (index: number, option: number, text: string) =>
      change((current) => ({
        ...current,
        questions: current.questions.map((question, position) =>
          position === index
            ? {
                ...question,
                options: question.options.map((value, slot) =>
                  slot === option ? text : value,
                ) as TrainingQuestionDraft["options"],
              }
            : question,
        ),
      })),
    setCorrectOption: (index: number, correctOption: number) =>
      change((current) => ({
        ...current,
        questions: current.questions.map((question, position) =>
          position === index ? { ...question, correctOption } : question,
        ),
      })),
    save: () => {
      if (draft) save.mutate(draft);
    },
    isSaving: save.isPending,
    saveError: save.error,
    saved: save.isSuccess && edited === null,
  };
}
