import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PROGRAM_THIS_WEEK_QUERY_KEY } from "@/hooks/use-program-this-week";
import { useSoftwareDevelopmentCard } from "@/hooks/use-software-development-card";
import { StartupStageState } from "@/interfaces/startup-process";
import { ClientApiError } from "@/lib/client/api";
import { getProgramThisWeek } from "@/lib/client/program-weeks";
import { MENTORSHIPS_ACTIVE_HREF } from "@/lib/const";
import { thisWeek } from "@test/fixtures/program-week";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/program-weeks", () => ({
  getProgramThisWeek: vi.fn(),
}));

let queryClient = createTestQueryClient();

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useSoftwareDevelopmentCard", () => {
  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.mocked(getProgramThisWeek).mockReset().mockResolvedValue(thisWeek());
  });

  it("is hidden while loading, then runs over the program's dates with a link to the mentorships", async () => {
    const { result } = renderHook(() => useSoftwareDevelopmentCard(), {
      wrapper,
    });
    expect(result.current).toBeNull();

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current).toEqual({
      state: StartupStageState.Current,
      dates: { startsOn: "2026-10-05", endsOn: "2026-12-27" },
      mentorshipsHref: MENTORSHIPS_ACTIVE_HREF,
    });
  });

  it("stays hidden for a team in no program", async () => {
    vi.mocked(getProgramThisWeek).mockRejectedValue(
      new ClientApiError("Program bulunamadı", 404),
    );
    const { result } = renderHook(() => useSoftwareDevelopmentCard(), {
      wrapper,
    });

    await waitFor(() =>
      expect(
        queryClient.getQueryState(PROGRAM_THIS_WEEK_QUERY_KEY)?.status,
      ).toBe("error"),
    );
    expect(result.current).toBeNull();
  });
});
