"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import {
  decideMentorRequest,
  getAlternativeMentors,
  getMentorAvailability,
  getMentorRequest,
  getMentorRequests,
  replyToMentorRequest,
  scheduleMeeting,
  withdrawMentorRequest,
} from "@/lib/client/mentor-requests";

export const mentorshipRequestsQueryKey = (
  role: UserRole.Mentee | UserRole.Mentor,
) => ["mentorship-requests", role] as const;

export function useMentorshipRequests(
  role: UserRole.Mentee | UserRole.Mentor = UserRole.Mentee,
) {
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
        queryKey: mentorshipRequestsQueryKey(UserRole.Mentee),
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
        queryKey: mentorshipRequestsQueryKey(UserRole.Mentee),
      });
    },
  });
}

export function useScheduleMeeting(id: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slotId: string) =>
      scheduleMeeting({ id: id as string, slotId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentor-availability", id] });
      return queryClient.invalidateQueries({
        queryKey: mentorshipRequestsQueryKey(UserRole.Mentee),
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
        queryKey: mentorshipRequestsQueryKey(UserRole.Mentor),
      }),
  });
}
