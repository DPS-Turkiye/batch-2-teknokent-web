"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSession } from "@/components/providers/session-provider";
import type {
  NotificationPreferenceKey,
  NotificationPreferences,
} from "@/interfaces/notification";
import {
  getNotificationPreferences,
  saveNotificationPreferences,
} from "@/lib/client/notifications";
import { preferenceRowsFor, toggledPreferences } from "@/lib/mobile-account";

export const NOTIFICATION_PREFERENCES_QUERY_KEY = [
  "notification-preferences",
] as const;

/** The muteable notification switches, shared by the phone and the web account menu. */
export function useNotificationPreferences() {
  const queryClient = useQueryClient();
  const { session } = useSession();

  const preferences = useQuery({
    queryKey: NOTIFICATION_PREFERENCES_QUERY_KEY,
    queryFn: getNotificationPreferences,
  });
  const save = useMutation({
    mutationFn: saveNotificationPreferences,
    // The switch moves at once; a failed save puts it back.
    onMutate: async (next: NotificationPreferences) => {
      await queryClient.cancelQueries({
        queryKey: NOTIFICATION_PREFERENCES_QUERY_KEY,
      });
      const previous = queryClient.getQueryData<NotificationPreferences>(
        NOTIFICATION_PREFERENCES_QUERY_KEY,
      );
      queryClient.setQueryData(NOTIFICATION_PREFERENCES_QUERY_KEY, next);
      return { previous };
    },
    onError: (_error, _next, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          NOTIFICATION_PREFERENCES_QUERY_KEY,
          context.previous,
        );
      }
    },
    onSuccess: (saved) =>
      queryClient.setQueryData(NOTIFICATION_PREFERENCES_QUERY_KEY, saved),
  });

  const toggle = (key: NotificationPreferenceKey) => {
    if (preferences.data) {
      save.mutate(toggledPreferences(preferences.data, key));
    }
  };

  return {
    preferences: preferences.data ?? null,
    preferencesError: Boolean(preferences.error),
    preferencesLoading: preferences.isLoading,
    rows: preferenceRowsFor(session?.role),
    saveFailed: Boolean(save.error),
    toggle,
  };
}
