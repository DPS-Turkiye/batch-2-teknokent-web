"use client";

import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useToast } from "@/components/providers/toast-provider";
import {
  meetingTodosQueryKey,
  useCreateMeetingTodo,
  useMeetingNote,
  useMeetingTodos,
  useUpdateMeetingTodo,
} from "@/hooks/use-meeting-notes";
import { STARTUP_DOCUMENTS_QUERY_KEY } from "@/hooks/use-startup-documents";
import { DocumentKind } from "@/interfaces/startup-document";
import { uploadDocument } from "@/lib/client/documents";
import { getMeetingTodos } from "@/lib/client/meeting-notes";

/** The notes view's open meeting: its note, its to-dos and its attachments. */
export function useStartupMeetingNotes(meetingId: string | null) {
  const t = useTranslations("notes");
  const id = meetingId ?? "";
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const noteQuery = useMeetingNote(id);
  const todosQuery = useMeetingTodos(id);
  const createTodo = useCreateMeetingTodo(id);
  const updateTodo = useUpdateMeetingTodo(id);
  const [todoDraft, setTodoDraft] = useState("");

  const upload = useMutation({
    mutationFn: ({ file, kind }: { file: File; kind: DocumentKind }) =>
      uploadDocument(file, kind, undefined, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: STARTUP_DOCUMENTS_QUERY_KEY,
      });
      showToast({ message: t("fileAdded"), tone: "success" });
    },
    onError: (error) =>
      showToast({
        message: error instanceof Error ? error.message : t("uploadFailed"),
        tone: "error",
      }),
  });

  function addTodo() {
    const title = todoDraft.trim();
    if (!title || createTodo.isPending) return;
    createTodo.mutate(title, { onSuccess: () => setTodoDraft("") });
  }

  return {
    addTodo,
    isAddingTodo: createTodo.isPending,
    isUploading: upload.isPending,
    noteContent: noteQuery.data?.content ?? "",
    noteLoading: noteQuery.isLoading,
    setTodoDraft,
    todoDraft,
    todos: todosQuery.data ?? [],
    toggleTodo: (todoId: string, done: boolean) =>
      updateTodo.mutate({ todoId, done }),
    uploadFile: (file: File) =>
      upload.mutate({ file, kind: DocumentKind.MeetingFile }),
    uploadPhoto: (file: File) =>
      upload.mutate({ file, kind: DocumentKind.NotePhoto }),
  };
}

/** How many to-dos are still open on each meeting, for the "Görevler" badges. */
export function useOpenTodoCounts(meetingIds: string[]) {
  return useQueries({
    queries: meetingIds.map((meetingId) => ({
      queryKey: meetingTodosQueryKey(meetingId),
      queryFn: () => getMeetingTodos(meetingId),
    })),
    combine: (results) => {
      const counts = new Map<string, number>();
      results.forEach((result, index) => {
        if (result.data) {
          counts.set(
            meetingIds[index],
            result.data.filter((todo) => !todo.done).length,
          );
        }
      });
      return counts;
    },
  });
}
