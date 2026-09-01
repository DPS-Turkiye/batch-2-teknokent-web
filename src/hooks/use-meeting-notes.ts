"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  MeetingAssistantShare,
  MeetingNote,
  MeetingTodo,
  PublishAssistantSharePayload,
} from "@/interfaces/meeting-note";
import {
  getAssistantShare,
  getMeetingNote,
  getMeetingTodos,
  patchMeetingTodo,
  postAssistantShare,
  postMeetingTodo,
  putMeetingNote,
  removeMeetingTodo,
} from "@/lib/client/meeting-notes";

export const meetingNoteQueryKey = (meetingId: string) =>
  ["meeting-note", meetingId] as const;

export const meetingTodosQueryKey = (meetingId: string) =>
  ["meeting-todos", meetingId] as const;

export function useMeetingNote(meetingId: string) {
  return useQuery({
    queryKey: meetingNoteQueryKey(meetingId),
    queryFn: () => getMeetingNote(meetingId),
    enabled: Boolean(meetingId),
  });
}

export function useSaveMeetingNote(meetingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { content: string }) =>
      putMeetingNote(meetingId, payload),
    onSuccess: (note: MeetingNote) =>
      queryClient.setQueryData(meetingNoteQueryKey(meetingId), note),
  });
}

export function useMeetingTodos(meetingId: string) {
  return useQuery({
    queryKey: meetingTodosQueryKey(meetingId),
    queryFn: () => getMeetingTodos(meetingId),
    enabled: Boolean(meetingId),
  });
}

function useTodoMutation<TVariables>(
  meetingId: string,
  mutationFn: (variables: TVariables) => Promise<MeetingTodo[]>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (todos: MeetingTodo[]) =>
      queryClient.setQueryData(meetingTodosQueryKey(meetingId), todos),
  });
}

export function useCreateMeetingTodo(meetingId: string) {
  return useTodoMutation(meetingId, (title: string) =>
    postMeetingTodo(meetingId, title),
  );
}

export function useUpdateMeetingTodo(meetingId: string) {
  return useTodoMutation(
    meetingId,
    (variables: { todoId: string; title?: string; done?: boolean }) =>
      patchMeetingTodo(meetingId, variables.todoId, {
        title: variables.title,
        done: variables.done,
      }),
  );
}

export function useDeleteMeetingTodo(meetingId: string) {
  return useTodoMutation(meetingId, (todoId: string) =>
    removeMeetingTodo(meetingId, todoId),
  );
}

export const assistantShareQueryKey = (meetingId: string) =>
  ["assistant-share", meetingId] as const;

export function useAssistantShare(meetingId: string) {
  return useQuery({
    queryKey: assistantShareQueryKey(meetingId),
    queryFn: () => getAssistantShare(meetingId),
    enabled: Boolean(meetingId),
  });
}

export function usePublishAssistantShare() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      meetingId,
      payload,
    }: {
      meetingId: string;
      payload: PublishAssistantSharePayload;
    }) => postAssistantShare(meetingId, payload),
    onSuccess: (share: MeetingAssistantShare) =>
      queryClient.setQueryData(assistantShareQueryKey(share.meetingId), share),
  });
}
