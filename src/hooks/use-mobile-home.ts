"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useDashboardNotifications } from "@/hooks/use-dashboard-notifications";
import { useMeetings } from "@/hooks/use-meetings";
import { useOnlineStatus } from "@/hooks/use-online-status";
import {
  meetingSummary,
  messagePreviews,
  taskPreviews,
} from "@/lib/mobile-home";

export function useMobileHome() {
  const queryClient = useQueryClient();
  const dashboard = useDashboardData();
  const meetingsQuery = useMeetings();
  const { unreadCount } = useDashboardNotifications();
  const isOnline = useOnlineStatus();

  const nextMeeting = useMemo(
    () =>
      dashboard.nextMeeting
        ? meetingSummary(dashboard.nextMeeting, meetingsQuery.data ?? [])
        : null,
    [dashboard.nextMeeting, meetingsQuery.data],
  );
  const messages = useMemo(
    () => messagePreviews(dashboard.requests),
    [dashboard.requests],
  );

  return {
    firstName: dashboard.displayName,
    hasUnreadNotifications: unreadCount > 0,
    isOnline,
    // The web dashboard falls back to demo rows on error; the phone shows the error instead.
    isError: dashboard.isFallback,
    isLoading: dashboard.isLoading,
    isLoadingTasks:
      dashboard.isLoadingActionItems || dashboard.isLoadingFeedback,
    messages,
    nextMeeting,
    retry: () => queryClient.invalidateQueries(),
    tasks: taskPreviews(dashboard.homeTasks),
  };
}
