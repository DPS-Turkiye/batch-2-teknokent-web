import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMemberProfileLinks } from "@/hooks/use-member-profile-links";
import type { RegularMentorship } from "@/interfaces/regular-mentorship";
import { UserRole, type AppSession } from "@/interfaces/session";
import { getMentorRequests } from "@/lib/client/mentor-requests";
import { getRegularMentorships } from "@/lib/client/mentorships";
import { mentorshipRequest } from "@test/fixtures/mentorship-requests";
import { appSession } from "@test/fixtures/session";
import { createTestQueryClient } from "@test/test-utils";

const mockSession = vi.fn<() => AppSession | null>();

vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => mockSession(),
}));
vi.mock("@/lib/client/mentor-requests", () => ({
  getMentorRequests: vi.fn(),
}));
vi.mock("@/lib/client/mentorships", () => ({
  getRegularMentorships: vi.fn(),
}));

function session(role: UserRole): AppSession {
  return appSession({ userId: "viewer-1", role, organizationId: "own" });
}

const request = mentorshipRequest({
  organizationId: "asked",
  mentorId: "viewer-1",
});

const mentorship: RegularMentorship = {
  id: "ms-1",
  mentorId: "viewer-1",
  mentorName: "Örnek Mentor",
  organizationId: "mentored",
  organizationName: "Başka Girişim",
  status: "ACTIVE",
  startDate: "2026-10-01",
  endDate: null,
  daysPerWeek: 1,
  goals: null,
  goalItems: [],
  progressPercent: 0,
};

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

describe("useMemberProfileLinks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMentorRequests).mockResolvedValue([request]);
    vi.mocked(getRegularMentorships).mockResolvedValue([mentorship]);
  });

  it("opens a mentor's requesting and mentored startups once their lists load", async () => {
    mockSession.mockReturnValue(session(UserRole.Mentor));
    const { result } = renderHook(() => useMemberProfileLinks(), { wrapper });

    await waitFor(() => {
      expect(result.current("mentored")).toBe(true);
    });
    expect(result.current("asked")).toBe(true);
    expect(result.current("unrelated")).toBe(false);
    expect(getMentorRequests).toHaveBeenCalledWith(UserRole.Mentor);
  });

  it("does not fetch mentor lists for a mentee and opens only their team", () => {
    mockSession.mockReturnValue(session(UserRole.Mentee));
    const { result } = renderHook(() => useMemberProfileLinks(), { wrapper });

    expect(result.current("own")).toBe(true);
    expect(result.current("asked")).toBe(false);
    expect(getMentorRequests).not.toHaveBeenCalled();
    expect(getRegularMentorships).not.toHaveBeenCalled();
  });

  it("opens nobody without a session", () => {
    mockSession.mockReturnValue(null);
    const { result } = renderHook(() => useMemberProfileLinks(), { wrapper });

    expect(result.current("own")).toBe(false);
  });
});
