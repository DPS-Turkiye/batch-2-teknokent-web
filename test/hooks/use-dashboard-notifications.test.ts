import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useDashboardNotifications } from "@/hooks/use-dashboard-notifications";
import { DASHBOARD_NOTIFICATIONS } from "@/lib/const";

describe("useDashboardNotifications", () => {
  it("returns an empty notification list until a real feed exists", () => {
    const { result } = renderHook(() => useDashboardNotifications());

    expect(result.current).toEqual({
      notifications: DASHBOARD_NOTIFICATIONS,
    });
    expect(result.current.notifications).toEqual([]);
  });

  it("keeps the notification list stable and readable", () => {
    const { result } = renderHook(() => useDashboardNotifications());

    expect(Array.isArray(result.current.notifications)).toBe(true);
    expect(
      result.current.notifications.every(
        (item) => typeof item.title === "string",
      ),
    ).toBe(true);
    expect(
      result.current.notifications.every(
        (item) => typeof item.time === "string",
      ),
    ).toBe(true);
  });
});
