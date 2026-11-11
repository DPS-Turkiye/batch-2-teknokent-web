import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMobileHome } from "@/hooks/use-mobile-home";
import {
  menteeMeetingFixture,
  menteeRequestFixture,
} from "@test/fixtures/mentee-home";
import { createTestQueryClient } from "@test/test-utils";

let dashboard: Record<string, unknown>;
let unreadCount = 0;
const meetings = [
  menteeMeetingFixture({ id: "past", mentorId: "mentor-1" }),
  menteeMeetingFixture({
    id: "next",
    mentorId: "mentor-1",
    mentorName: "Barış Öztürk",
    scheduledAt: new Date(2030, 0, 10, 10, 0).toISOString(),
  }),
];

vi.mock("@/hooks/use-dashboard-data", () => ({
  useDashboardData: () => dashboard,
}));
vi.mock("@/hooks/use-meetings", () => ({
  useMeetings: () => ({ data: meetings }),
}));
vi.mock("@/hooks/use-dashboard-notifications", () => ({
  useDashboardNotifications: () => ({ unreadCount }),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

beforeEach(() => {
  unreadCount = 0;
  dashboard = {
    displayName: "Gamze",
    homeTasks: [],
    isFallback: false,
    isLoading: false,
    isLoadingActionItems: false,
    isLoadingFeedback: false,
    nextMeeting: meetings[1],
    requests: [menteeRequestFixture()],
  };
});

describe("useMobileHome", () => {
  it("numbers the next meeting among all meetings with that mentor, past ones included", () => {
    const { result } = renderHook(() => useMobileHome(), { wrapper });

    expect(result.current.nextMeeting?.mentorDetail).toBe("2. görüşme");
    expect(result.current.firstName).toBe("Gamze");
  });

  it("reports an error instead of the dashboard's demo fallback", () => {
    dashboard = { ...dashboard, isFallback: true };
    const { result } = renderHook(() => useMobileHome(), { wrapper });

    expect(result.current.isError).toBe(true);
  });

  it("flags unread notifications for the bell", () => {
    unreadCount = 2;
    const { result } = renderHook(() => useMobileHome(), { wrapper });

    expect(result.current.hasUnreadNotifications).toBe(true);
  });
});
