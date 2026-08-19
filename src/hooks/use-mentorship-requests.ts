"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import {
  decideMentorRequest,
  getAlternativeMentors,
  getMentorAvailability,
  getMentorRequest,
  getMentorRequests,
  replyToMentorRequest,
  withdrawMentorRequest,
} from "@/lib/client/mentor-requests";

export const mentorshipRequestsQueryKey = (role: "mentee" | "mentor") =>
  ["mentorship-requests", role] as const;

export function useMentorshipRequests(role: "mentee" | "mentor" = "mentee") {
  return useQuery({
    queryKey: mentorshipRequestsQueryKey(role),
    queryFn: () => getMentorRequests(role),
  });
}

export function useMentorshipRequest(id: string | null) {
  return useQuery({
    queryKey: ["mentorship-request", id],
    queryFn: () => getMentorRequest(id as string),
    enabled: Boolean(id),
  });
}

export function useMentorAvailability(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["mentor-availability", id],
    queryFn: () => getMentorAvailability(id as string),
    enabled: Boolean(id) && enabled,
  });
}

export function useAlternativeMentors(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["alternative-mentors", id],
    queryFn: () => getAlternativeMentors(id as string),
    enabled: Boolean(id) && enabled,
  });
}

export function useReplyToMentorRequest(id: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: string) =>
      replyToMentorRequest({ id: id as string, message }),
    onSuccess: (request) => {
      queryClient.setQueryData(["mentorship-request", id], request);
      return queryClient.invalidateQueries({
        queryKey: mentorshipRequestsQueryKey("mentee"),
      });
    },
  });
}

export function useWithdrawMentorRequest(id: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => withdrawMentorRequest(id as string),
    onSuccess: (request) => {
      queryClient.setQueryData(["mentorship-request", id], request);
      return queryClient.invalidateQueries({
        queryKey: mentorshipRequestsQueryKey("mentee"),
      });
    },
  });
}

export function useMentorRequestDecision() {
  const queryClient = useQueryClient();
  return useMutation<
    MentorshipRequest,
    Error,
    Parameters<typeof decideMentorRequest>[0]
  >({
    mutationFn: decideMentorRequest,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: mentorshipRequestsQueryKey("mentor"),
      }),
  });
}
