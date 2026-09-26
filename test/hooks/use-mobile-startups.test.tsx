import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StartupTab, useMobileStartups } from "@/hooks/use-mobile-startups";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import { getMeetings } from "@/lib/client/meetings";
import { getMentorRequests } from "@/lib/client/mentor-requests";
import { getRegularMentorships } from "@/lib/client/mentorships";
import { getPrograms } from "@/lib/client/programs";
import { menteeRequestFixture } from "@test/fixtures/mentee-home";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({ session: { userId: "mentor-1" } }),
}));
vi.mock("@/lib/client/mentor-requests", () => ({ getMentorRequests: vi.fn() }));
vi.mock("@/lib/client/meetings", () => ({ getMeetings: vi.fn() }));
vi.mock("@/lib/client/programs", () => ({ getPrograms: vi.fn() }));
vi.mock("@/lib/client/mentorships", () => ({ getRegularMentorships: vi.fn() }));

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
    menteeRequestFixture({
      id: "r2",
      organizationId: "lumen",
      organizationName: "Lumen",
      status: MentorshipRequestStatus.Accepted,
    }),
  ]);
  vi.mocked(getMeetings).mockResolvedValue([]);
  vi.mocked(getPrograms).mockResolvedValue([]);
  vi.mocked(getRegularMentorships).mockResolvedValue([]);
});

describe("useMobileStartups", () => {
  it("counts the mentor's own active startups", async () => {
    const { result } = renderHook(() => useMobileStartups(), { wrapper });

    await waitFor(() => expect(result.current.counts.active).toBe(2));
    expect(getRegularMentorships).toHaveBeenCalledWith(UserRole.Mentor);
  });

  it("finds a startup by name and switches tabs", async () => {
    const { result } = renderHook(() => useMobileStartups(), { wrapper });
    await waitFor(() => expect(result.current.counts.active).toBe(2));

    act(() => result.current.toggleSearch());
    act(() => result.current.setQuery("lum"));

    expect(result.current.isSearching).toBe(true);
    expect(result.current.shown.map((card) => card.name)).toEqual(["Lumen"]);

    act(() => result.current.setTab(StartupTab.Past));
    expect(result.current.shown).toEqual([]);
  });
});
