"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getMeetings, postMeeting } from "@/lib/client/meetings";

export const MEETINGS_QUERY_KEY = ["meetings"] as const;

export function useMeetings() {
  return useQuery({ queryKey: MEETINGS_QUERY_KEY, queryFn: getMeetings });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postMeeting,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEY }),
  });
}
