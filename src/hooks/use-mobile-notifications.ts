"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import {
  NOTIFICATIONS_QUERY_KEY,
  useDashboardNotifications,
} from "@/hooks/use-dashboard-notifications";
import { markAllNotificationsRead } from "@/lib/client/notifications";
import { MOBILE_HOME } from "@/lib/mobile";
import {
  groupNotifications,
  mobileTargetFor,
} from "@/lib/mobile-notifications";
import type { DashboardNotification } from "@/types/landing";

export function useMobileNotifications() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("mobile");
  const notifications = useDashboardNotifications();
  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
  });

  const groups = useMemo(
    () => groupNotifications(notifications.notifications, t),
    [notifications.notifications, t],
  );

  const open = (notification: DashboardNotification) => {
    if (!notification.readAt) {
      void notifications.markRead(notification.id).catch(() => undefined);
    }
    router.push(mobileTargetFor(notification.category));
  };

  return {
    backHref: MOBILE_HOME,
    groups,
    hasUnread: notifications.unreadCount > 0,
    isError: Boolean(notifications.error),
    isLoading: notifications.isLoading,
    isMarkingAll: markAll.isPending,
    markAllRead: () => markAll.mutate(),
    open,
  };
}
