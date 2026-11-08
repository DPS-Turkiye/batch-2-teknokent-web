"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { useWeeklyAvailabilityForm } from "@/hooks/use-weekly-availability-form";
import type { UpdateMentorAvailabilitySettingsPayload } from "@/interfaces/mentor";
import {
  getOfficeHoursAvailability,
  updateOfficeHoursAvailability,
} from "@/lib/client/office-hours";

export const OFFICE_HOURS_AVAILABILITY_QUERY_KEY = [
  "office-hours",
  "availability",
] as const;

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

export function useOfficeHoursAvailabilityForm(onSaved: () => void) {
  const t = useTranslations("officeHours.availability");
  const settingsQuery = useOfficeHoursAvailability();
  const updateSettings = useUpdateOfficeHoursAvailability();
  return useWeeklyAvailabilityForm(
    {
      settings: settingsQuery.data,
      loadFailed: Boolean(settingsQuery.error),
      save: updateSettings.mutateAsync,
      isSaving: updateSettings.isPending,
      numberFieldLabels: { menteeCapacity: t("studentCapacity") },
    },
    onSaved,
  );
}
