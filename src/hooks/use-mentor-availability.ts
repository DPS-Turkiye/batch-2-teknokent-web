"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createMentorAvailabilitySlot,
  deleteMentorAvailabilitySlot,
  getOwnMentorAvailability,
} from "@/lib/client/mentors";

const ownAvailabilityQueryKey = (mentorId: string | null) =>
  ["own-mentor-availability", mentorId] as const;

export function useOwnMentorAvailability(mentorId: string | null) {
  return useQuery({
    queryKey: ownAvailabilityQueryKey(mentorId),
    queryFn: () => getOwnMentorAvailability(mentorId as string),
    enabled: Boolean(mentorId),
  });
}

export function useCreateMentorAvailabilitySlot(mentorId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (options: { startsAt: string; durationMinutes?: number }) =>
      createMentorAvailabilitySlot({
        mentorId: mentorId as string,
        ...options,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ownAvailabilityQueryKey(mentorId),
      }),
  });
}

export function useDeleteMentorAvailabilitySlot(mentorId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slotId: string) =>
      deleteMentorAvailabilitySlot({ mentorId: mentorId as string, slotId }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ownAvailabilityQueryKey(mentorId),
      }),
  });
}
