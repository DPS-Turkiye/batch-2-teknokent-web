import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useDashboardNotifications } from "@/hooks/use-dashboard-notifications";
import { DASHBOARD_NOTIFICATIONS } from "@/lib/const";

describe("useDashboardNotifications", () => {
  it("returns the dashboard notifications array from the shared constant", () => {
    const { result } = renderHook(() => useDashboardNotifications());

    expect(result.current).toEqual({
      notifications: DASHBOARD_NOTIFICATIONS,
    });
    expect(result.current.notifications).toHaveLength(3);
    expect(result.current.notifications[0]).toMatchObject({
      title: "Dr. Kemal Arslan toplantı notu ekledi",
      time: "2s önce · Mentordan",
    });
  });

  it("keeps the notification list stable and readable", () => {
    const { result } = renderHook(() => useDashboardNotifications());

    expect(Array.isArray(result.current.notifications)).toBe(true);
    expect(result.current.notifications.every((item) => typeof item.title === "string")).toBe(true);
    expect(result.current.notifications.every((item) => typeof item.time === "string")).toBe(true);
  });
});
