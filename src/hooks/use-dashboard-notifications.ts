"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteNotification,
  getNotifications,
  markNotificationRead,
} from "@/lib/client/notifications";

export type { DashboardNotification } from "@/types/landing";

const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;

export function useDashboardNotifications() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: getNotifications,
    staleTime: 30_000,
  });
  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: (updated) => {
      queryClient.setQueryData(
        NOTIFICATIONS_QUERY_KEY,
        (current: typeof query.data) =>
          current?.map((notification) =>
            notification.id === updated.id ? updated : notification,
          ),
      );
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(
        NOTIFICATIONS_QUERY_KEY,
        (current: typeof query.data) =>
          current?.filter((notification) => notification.id !== deletedId),
      );
    },
  });
  const notifications = query.data ?? [];

  return {
    deleteNotification: deleteMutation.mutateAsync,
    error: query.error,
    isLoading: query.isLoading,
    markRead: readMutation.mutateAsync,
    notifications,
    unreadCount: notifications.filter((notification) => !notification.readAt)
      .length,
  };
}
