"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { UpdateMentorAvailabilitySettingsPayload } from "@/interfaces/mentor";
import type { AvailabilitySettingsSource } from "@/hooks/use-mentor-profile";
import {
  getOfficeHoursAvailability,
  updateOfficeHoursAvailability,
} from "@/lib/client/office-hours";

export const OFFICE_HOURS_AVAILABILITY_QUERY_KEY = [
  "office-hours",
  "availability",
] as const;

/** The signed-in academic's own office hours, as a mentor's availability is theirs. */
export function useOfficeHoursAvailability() {
  return useQuery({
    queryKey: OFFICE_HOURS_AVAILABILITY_QUERY_KEY,
    queryFn: getOfficeHoursAvailability,
  });
}

export function useUpdateOfficeHoursAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateMentorAvailabilitySettingsPayload) =>
      updateOfficeHoursAvailability(payload),
    onSuccess: (saved) =>
      queryClient.setQueryData(OFFICE_HOURS_AVAILABILITY_QUERY_KEY, saved),
  });
}

/** Feeds the mentor availability editor with the academic's office hours and the office-hours copy. */
export const OFFICE_HOURS_AVAILABILITY_SOURCE: AvailabilitySettingsSource = {
  useSettings: useOfficeHoursAvailability,
  useUpdate: useUpdateOfficeHoursAvailability,
  copy: "officeHours.availability",
};
