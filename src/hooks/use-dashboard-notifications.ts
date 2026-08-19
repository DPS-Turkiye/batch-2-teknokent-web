import { DASHBOARD_NOTIFICATIONS } from "@/lib/const";

export type { DashboardNotification } from "@/types/landing";

export function useDashboardNotifications() {
  return {
    notifications: DASHBOARD_NOTIFICATIONS,
  };
}
