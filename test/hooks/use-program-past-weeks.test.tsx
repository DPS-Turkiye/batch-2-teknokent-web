import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  PROGRAM_PAST_WEEKS_QUERY_KEY,
  useProgramPastWeeks,
} from "@/hooks/use-program-past-weeks";
import { ClientApiError } from "@/lib/client/api";
import { getProgramWeeksSoFar } from "@/lib/client/program-weeks";
import { weekSoFar, weeksSoFar } from "@test/fixtures/program-week";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/program-weeks", () => ({
  getProgramWeeksSoFar: vi.fn(),
}));

let queryClient = createTestQueryClient();

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useProgramPastWeeks", () => {
  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.mocked(getProgramWeeksSoFar).mockReset().mockResolvedValue(weeksSoFar());
  });

  it("keeps the weeks already shown when a later refetch fails", async () => {
    const { result } = renderHook(() => useProgramPastWeeks(), { wrapper });
    await waitFor(() => expect(result.current.weeks).toHaveLength(2));

    vi.mocked(getProgramWeeksSoFar).mockRejectedValue(
      new ClientApiError("Sunucu hatası", 502),
    );
    await act(() =>
      queryClient.refetchQueries({ queryKey: PROGRAM_PAST_WEEKS_QUERY_KEY }),
    );

    expect(result.current.error).toBeNull();
    expect(result.current.weeks).toHaveLength(2);
    expect(result.current.hidden).toBe(false);
  });

  it("is hidden while loading, then lists the past weeks newest first without the running one", async () => {
    const { result } = renderHook(() => useProgramPastWeeks(), { wrapper });
    expect(result.current.hidden).toBe(true);

    await waitFor(() => expect(result.current.hidden).toBe(false));
    expect(result.current.weeks.map((week) => week.plan.week)).toEqual([2, 1]);
    expect(result.current.error).toBeNull();
  });

  it("stays hidden in the first week, when nothing is behind the participant yet", async () => {
    vi.mocked(getProgramWeeksSoFar).mockResolvedValue(
      weeksSoFar({ currentWeek: 1, weeks: [weekSoFar(1, { current: true })] }),
    );
    const { result } = renderHook(() => useProgramPastWeeks(), { wrapper });

    await waitFor(() => expect(getProgramWeeksSoFar).toHaveBeenCalled());
    await waitFor(() => expect(result.current.weeks).toEqual([]));
    expect(result.current.hidden).toBe(true);
  });

  it.each([403, 404])(
    "stays hidden for someone outside a program (%i)",
    async (status) => {
      vi.mocked(getProgramWeeksSoFar).mockRejectedValue(
        new ClientApiError("Yok", status),
      );
      const { result } = renderHook(() => useProgramPastWeeks(), { wrapper });

      await waitFor(() => expect(getProgramWeeksSoFar).toHaveBeenCalled());
      await waitFor(() => expect(result.current.hidden).toBe(true));
      expect(result.current.error).toBeNull();
    },
  );

  it("shows any other failure", async () => {
    vi.mocked(getProgramWeeksSoFar).mockRejectedValue(
      new ClientApiError("Sunucu hatası", 502),
    );
    const { result } = renderHook(() => useProgramPastWeeks(), { wrapper });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.hidden).toBe(false);
  });
});
