"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useSession } from "@/components/providers/session-provider";
import { usePushDevice } from "@/hooks/use-push-device";
import type {
  NotificationPreferenceKey,
  NotificationPreferences,
} from "@/interfaces/notification";
import {
  getNotificationPreferences,
  saveNotificationPreferences,
} from "@/lib/client/notifications";
import { MOBILE_HOME, MOBILE_LOGIN } from "@/lib/mobile";
import {
  accountAvatarClass,
  accountChip,
  preferenceRowsFor,
  toggledPreferences,
  webEditLinkFor,
} from "@/lib/mobile-account";
import { unregisterPushDevice } from "@/lib/push-device";
import { initials } from "@/lib/utils";

export const NOTIFICATION_PREFERENCES_QUERY_KEY = [
  "notification-preferences",
] as const;

export function useMobileAccount() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session, logout } = useSession();
  const push = usePushDevice();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const role = session?.role;

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

  const signOut = async () => {
    setIsSigningOut(true);
    await unregisterPushDevice().catch(() => undefined);
    await logout();
    router.replace(MOBILE_LOGIN);
  };

  return {
    avatarClass: accountAvatarClass(role),
    backHref: MOBILE_HOME,
    chip: session ? accountChip(session) : "",
    email: session?.email ?? "",
    fullName: session?.fullName ?? "",
    initials: initials(session?.fullName ?? ""),
    isSigningOut,
    preferences: preferences.data ?? null,
    preferencesError: Boolean(preferences.error),
    preferencesLoading: preferences.isLoading,
    push,
    rows: preferenceRowsFor(role),
    saveFailed: Boolean(save.error),
    signOut,
    toggle,
    webEdit: webEditLinkFor(role),
  };
}
