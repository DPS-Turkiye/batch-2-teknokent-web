"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import { uploadDocument } from "@/lib/client/documents";
import { MEETINGS_QUERY_KEY } from "@/hooks/use-meetings";
import {
  acceptProposedMentorSlot,
  decideMentorRequest,
  getAlternativeMentors,
  getMentorAvailability,
  getMentorRequest,
  getMentorRequests,
  postMentorMessage,
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

export function usePostMentorMessage(id: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: string) =>
      postMentorMessage({ id: id as string, message }),
    onSuccess: (request) => {
      queryClient.setQueryData(["mentorship-request", id], request);
      return queryClient.invalidateQueries({
        queryKey: mentorshipRequestsQueryKey(UserRole.Mentor),
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

export function useReplyForm(id: string | null) {
  const replyMutation = useReplyToMentorRequest(id);
  const [reply, setReply] = useState("");

  const sendReply = async () => {
    if (!reply.trim()) return;
    await replyMutation.mutateAsync(reply.trim());
    setReply("");
  };

  return {
    reply,
    setReply,
    sendReply,
    isSending: replyMutation.isPending,
    error: replyMutation.error,
  };
}

export function useMentorMessageForm(id: string | null) {
  const postMessageMutation = usePostMentorMessage(id);
  const [message, setMessage] = useState("");

  const sendMessage = async () => {
    if (!message.trim()) return;
    await postMessageMutation.mutateAsync(message.trim());
    setMessage("");
  };

  return {
    message,
    setMessage,
    sendMessage,
    isSending: postMessageMutation.isPending,
    error: postMessageMutation.error,
  };
}

export function useRequestFileUpload(id: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const stored = await uploadDocument(file, "pitch-deck");
      const request = await replyToMentorRequest({
        id: id as string,
        message: `Dosya paylaşıldı: ${stored.originalFilename}`,
      });
      return { request, stored };
    },
    onSuccess: ({ request }) => {
      queryClient.setQueryData(["mentorship-request", id], request);
      return queryClient.invalidateQueries({
        queryKey: mentorshipRequestsQueryKey(UserRole.Mentee),
      });
    },
  });
}

export function useSlotBooking(id: string | null) {
  const scheduleMutation = useScheduleMeeting(id);
  const [scheduledSlotId, setScheduledSlotId] = useState<string | null>(null);
  const [scheduledForId, setScheduledForId] = useState<string | null>(null);

  if (scheduledForId !== id) {
    setScheduledForId(id);
    setScheduledSlotId(null);
  }

  const bookSlot = async (slotId: string) => {
    const meeting = await scheduleMutation.mutateAsync(slotId);
    if (meeting) setScheduledSlotId(slotId);
  };

  return {
    scheduledSlotId,
    bookSlot,
    isBooking: scheduleMutation.isPending,
    error: scheduleMutation.error,
  };
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

export function useAcceptProposedSlot(id: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (selectedSlot: string) =>
      acceptProposedMentorSlot({ id: id as string, selectedSlot }),
    onSuccess: (request) => {
      queryClient.setQueryData(["mentorship-request", id], request);
      return Promise.all([
        queryClient.invalidateQueries({
          queryKey: mentorshipRequestsQueryKey(UserRole.Mentee),
        }),
        queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEY }),
      ]);
    },
  });
}
