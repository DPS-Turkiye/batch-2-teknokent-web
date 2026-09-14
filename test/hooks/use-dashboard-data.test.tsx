import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { useDashboardData } from "@/hooks/use-dashboard-data";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { UserRole, type AppSession } from "@/interfaces/session";
import { createTestQueryClient } from "@test/test-utils";

const mockUseSession = vi.fn();
const mockUseMeetings = vi.fn();
const mockUseMentorshipRequests = vi.fn();

vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => mockUseSession(),
}));

vi.mock("@/hooks/use-meetings", () => ({
  useMeetings: () => mockUseMeetings(),
}));

vi.mock("@/hooks/use-mentorship-requests", () => ({
  useMentorshipRequests: () => mockUseMentorshipRequests(),
}));

vi.mock("@/lib/client/action-items", () => ({
  getActionItems: vi.fn().mockResolvedValue([]),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

function denizSession(): AppSession {
  return {
    userId: "mentee-1",
    email: "deniz.arslan@greenloop.demo",
    fullName: "Deniz Arslan",
    jobTitle: "Kurucu",
    organizationId: "org-1",
    organizationName: "GreenLoop",
    role: UserRole.Mentee,
  };
}

describe("useDashboardData", () => {
  it("does not show another demo account's fallback data while the real queries are still loading", () => {
    mockUseSession.mockReturnValue({ session: denizSession() });
    mockUseMeetings.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: true,
    });
    mockUseMentorshipRequests.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: true,
    });

    const { result } = renderHook(() => useDashboardData(), { wrapper });

    expect(result.current.displayName).toBe("Deniz");
    expect(result.current.organizationName).toBe("GreenLoop");
    expect(result.current.isFallback).toBe(false);
    expect(result.current.requests).toEqual([]);
    expect(result.current.nextMeeting).toBeNull();
  });

  it("does not show fallback demo data before the session itself has resolved", () => {
    mockUseSession.mockReturnValue({ session: null });
    mockUseMeetings.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: true,
    });
    mockUseMentorshipRequests.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: true,
    });

    const { result } = renderHook(() => useDashboardData(), { wrapper });

    expect(result.current.displayName).toBe("");
    expect(result.current.organizationName).toBe("");
    expect(result.current.requests).toEqual([]);
  });

  it("flags isFallback on a query error without injecting demo people", () => {
    mockUseSession.mockReturnValue({ session: denizSession() });
    mockUseMeetings.mockReturnValue({
      data: undefined,
      error: new Error("network down"),
      isLoading: false,
    });
    mockUseMentorshipRequests.mockReturnValue({
      data: undefined,
      error: new Error("network down"),
      isLoading: false,
    });

    const { result } = renderHook(() => useDashboardData(), { wrapper });

    expect(result.current.isFallback).toBe(true);
    expect(result.current.requests).toEqual([]);
    expect(result.current.nextMeeting).toBeNull();
  });

  it("passes through real data once the queries resolve", () => {
    mockUseSession.mockReturnValue({ session: denizSession() });
    mockUseMeetings.mockReturnValue({
      data: [
        {
          id: "m1",
          organizationId: "org-1",
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          durationMinutes: 30,
          agenda: "Gerçek toplantı",
          meetLink: "https://meet.google.com/abc-defg-hij",
          status: "SCHEDULED",
        },
      ],
      error: null,
      isLoading: false,
    });
    mockUseMentorshipRequests.mockReturnValue({
      data: [
        {
          id: "r1",
          requesterId: "mentee-1",
          organizationId: "org-1",
          mentorId: "mentor-1",
          mentorName: "Gerçek Mentor",
          supportArea: "Gerçek alan",
          status: MentorshipRequestStatus.Pending,
          mentorMessage: null,
          rejectionReason: null,
          createdAt: "2026-08-01T10:00:00+03:00",
          messages: [],
          recommendationSnapshot: null,
        },
      ],
      error: null,
      isLoading: false,
    });

    const { result } = renderHook(() => useDashboardData(), { wrapper });

    expect(result.current.isFallback).toBe(false);
    expect(result.current.requests).toHaveLength(1);
    expect(result.current.requests[0].mentorName).toBe("Gerçek Mentor");
    expect(result.current.nextMeeting?.agenda).toBe("Gerçek toplantı");
    expect(result.current.nextMeeting?.meetLink).toBe(
      "https://meet.google.com/abc-defg-hij",
    );
    expect(result.current.upcomingMeetings).toHaveLength(1);
  });
});
