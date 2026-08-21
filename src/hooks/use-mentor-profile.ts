"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createAvailabilitySlot,
  deleteAvailabilitySlot,
  getMentorAvailability,
  getMentorProfile,
  updateMentorProfile,
} from "@/lib/client/mentor-profile";

export const MENTOR_PROFILE_QUERY_KEY = ["mentor-profile"] as const;
export const MENTOR_AVAILABILITY_QUERY_KEY = [
  "mentor-profile",
  "availability",
] as const;

export function useMentorProfile() {
  return useQuery({
    queryKey: MENTOR_PROFILE_QUERY_KEY,
    queryFn: getMentorProfile,
  });
}

export function useUpdateMentorProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMentorProfile,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: MENTOR_PROFILE_QUERY_KEY }),
  });
}

export function useMentorAvailabilitySlots() {
  return useQuery({
    queryKey: MENTOR_AVAILABILITY_QUERY_KEY,
    queryFn: getMentorAvailability,
  });
}

export function useCreateAvailabilitySlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAvailabilitySlot,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: MENTOR_AVAILABILITY_QUERY_KEY,
      }),
  });
}

export function useDeleteAvailabilitySlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAvailabilitySlot,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: MENTOR_AVAILABILITY_QUERY_KEY,
      }),
  });
}
