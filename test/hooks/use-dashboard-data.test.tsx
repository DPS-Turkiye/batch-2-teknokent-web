import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useDashboardData } from "@/hooks/use-dashboard-data";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { UserRole, type AppSession } from "@/interfaces/session";

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

    const { result } = renderHook(() => useDashboardData());

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

    const { result } = renderHook(() => useDashboardData());

    expect(result.current.displayName).toBe("");
    expect(result.current.organizationName).toBe("");
    expect(result.current.requests).toEqual([]);
  });

  it("falls back to demo content and flags isFallback only on an actual query error", () => {
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

    const { result } = renderHook(() => useDashboardData());

    expect(result.current.isFallback).toBe(true);
    expect(result.current.requests.length).toBeGreaterThan(0);
    expect(result.current.nextMeeting).not.toBeNull();
  });

  it("passes through real data once the queries resolve", () => {
    mockUseSession.mockReturnValue({ session: denizSession() });
    mockUseMeetings.mockReturnValue({
      data: [
        {
          id: "m1",
          organizationId: "org-1",
          scheduledAt: "2026-08-30T10:00:00+03:00",
          durationMinutes: 30,
          agenda: "Gerçek toplantı",
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

    const { result } = renderHook(() => useDashboardData());

    expect(result.current.isFallback).toBe(false);
    expect(result.current.requests).toHaveLength(1);
    expect(result.current.requests[0].mentorName).toBe("Gerçek Mentor");
    expect(result.current.nextMeeting?.agenda).toBe("Gerçek toplantı");
  });
});
