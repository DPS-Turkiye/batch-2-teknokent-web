"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getMeetings,
  postMeeting,
  updateMeeting,
  type UpdateMeetingPayload,
} from "@/lib/client/meetings";

export const MEETINGS_QUERY_KEY = ["meetings"] as const;

export function useMeetings() {
  return useQuery({
    queryKey: MEETINGS_QUERY_KEY,
    queryFn: () => getMeetings(),
  });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postMeeting,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEY }),
  });
}

export function useUpdateMeeting(id: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateMeetingPayload) => updateMeeting(id!, payload),
    onSuccess: (meeting) => {
      queryClient.setQueryData(
        MEETINGS_QUERY_KEY,
        (current: Awaited<ReturnType<typeof getMeetings>> | undefined) =>
          current?.map((item) => (item.id === meeting.id ? meeting : item)),
      );
    },
  });
}
