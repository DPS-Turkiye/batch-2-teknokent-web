"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getMentorshipMeetings,
  logMentorshipMeeting,
  type LogMeetingPayload,
} from "@/lib/client/mentor-requests";
import {
  updateMeeting,
  type UpdateMeetingPayload,
} from "@/lib/client/meetings";

export const mentorshipMeetingsQueryKey = (requestId: string) =>
  ["mentorship-meetings", requestId] as const;

export function useMentorshipMeetings(requestId: string | null) {
  return useQuery({
    queryKey: mentorshipMeetingsQueryKey(requestId ?? ""),
    queryFn: () => getMentorshipMeetings(requestId as string),
    enabled: Boolean(requestId),
  });
}

export function useLogMeeting(requestId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LogMeetingPayload) =>
      logMentorshipMeeting(requestId as string, payload),
    onSuccess: () => {
      if (!requestId) return;
      return queryClient.invalidateQueries({
        queryKey: mentorshipMeetingsQueryKey(requestId),
      });
    },
  });
}

export function useUpdateMeeting(requestId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (options: { id: string; payload: UpdateMeetingPayload }) =>
      updateMeeting(options.id, options.payload),
    onSuccess: () => {
      if (!requestId) return;
      return queryClient.invalidateQueries({
        queryKey: mentorshipMeetingsQueryKey(requestId),
      });
    },
  });
}
