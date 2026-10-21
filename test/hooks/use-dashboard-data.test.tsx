import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { useDashboardData } from "@/hooks/use-dashboard-data";
import { ActionItemStatus } from "@/interfaces/action-item";
import { MeetingStatus } from "@/interfaces/meeting";
import { getActionItems } from "@/lib/client/action-items";
import { getMeetingTodos } from "@/lib/client/meeting-notes";
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

vi.mock("@/lib/client/meetings", () => ({
  getRatedMeetingIds: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/client/meeting-notes", () => ({
  getMeetingTodos: vi.fn().mockResolvedValue([]),
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
          status: MeetingStatus.Scheduled,
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

  it("ties open action items and held meetings back to their mentorship", async () => {
    const day = 24 * 60 * 60 * 1000;
    mockUseSession.mockReturnValue({ session: denizSession() });
    mockUseMeetings.mockReturnValue({
      data: [
        {
          id: "next",
          organizationId: "org-1",
          mentorId: "mentor-1",
          mentorshipRequestId: "r1",
          scheduledAt: new Date(Date.now() + 2 * day).toISOString(),
          durationMinutes: 45,
          status: MeetingStatus.Scheduled,
        },
        {
          id: "held",
          organizationId: "org-1",
          mentorId: "mentor-1",
          mentorshipRequestId: "r1",
          scheduledAt: new Date(Date.now() - 3 * day).toISOString(),
          durationMinutes: 45,
          status: MeetingStatus.Scheduled,
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
          mentorName: "Selin Kaya",
          supportArea: "Finans",
          status: MentorshipRequestStatus.Accepted,
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
    vi.mocked(getActionItems).mockResolvedValueOnce([
      {
        id: "a1",
        organizationId: "org-1",
        ownerId: "mentor-1",
        title: "KPI dosyasını paylaş",
        status: ActionItemStatus.Open,
        dueDate: "2026-01-01",
        createdAt: "2026-08-01T10:00:00Z",
        updatedAt: "2026-08-01T10:00:00Z",
      },
    ]);
    vi.mocked(getMeetingTodos).mockResolvedValueOnce([
      {
        id: "t1",
        meetingId: "held",
        title: "Nakit akışını çıkar",
        done: false,
        displayOrder: 0,
      },
    ]);

    const { result } = renderHook(() => useDashboardData(), { wrapper });

    await waitFor(() => expect(result.current.homeTasks).toHaveLength(2));
    expect(result.current.homeTasks[0]).toMatchObject({
      title: "KPI dosyasını paylaş",
      subtitle: "Selin Kaya · Finans",
      href: "/mentor-request/status?id=r1",
    });
    expect(result.current.homeTasks[1]).toMatchObject({
      title: "Toplantıyı değerlendir",
      subtitle: "Selin Kaya · Finans",
      href: "/meetings/research/feedback?id=held",
    });
    expect(result.current.openActionCountByRequest).toEqual({ r1: 1 });
    expect(result.current.nextMeetingByRequest.r1?.id).toBe("next");
    expect(result.current.otherUpcomingMeetings).toEqual([]);
    expect(result.current.noteMeetings.map((meeting) => meeting.id)).toEqual([
      "held",
    ]);
    expect(result.current.heldMeetingCount).toBe(1);
    await waitFor(() =>
      expect(result.current.openTodoCounts.get("held")).toBe(1),
    );
  });
});
