import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMobileMentorHome } from "@/hooks/use-mobile-mentor-home";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import { getMeetings } from "@/lib/client/meetings";
import { getMentorRequests } from "@/lib/client/mentor-requests";
import { getPrograms } from "@/lib/client/programs";
import {
  menteeMeetingFixture,
  menteeRequestFixture,
} from "@test/fixtures/mentee-home";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({
    session: { userId: "mentor-1", fullName: "Nihan Öztürk" },
  }),
}));
vi.mock("@/hooks/use-dashboard-notifications", () => ({
  useDashboardNotifications: () => ({ unreadCount: 0 }),
}));
vi.mock("@/lib/client/mentor-requests", () => ({ getMentorRequests: vi.fn() }));
vi.mock("@/lib/client/meetings", () => ({ getMeetings: vi.fn() }));
vi.mock("@/lib/client/programs", () => ({ getPrograms: vi.fn() }));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getMentorRequests).mockResolvedValue([
    menteeRequestFixture({
      organizationId: "atlas",
      organizationName: "Atlas AI",
      status: MentorshipRequestStatus.Accepted,
    }),
  ]);
  vi.mocked(getMeetings).mockResolvedValue([
    menteeMeetingFixture({
      organizationId: "atlas",
      organizationName: "Atlas AI",
      scheduledAt: new Date(2030, 0, 10, 14, 0).toISOString(),
    }),
  ]);
});

describe("useMobileMentorHome", () => {
  it("builds the next meeting and startups from the mentor's own requests", async () => {
    vi.mocked(getPrograms).mockResolvedValue([]);
    const { result } = renderHook(() => useMobileMentorHome(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(getMentorRequests).toHaveBeenCalledWith(UserRole.Mentor);
    expect(result.current.firstName).toBe("Nihan");
    expect(result.current.nextMeeting?.startupName).toBe("Atlas AI");
    expect(result.current.startups.map((row) => row.name)).toEqual([
      "Atlas AI",
    ]);
  });

  it("still shows startups when the program list cannot be read", async () => {
    vi.mocked(getPrograms).mockRejectedValue(new Error("403"));
    const { result } = renderHook(() => useMobileMentorHome(), { wrapper });

    await waitFor(() => expect(result.current.startups).toHaveLength(1));
    expect(result.current.startups[0]?.program).toBeNull();
    expect(result.current.isError).toBe(false);
  });
});
